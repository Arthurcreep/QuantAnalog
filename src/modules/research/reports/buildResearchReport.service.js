const crypto = require(
  "crypto"
);

const {
  buildResearchBatchReport,
} = require(
  "./buildResearchBatchReport.service"
);

const {
  aggregateResearchReportEvidence,
} = require(
  "../evidence/aggregateResearchReportEvidence"
);

const {
  EVIDENCE_POLICY_V1,
} = require(
  "../evidence/policies/evidencePolicyV1"
);

const {
  attachEconomicEligibility,
} = require(
  "../../economics/reports/attachEconomicEligibility"
);

const REPORT_ENGINE_VERSION =
  "research-report-v1.5";

const EVIDENCE_ENGINE_VERSION =
  "evidence-v1.2";

const hashObject = (
  value
) =>
  crypto
    .createHash(
      "sha256"
    )
    .update(
      JSON.stringify(
        value
      )
    )
    .digest(
      "hex"
    );

const EVIDENCE_POLICY_CHECKSUM =
  hashObject(
    EVIDENCE_POLICY_V1
  );

const buildResearchReport =
  async ({
    researchBatchId,
  }) => {
    const baseReport =
      await buildResearchBatchReport({
        researchBatchId,
      });

    const evidenceReport =
      aggregateResearchReportEvidence({
        report:
          baseReport,
      });

    const reportWithMetadata = {
      ...evidenceReport,

      reportEngineVersion:
        REPORT_ENGINE_VERSION,

      evidence: {
        ...evidenceReport
          .evidence,

        engineVersion:
          EVIDENCE_ENGINE_VERSION,

        policy: {
          id:
            EVIDENCE_POLICY_V1
              .id,

          version:
            EVIDENCE_POLICY_V1
              .version,

          checksum:
            EVIDENCE_POLICY_CHECKSUM,
        },
      },
    };

    return attachEconomicEligibility({
      report:
        reportWithMetadata,
    });
  };

module.exports = {
  REPORT_ENGINE_VERSION,
  EVIDENCE_ENGINE_VERSION,
  EVIDENCE_POLICY_CHECKSUM,
  buildResearchReport,
};