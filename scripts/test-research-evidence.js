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

const {
  aggregateResearchReportEvidence,
} = require(
  "../src/modules/research/evidence/aggregateResearchReportEvidence"
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

    const baseReport =
      await buildResearchBatchReport({
        researchBatchId,
      });

    const report =
      aggregateResearchReportEvidence({
        report:
          baseReport,
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
      volatility
        .evidence
        .status,
      "EVALUATED"
    );

    assert.strictEqual(
      hour
        .evidence
        .status,
      "EVALUATED"
    );

    assert.strictEqual(
      weekday
        .evidence
        .status,
      "EVALUATED"
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

    assert.strictEqual(
      report
        .evidence
        .evaluatedHypotheses,
      3
    );

    assert.strictEqual(
      report
        .evidence
        .notEvaluatedHypotheses,
      13
    );

    console.log(
      "Research evidence test passed."
    );

    console.log(
      "\n===== EVIDENCE SUMMARY ====="
    );

    console.log(
      report.evidence
    );

    console.log(
      "\n===== EVIDENCE LADDER ====="
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
                ?.status,

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

            Reason:
              item
                .evidence
                ?.reason ||
              "",
          })
        )
    );

    console.log(
      "\n===== VOLATILITY STRUCTURE ====="
    );

    console.log({
      level:
        volatility
          .evidence
          .level,

      label:
        volatility
          .evidence
          .label,

      supportedTimeframes:
        volatility
          .evidence
          .supportedTimeframes,

      levelCap:
        volatility
          .evidence
          .criteria
          .levelCap,

      levelCapReason:
        volatility
          .evidence
          .criteria
          .levelCapReason,
    });

    console.log(
      "\n===== CALENDAR HOUR ====="
    );

    console.log({
      level:
        hour
          .evidence
          .level,

      label:
        hour
          .evidence
          .label,

      supportedHorizons:
        hour
          .evidence
          .supportedHorizons,

      unsupportedHorizons:
        hour
          .evidence
          .unsupportedHorizons,

      forwardOos:
        hour
          .evidence
          .forwardOos,
    });

    console.log(
      "\n===== CALENDAR WEEKDAY ====="
    );

    console.log({
      level:
        weekday
          .evidence
          .level,

      label:
        weekday
          .evidence
          .label,

      supportedHorizons:
        weekday
          .evidence
          .supportedHorizons,

      unsupportedHorizons:
        weekday
          .evidence
          .unsupportedHorizons,

      forwardOos:
        weekday
          .evidence
          .forwardOos,
    });
  } catch (error) {
    console.error(
      "Research evidence test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();