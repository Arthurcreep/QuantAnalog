const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  buildResearchBatchReport,
} = require(
  "../src/modules/research/reports/buildResearchBatchReport.service"
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
      await buildResearchBatchReport({
        researchBatchId,
      });

    assert.strictEqual(
      report.schemaVersion,
      "RESEARCH_REPORT_V1"
    );

    assert.strictEqual(
      report
        .researchBatch
        .id,
      researchBatchId
    );

    assert.strictEqual(
      report
        .researchBatch
        .status,
      "COMPLETED"
    );

    assert.strictEqual(
      report
        .coverage
        .registeredHypotheses,
      16
    );

    assert.strictEqual(
      report
        .coverage
        .executedHypotheses,
      3
    );

    assert.strictEqual(
      report
        .coverage
        .analysisRuns,
      7
    );

    assert.strictEqual(
      report
        .coverage
        .datasetsUsed,
      5
    );

    const volatility =
      report
        .hypotheses
        .find(
          (item) =>
            item.hypothesisId ===
            "H_VOL_001"
        );

    const hour =
      report
        .hypotheses
        .find(
          (item) =>
            item.hypothesisId ===
            "H_CAL_001"
        );

    const weekday =
      report
        .hypotheses
        .find(
          (item) =>
            item.hypothesisId ===
            "H_CAL_002"
        );

    assert.strictEqual(
      volatility
        .analysisRuns
        .length,
      5
    );

    assert.strictEqual(
      hour
        .analysisRuns
        .length,
      1
    );

    assert.strictEqual(
      weekday
        .analysisRuns
        .length,
      1
    );

    console.log(
      "Research batch report test passed."
    );

    console.log(
      "\n===== REPORT ====="
    );

    console.log({
      schemaVersion:
        report.schemaVersion,

      researchBatchId:
        report
          .researchBatch
          .id,

      instrument:
        report
          .researchBatch
          .instrument,

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

      datasetsUsed:
        report
          .coverage
          .datasetsUsed,

      evidence:
        report
          .evidence
          .status,
    });

    console.log(
      "\n===== DATASETS USED ====="
    );

    console.table(
      report
        .datasetsUsed
        .map(
          (dataset) => ({
            Timeframe:
              dataset
                .sourceTimeframe,

            Stage:
              dataset.stage,

            Quality:
              dataset
                .qualityStatus,

            Rows:
              dataset.rowCount,

            DatasetId:
              dataset.id,
          })
        )
    );

    console.log(
      "\n===== HYPOTHESES ====="
    );

    console.table(
      report
        .hypotheses
        .map(
          (item) => ({
            Hypothesis:
              item.hypothesisId,

            Family:
              item.family,

            Plan:
              item.planStatus,

            Execution:
              item.executionStatus ||
              "",

            Runs:
              item
                .analysisRuns
                .length,

            Evidence:
              item
                .evidence
                .status,
          })
        )
    );
  } catch (error) {
    console.error(
      "Research batch report test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();