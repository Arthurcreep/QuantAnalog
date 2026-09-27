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

const {
  evaluateGarchNormalV1,
} = require(
  "../src/modules/forecasting/walkForward/evaluateGarchNormalV1"
);

const {
  GARCH_NORMAL_V1,
} = require(
  "../src/modules/forecasting/protocols/garchNormalV1"
);

const {
  auditGarchWalkForward,
} = require(
  "../src/modules/forecasting/evaluation/auditGarchWalkForward"
);

const EVALUATION_START =
  "2025-01-01T00:00:00.000Z";

const EVALUATION_END =
  "2026-09-20T14:00:00.000Z";

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

    const timeframeMs =
      timeframeToMilliseconds(
        dataset
          .sourceTimeframe
      );

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset
            .sourceTimeframe,

        incompletePolicy:
          "DROP_INCOMPLETE",
      });

    console.log(
      "Running baseline..."
    );

    const baseline =
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
          EVALUATION_START,

        evaluationEndAt:
          EVALUATION_END,
      });

    console.log(
      "Running GARCH_NORMAL_V1..."
    );

    const garch =
      evaluateGarchNormalV1({
        series:
          returns.series,

        expectedIntervalMs:
          timeframeMs,

        evaluationStartAt:
          EVALUATION_START,

        evaluationEndAt:
          EVALUATION_END,
      });

    const audit =
      auditGarchWalkForward({
        baselineRows:
          baseline.rows,

        garchRows:
          garch.rows,

        diagnostics:
          garch.diagnostics,

        persistenceMaximum:
          GARCH_NORMAL_V1
            .constraints
            .persistenceMaximum,

        maxIterations:
          GARCH_NORMAL_V1
            .optimization
            .maxIterations,
      });

    console.log(
      "\nBTC GARCH Normal V1 audit completed."
    );

    console.log(
      "\n===== FIT CONVERGENCE ====="
    );

    console.log({
      fitCount:
        audit.fitCount,

      ...audit.convergence,
    });

    console.log(
      "\n===== PERSISTENCE DISTRIBUTION ====="
    );

    console.log(
      audit.persistence
    );

    console.log(
      "\n===== ITERATION DISTRIBUTION ====="
    );

    console.log(
      audit.iterations
    );

    console.log(
      "\n===== NLL IMPROVEMENT DISTRIBUTION ====="
    );

    console.log(
      audit
        .likelihoodImprovement
    );

    console.log(
      "\n===== FORECAST EXPOSURE ====="
    );

    console.log(
      audit.forecastExposure
    );

    console.log(
      "\n===== LOSS: CONVERGED FITS ====="
    );

    console.dir(
      audit
        .lossByFitConvergence
        .converged,
      {
        depth:
          null,
      }
    );

    console.log(
      "\n===== LOSS: NON-CONVERGED FITS ====="
    );

    console.dir(
      audit
        .lossByFitConvergence
        .nonConverged,
      {
        depth:
          null,
      }
    );

    console.log(
      "\n===== FIRST 10 NON-CONVERGED FITS ====="
    );

    const nonConverged =
      audit
        .fitSummaries
        .filter(
          (fit) =>
            !fit.converged
        )
        .slice(
          0,
          10
        );

    console.dir(
      nonConverged,
      {
        depth:
          null,
      }
    );

    console.log(
      "\n===== LAST 10 FITS ====="
    );

    console.dir(
      audit
        .fitSummaries
        .slice(
          -10
        ),
      {
        depth:
          null,
      }
    );
  } catch (error) {
    console.error(
      "BTC GARCH Normal V1 audit failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();