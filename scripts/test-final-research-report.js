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

    const volatility =
      findHypothesis(
        report,
        "H_VOL_001"
      );

    const hour =
      findHypothesis(
        report,
        "H_CAL_001"
      );

    const weekday =
      findHypothesis(
        report,
        "H_CAL_002"
      );

    assert.strictEqual(
      report.schemaVersion,
      "RESEARCH_REPORT_V1"
    );

    assert.strictEqual(
      report.reportEngineVersion,
      "research-report-v1.2"
    );

    assert.strictEqual(
      report
        .evidence
        .engineVersion,
      "evidence-v1"
    );

    assert.strictEqual(
      report
        .evidence
        .policy
        .id,
      "EVIDENCE_POLICY"
    );

    assert.strictEqual(
      report
        .evidence
        .policy
        .version,
      "1.0.0"
    );

    assert.strictEqual(
      report
        .evidence
        .policy
        .checksum
        .length,
      64
    );

    assert.strictEqual(
      report
        .evidence
        .status,
      "EVALUATED"
    );

    assert.strictEqual(
      report
        .evidence
        .evaluatedHypotheses,
      3
    );

    assert.strictEqual(
      volatility
        .evidence
        .level,
      2
    );

    assert.strictEqual(
      hour
        .evidence
        .level,
      5
    );

    assert.strictEqual(
      weekday
        .evidence
        .level,
      5
    );

    assert.deepStrictEqual(
      hour
        .evidence
        .supportedHorizons,
      [
        "1h",
        "4h",
        "6h",
        "12h",
      ]
    );

    assert.deepStrictEqual(
      hour
        .evidence
        .unsupportedHorizons,
      [
        "24h",
      ]
    );

    assert.deepStrictEqual(
      weekday
        .evidence
        .supportedHorizons,
      [
        "1h",
        "4h",
        "6h",
        "12h",
        "24h",
      ]
    );

    console.log(
      "Final research report test passed."
    );

    console.log(
      "\n===== REPORT HEADER ====="
    );

    console.log({
      schemaVersion:
        report.schemaVersion,

      reportEngineVersion:
        report.reportEngineVersion,

      evidenceEngineVersion:
        report
          .evidence
          .engineVersion,

      evidencePolicy:
        report
          .evidence
          .policy,

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
    });

    console.log(
      "\n===== EVIDENCE ====="
    );

    console.table(
      report
        .hypotheses
        .map(
          (item) => ({
            Hypothesis:
              item.hypothesisId,

            Execution:
              item.executionStatus ||
              "",

            EvidenceStatus:
              item
                .evidence
                ?.status ||
              "",

            Level:
              item
                .evidence
                ?.level ??
              "",

            Label:
              item
                .evidence
                ?.label ||
              "",

            ForwardValidated:
              item
                .evidence
                ?.forwardOos
                ?.validated ??
              "",
          })
        )
    );
  } catch (error) {
    console.error(
      "Final research report test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();