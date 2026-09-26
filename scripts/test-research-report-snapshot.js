const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  createResearchReportSnapshot,
} = require(
  "../src/modules/research/reports/createResearchReportSnapshot.service"
);

const {
  findResearchReportsByBatchId,
} = require(
  "../src/modules/research/reports/researchReport.repository"
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

    const first =
      await createResearchReportSnapshot({
        researchBatchId,
      });

    const second =
      await createResearchReportSnapshot({
        researchBatchId,
      });

    assert.strictEqual(
      first
        .snapshot
        .id,
      second
        .snapshot
        .id
    );

    assert.strictEqual(
      first
        .snapshot
        .reportChecksum,
      second
        .snapshot
        .reportChecksum
    );

    assert.strictEqual(
      first
        .snapshot
        .schemaVersion,
      "RESEARCH_REPORT_V1"
    );

    assert.strictEqual(
      first
        .snapshot
        .reportEngineVersion,
      "research-report-v1.2"
    );

    assert.strictEqual(
      first
        .snapshot
        .evidenceEngineVersion,
      "evidence-v1"
    );

    assert.strictEqual(
      first
        .snapshot
        .evidencePolicyId,
      "EVIDENCE_POLICY"
    );

    assert.strictEqual(
      first
        .snapshot
        .evidencePolicyVersion,
      "1.0.0"
    );

    assert.strictEqual(
      first
        .snapshot
        .evidencePolicyChecksum
        .length,
      64
    );

    assert.strictEqual(
      first
        .snapshot
        .reportChecksum
        .length,
      64
    );

    const payload =
      first
        .snapshot
        .payload;

    const recomputedChecksum =
      hashResearchReport(
        payload
      );

    assert.strictEqual(
      recomputedChecksum,
      first
        .snapshot
        .reportChecksum
    );

    assert.strictEqual(
      payload
        .researchBatch
        .id,
      researchBatchId
    );

    assert.strictEqual(
      payload
        .reportEngineVersion,
      "research-report-v1.2"
    );

    assert.strictEqual(
      payload
        .evidence
        .evaluatedHypotheses,
      3
    );

    const volatility =
      findHypothesis(
        payload,
        "H_VOL_001"
      );

    const hour =
      findHypothesis(
        payload,
        "H_CAL_001"
      );

    const weekday =
      findHypothesis(
        payload,
        "H_CAL_002"
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

    const reports =
      await findResearchReportsByBatchId(
        researchBatchId
      );

    const currentVersionReports =
      reports.filter(
        (report) =>
          report.schemaVersion ===
            first
              .snapshot
              .schemaVersion &&
          report.reportEngineVersion ===
            first
              .snapshot
              .reportEngineVersion &&
          report.evidenceEngineVersion ===
            first
              .snapshot
              .evidenceEngineVersion &&
          report.evidencePolicyChecksum ===
            first
              .snapshot
              .evidencePolicyChecksum
      );

    assert.strictEqual(
      currentVersionReports.length,
      1
    );

    console.log(
      "Research report snapshot test passed."
    );

    console.log(
      "\n===== CURRENT SNAPSHOT ====="
    );

    console.log({
      researchReportId:
        first
          .snapshot
          .id,

      researchBatchId:
        first
          .snapshot
          .researchBatchId,

      createdOnFirstCall:
        first.created,

      createdOnSecondCall:
        second.created,

      schemaVersion:
        first
          .snapshot
          .schemaVersion,

      reportEngineVersion:
        first
          .snapshot
          .reportEngineVersion,

      evidenceEngineVersion:
        first
          .snapshot
          .evidenceEngineVersion,

      evidencePolicy: {
        id:
          first
            .snapshot
            .evidencePolicyId,

        version:
          first
            .snapshot
            .evidencePolicyVersion,

        checksum:
          first
            .snapshot
            .evidencePolicyChecksum,
      },

      storedChecksum:
        first
          .snapshot
          .reportChecksum,

      recomputedChecksum,

      checksumVerified:
        recomputedChecksum ===
        first
          .snapshot
          .reportChecksum,

      storedSnapshotsForCurrentVersion:
        currentVersionReports.length,

      totalSnapshotsForBatch:
        reports.length,
    });

    console.log(
      "\n===== STORED REPORT VERSIONS ====="
    );

    console.table(
      reports.map(
        (report) => ({
          ReportId:
            report.id,

          Schema:
            report.schemaVersion,

          ReportEngine:
            report.reportEngineVersion,

          EvidenceEngine:
            report.evidenceEngineVersion,

          PolicyVersion:
            report.evidencePolicyVersion,

          Checksum:
            report.reportChecksum,
        })
      )
    );

    console.log(
      "\n===== STORED EVIDENCE ====="
    );

    console.table(
      payload
        .hypotheses
        .filter(
          (item) =>
            item.executionStatus ===
            "COMPLETED"
        )
        .map(
          (item) => ({
            Hypothesis:
              item.hypothesisId,

            Level:
              item
                .evidence
                .level,

            Label:
              item
                .evidence
                .label,

            ForwardValidated:
              item
                .evidence
                .forwardOos
                ?.validated ??
              false,
          })
        )
    );
  } catch (error) {
    console.error(
      "Research report snapshot test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();