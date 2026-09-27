const sequelize = require(
  "../src/config/database"
);

const {
  findDatasetById,
} = require(
  "../src/modules/datasets/repositories/dataset.repository"
);

const {
  timeframeToMilliseconds,
} = require(
  "../src/modules/datasets/calculations/timeframeToMilliseconds"
);

const {
  buildLogReturnSeries,
} = require(
  "../src/modules/research/series/buildLogReturnSeries"
);

const {
  evaluateHistoricalVolatilityBaseline,
} = require(
  "../src/modules/forecasting/walkForward/evaluateHistoricalVolatilityBaseline"
);

const run = async () => {
  try {
    const datasetId =
      process.argv[2];

    if (!datasetId) {
      throw new Error(
        "DATASET_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

    const dataset =
      await findDatasetById(
        datasetId
      );

    if (!dataset) {
      throw new Error(
        "DATASET_NOT_FOUND"
      );
    }

    if (
      dataset.stage !==
        "PREPARED" ||
      dataset.sourceTimeframe !==
        "1h"
    ) {
      throw new Error(
        "WALK_FORWARD_REQUIRES_PREPARED_1H_DATASET"
      );
    }

    const timeframeMs =
      timeframeToMilliseconds(
        dataset.sourceTimeframe
      );

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          "DROP_INCOMPLETE",
      });

    /*
     * First honest OOS benchmark.
     *
     * Match the same retrospective
     * validation era already used
     * by Research: 2025 onward.
     */

    const result =
      evaluateHistoricalVolatilityBaseline({
        series:
          returns.series,

        lookbackBars:
          168,

        horizonBars:
          1,

        expectedIntervalMs:
          timeframeMs,

        evaluationStartAt:
          "2025-01-01T00:00:00.000Z",

        evaluationEndAt:
          "2026-09-20T14:00:00.000Z",
      });

    console.log(
      "BTC historical volatility baseline walk-forward completed."
    );

    console.log(
      "\n===== CONFIG ====="
    );

    console.log({
      datasetId:
        dataset.id,

      datasetChecksum:
        dataset.checksum,

      timeframe:
        dataset.sourceTimeframe,

      model:
        `${result.model.id}@${result.model.version}`,

      lookbackBars:
        result
          .config
          .lookbackBars,

      horizonBars:
        result
          .config
          .horizonBars,

      evaluationStartAt:
        result
          .config
          .evaluationStartAt,

      evaluationEndAt:
        result
          .config
          .evaluationEndAt,
    });

    console.log(
      "\n===== SAMPLE ====="
    );

    console.log(
      result.sample
    );

    console.log(
      "\n===== OOS METRICS ====="
    );

    console.log({
      count:
        result
          .aggregate
          .count,

      volatilityMAE:
        result
          .aggregate
          .volatility
          .mae,

      volatilityRMSE:
        result
          .aggregate
          .volatility
          .rmse,

      volatilityMedianAE:
        result
          .aggregate
          .volatility
          .medianAbsoluteError,

      volatilityBias:
        result
          .aggregate
          .volatility
          .bias,

      varianceMAE:
        result
          .aggregate
          .variance
          .mae,

      varianceRMSE:
        result
          .aggregate
          .variance
          .rmse,

      varianceBias:
        result
          .aggregate
          .variance
          .bias,

      meanQLIKE:
        result
          .aggregate
          .qlike
          .mean,

      medianQLIKE:
        result
          .aggregate
          .qlike
          .median,
    });

    console.log(
      "\n===== FIRST FORECAST ====="
    );

    console.log(
      result.rows[0] ||
      null
    );

    console.log(
      "\n===== LAST FORECAST ====="
    );

    console.log(
      result.rows[
        result.rows.length - 1
      ] ||
      null
    );
  } catch (error) {
    console.error(
      "BTC historical volatility baseline walk-forward failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();