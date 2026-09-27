const sequelize = require(
  "../src/config/database"
);

const {
  runGarchNormalMultiHorizonV1Evaluation,
} = require(
  "../src/modules/forecasting/services/runGarchNormalMultiHorizonV1Evaluation.service"
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

    console.log(
      "Running persistent multi-horizon GARCH evaluation..."
    );

    const result =
      await runGarchNormalMultiHorizonV1Evaluation({
        datasetId,

        evaluationStartAt:
          EVALUATION_START,

        evaluationEndAt:
          EVALUATION_END,
      });

    console.log(
      "\nMulti-horizon AnalysisRun created."
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      datasetId:
        result.datasetId,

      engineVersion:
        result.engineVersion,

      model:
        result.model,

      protocol:
        result.protocol,

      protocolChecksum:
        result.protocolChecksum,

      comparisonChecksum:
        result.comparisonChecksum,

      modelCalls:
        result
          .metrics
          .singlePass
          .modelCalls,

      diagnostics:
        result
          .metrics
          .singlePass
          .diagnostics,
    });

    console.table(
      Object.values(
        result
          .metrics
          .horizons
      ).map(
        (item) => ({
          horizon:
            item.name,

          N:
            item
              .sample
              .candidate
              .evaluatedForecasts,

          baselineQLIKE:
            item
              .baseline
              .qlike
              .mean,

          garchQLIKE:
            item
              .candidate
              .qlike
              .mean,

          qlikeImprovementPct:
            item
              .relativeImprovement
              .meanQLIKE *
            100,

          bootstrapSupportsGarch:
            item
              .comparison
              .qlike
              .bootstrap
              .confidenceInterval
              .supportsCandidate,
        })
      )
    );
  } catch (error) {
    console.error(
      "Persistent multi-horizon GARCH evaluation failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();