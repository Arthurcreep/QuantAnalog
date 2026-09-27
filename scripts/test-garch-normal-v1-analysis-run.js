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
  runGarchNormalV1Evaluation,
} = require(
  "../src/modules/forecasting/services/runGarchNormalV1Evaluation.service"
);

const assertClose = (
  actual,
  expected,
  tolerance = 1e-12
) => {
  assert.ok(
    Math.abs(
      actual -
      expected
    ) <= tolerance,
    `${actual} not close to ${expected}`
  );
};

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
      await runGarchNormalV1Evaluation(
        {
          datasetId,

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
      stored
    );

    assert.strictEqual(
      stored.runType,
      "FORECAST_WALK_FORWARD"
    );

    assert.strictEqual(
      stored.engineVersion,
      "garch-normal-v1-evaluation-v1.0"
    );

    assert.strictEqual(
      stored.datasetId,
      datasetId
    );

    assert.strictEqual(
      stored
        .metrics
        .sample
        .candidate
        .evaluatedForecasts,
      15063
    );

    assert.strictEqual(
      stored
        .metrics
        .audit
        .fitCount,
      628
    );

    assert.strictEqual(
      stored
        .metrics
        .audit
        .convergence
        .nonConvergedCount,
      103
    );

    assert.strictEqual(
      stored
        .metrics
        .audit
        .convergence
        .persistenceCeilingCount,
      124
    );

    assertClose(
      stored
        .metrics
        .candidate
        .qlike
        .mean,
      1.8383342583651654
    );

    assertClose(
      stored
        .metrics
        .relativeImprovement
        .meanQLIKE,
      0.060907422483407456
    );

    assertClose(
      stored
        .metrics
        .comparison
        .qlike
        .observedMeanDifference,
      0.11923020586114334
    );

    assert.strictEqual(
      stored
        .metrics
        .comparison
        .qlike
        .bootstrap
        .confidenceInterval
        .supportsCandidate,
      true
    );

    assertClose(
      stored
        .metrics
        .audit
        .lossByFitConvergence
        .converged
        .qlike
        .meanDifference,
      0.12181799418991979
    );

    assertClose(
      stored
        .metrics
        .audit
        .lossByFitConvergence
        .nonConverged
        .qlike
        .meanDifference,
      0.10599182464207102
    );

    console.log(
      "GARCH Normal V1 AnalysisRun test passed."
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      model:
        result.model,

      protocol:
        result.protocol,

      evaluatedForecasts:
        stored
          .metrics
          .sample
          .candidate
          .evaluatedForecasts,

      meanQLIKE:
        stored
          .metrics
          .candidate
          .qlike
          .mean,

      meanQLIKEImprovement:
        stored
          .metrics
          .relativeImprovement
          .meanQLIKE,

      qlikeBootstrapSupportsCandidate:
        stored
          .metrics
          .comparison
          .qlike
          .bootstrap
          .confidenceInterval
          .supportsCandidate,

      nonConvergedFits:
        stored
          .metrics
          .audit
          .convergence
          .nonConvergedCount,

      persistenceCeilingFits:
        stored
          .metrics
          .audit
          .convergence
          .persistenceCeilingCount,
    });
  } catch (error) {
    console.error(
      "GARCH Normal V1 AnalysisRun test failed:",
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