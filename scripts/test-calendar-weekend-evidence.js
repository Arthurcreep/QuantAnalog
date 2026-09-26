const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  buildResearchReport,
} = require(
  "../src/modules/research/reports/buildResearchReport.service"
);

const {
  createResearchReportSnapshot,
} = require(
  "../src/modules/research/reports/createResearchReportSnapshot.service"
);

const {
  hashResearchReport,
} = require(
  "../src/modules/research/reports/hashResearchReport"
);

const findHypothesis = (
  report,
  hypothesisId
) =>
  report
    .hypotheses
    .find(
      (item) =>
        item.hypothesisId ===
        hypothesisId
    );

const run = async () => {
  try {
    const researchBatchId =
      process.argv[2];

    if (!researchBatchId) {
      throw new Error(
        "RESEARCH_BATCH_ID_REQUIRED"
      );
    }

    await sequelize.authenticate();

    const report =
      await buildResearchReport({
        researchBatchId,
      });

    assert.strictEqual(
      report
        .researchBatch
        .status,
      "COMPLETED"
    );

    assert.strictEqual(
      report
        .coverage
        .executedHypotheses,
      4
    );

    assert.strictEqual(
      report
        .coverage
        .analysisRuns,
      8
    );

    assert.strictEqual(
      report
        .evidence
        .evaluatedHypotheses,
      4
    );

    const weekend =
      findHypothesis(
        report,
        "H_CAL_003"
      );

    assert.ok(
      weekend
    );

    assert.strictEqual(
      weekend.executionStatus,
      "COMPLETED"
    );

    assert.strictEqual(
      weekend.analysisRuns.length,
      1
    );

    assert.strictEqual(
      weekend
        .evidence
        .status,
      "EVALUATED"
    );

    assert.strictEqual(
      weekend
        .evidence
        .horizons
        .length,
      5
    );

    const snapshot =
      await createResearchReportSnapshot({
        researchBatchId,
      });

    assert.strictEqual(
      snapshot.created,
      false
    );

    const recomputedChecksum =
      hashResearchReport(
        snapshot
          .snapshot
          .payload
      );

    assert.strictEqual(
      recomputedChecksum,
      snapshot
        .snapshot
        .reportChecksum
    );

    console.log(
      "Calendar weekend evidence test passed."
    );

    console.log(
      "\n===== RESEARCH COVERAGE ====="
    );

    console.log({
      researchBatchId,

      status:
        report
          .researchBatch
          .status,

      registeredHypotheses:
        report
          .coverage
          .registeredHypotheses,

      executedHypotheses:
        report
          .coverage
          .executedHypotheses,

      analysisRuns:
        report
          .coverage
          .analysisRuns,

      evidenceEvaluated:
        report
          .evidence
          .evaluatedHypotheses,
    });

    console.log(
      "\n===== H_CAL_003 ====="
    );

    console.log({
      hypothesisId:
        weekend.hypothesisId,

      executionStatus:
        weekend.executionStatus,

      evidenceLevel:
        weekend
          .evidence
          .level,

      evidenceLabel:
        weekend
          .evidence
          .label,

      supportedHorizons:
        weekend
          .evidence
          .supportedHorizons,

      unsupportedHorizons:
        weekend
          .evidence
          .unsupportedHorizons,

      forwardOos:
        weekend
          .evidence
          .forwardOos,
    });

    console.log(
      "\n===== WEEKEND HORIZONS ====="
    );

    console.table(
      weekend
        .evidence
        .horizons
        .map(
          (item) => ({
            Horizon:
              item.horizon,

            DevP:
              item
                .developmentPValue,

            DevAdjustedP:
              item
                .developmentAdjustedPValue,

            ValidationP:
              item
                .validationPValue,

            ValidationAdjustedP:
              item
                .validationAdjustedPValue,

            ProfileCorrelation:
              item
                .profileCorrelation,

            BootstrapSupported:
              item
                .bootstrapSupported,

            OosSupported:
              item
                .oosSupported,

            RobustSupported:
              item
                .robustSupported,
          })
        )
    );

    console.log(
      "\n===== SNAPSHOT ====="
    );

    console.log({
      researchReportId:
        snapshot
          .snapshot
          .id,

      createdByThisTest:
        snapshot.created,

      reportEngineVersion:
        snapshot
          .snapshot
          .reportEngineVersion,

      reportChecksum:
        snapshot
          .snapshot
          .reportChecksum,

      checksumVerified:
        recomputedChecksum ===
        snapshot
          .snapshot
          .reportChecksum,
    });
  } catch (error) {
    console.error(
      "Calendar weekend evidence test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();