const sequelize = require(
  "../src/config/database"
);

const {
  runGarchNormalV1Evaluation,
} = require(
  "../src/modules/forecasting/services/runGarchNormalV1Evaluation.service"
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
      "Running persistent GARCH_NORMAL_V1 evaluation..."
    );

    const result =
      await runGarchNormalV1Evaluation({
        datasetId,

        evaluationStartAt:
          EVALUATION_START,

        evaluationEndAt:
          EVALUATION_END,
      });

    console.log(
      "\nGARCH Normal V1 persistent AnalysisRun created."
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
        result.model,

      protocol:
        result.protocol,

      garchProtocolChecksum:
        result
          .garchProtocolChecksum,

      comparisonProtocolChecksum:
        result
          .comparisonProtocolChecksum,

      evaluatedForecasts:
        result
          .metrics
          .sample
          .candidate
          .evaluatedForecasts,

      meanQLIKE:
        result
          .metrics
          .candidate
          .qlike
          .mean,

      meanQLIKEImprovement:
        result
          .metrics
          .relativeImprovement
          .meanQLIKE,

      qlikeBootstrapSupportsCandidate:
        result
          .metrics
          .comparison
          .qlike
          .bootstrap
          .confidenceInterval
          .supportsCandidate,

      nonConvergedFits:
        result
          .metrics
          .audit
          .convergence
          .nonConvergedCount,

      persistenceCeilingFits:
        result
          .metrics
          .audit
          .convergence
          .persistenceCeilingCount,
    });
  } catch (error) {
    console.error(
      "Persistent GARCH Normal V1 evaluation failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    await sequelize.close();
  }
};

run();