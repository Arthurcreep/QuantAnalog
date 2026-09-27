const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  findAnalysisRunById,
} = require(
  "../src/modules/research/runs/analysisRun.repository"
);

const {
  runHistoricalVolatilityWalkForward,
} = require(
  "../src/modules/forecasting/services/runHistoricalVolatilityWalkForward.service"
);

const run = async () => {
  const datasetId =
    process.argv[2];

  if (!datasetId) {
    throw new Error(
      "DATASET_ID_REQUIRED"
    );
  }

  let transaction;

  try {
    await sequelize.authenticate();

    transaction =
      await sequelize.transaction();

    const result =
      await runHistoricalVolatilityWalkForward(
        {
          datasetId,

          lookbackBars:
            168,

          horizonBars:
            1,

          evaluationStartAt:
            "2025-01-01T00:00:00.000Z",

          evaluationEndAt:
            "2026-09-20T14:00:00.000Z",
        },
        {
          transaction,
        }
      );

    const stored =
      await findAnalysisRunById(
        result.analysisRunId,
        {
          transaction,
        }
      );

    assert.ok(
      stored,
      "FORECAST_WALK_FORWARD_ANALYSIS_RUN_NOT_FOUND"
    );

    assert.strictEqual(
      stored.runType,
      "FORECAST_WALK_FORWARD"
    );

    assert.strictEqual(
      stored.engineVersion,
      "forecast-walk-forward-v1.0"
    );

    assert.strictEqual(
      stored.datasetId,
      datasetId
    );

    assert.strictEqual(
      stored
        .config
        .model
        .id,
      "HISTORICAL_VOLATILITY_BASELINE"
    );

    assert.strictEqual(
      stored
        .config
        .model
        .version,
      "1.0.0"
    );

    assert.strictEqual(
      stored
        .config
        .model
        .checksum
        .length,
      64
    );

    assert.strictEqual(
      stored
        .config
        .modelTimeframe,
      "1h"
    );

    assert.strictEqual(
      stored
        .config
        .lookbackBars,
      168
    );

    assert.strictEqual(
      stored
        .config
        .horizonBars,
      1
    );

    assert.strictEqual(
      stored
        .metrics
        .sample
        .evaluatedForecasts,
      15063
    );

    assert.strictEqual(
      stored
        .metrics
        .sample
        .skippedLookbackGap,
      0
    );

    assert.strictEqual(
      stored
        .metrics
        .sample
        .skippedMissingTarget,
      0
    );

    assert.ok(
      Number.isFinite(
        stored
          .metrics
          .aggregate
          .volatility
          .mae
      )
    );

    assert.ok(
      Number.isFinite(
        stored
          .metrics
          .aggregate
          .volatility
          .rmse
      )
    );

    assert.ok(
      Number.isFinite(
        stored
          .metrics
          .aggregate
          .qlike
          .mean
      )
    );

    assert.strictEqual(
      stored
        .metrics
        .boundaryForecasts
        .first
        .issuedAt,
      "2025-01-01T00:00:00.000Z"
    );

    assert.strictEqual(
      stored
        .metrics
        .boundaryForecasts
        .last
        .issuedAt,
      "2026-09-20T14:00:00.000Z"
    );

    console.log(
      "Forecast walk-forward AnalysisRun test passed."
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      datasetId:
        result.datasetId,

      runType:
        result.runType,

      engineVersion:
        result.engineVersion,

      model:
        `${result.modelId}@${result.modelVersion}`,

      modelChecksum:
        result.modelChecksum,

      evaluatedForecasts:
        result
          .metrics
          .sample
          .evaluatedForecasts,

      volatilityMAE:
        result
          .metrics
          .aggregate
          .volatility
          .mae,

      volatilityRMSE:
        result
          .metrics
          .aggregate
          .volatility
          .rmse,

      volatilityBias:
        result
          .metrics
          .aggregate
          .volatility
          .bias,

      meanQLIKE:
        result
          .metrics
          .aggregate
          .qlike
          .mean,

      medianQLIKE:
        result
          .metrics
          .aggregate
          .qlike
          .median,
    });
  } catch (error) {
    console.error(
      "Forecast walk-forward AnalysisRun test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    if (transaction) {
      await transaction.rollback();
    }

    await sequelize.close();
  }
};

run();