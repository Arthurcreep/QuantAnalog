const {
  REPORT_SCHEMA_VERSION,
} = require(
  "./buildResearchBatchReport.service"
);

const {
  REPORT_ENGINE_VERSION,
  EVIDENCE_ENGINE_VERSION,
  EVIDENCE_POLICY_CHECKSUM,
  buildResearchReport,
} = require(
  "./buildResearchReport.service"
);

const {
  EVIDENCE_POLICY_V1,
} = require(
  "../evidence/policies/evidencePolicyV1"
);

const {
  createResearchReport,
  findResearchReportSnapshot,
} = require(
  "./researchReport.repository"
);

const {
  hashResearchReport,
} = require(
  "./hashResearchReport"
);

const toPlain = (
  value
) => {
  if (
    value &&
    typeof value.toJSON ===
      "function"
  ) {
    return value.toJSON();
  }

  return value;
};

const findExistingSnapshot =
  async ({
    researchBatchId,
  }) =>
    findResearchReportSnapshot({
      researchBatchId,

      schemaVersion:
        REPORT_SCHEMA_VERSION,

      reportEngineVersion:
        REPORT_ENGINE_VERSION,

      evidenceEngineVersion:
        EVIDENCE_ENGINE_VERSION,

      evidencePolicyChecksum:
        EVIDENCE_POLICY_CHECKSUM,
    });

const createResearchReportSnapshot =
  async ({
    researchBatchId,
  }) => {
    const existing =
      await findExistingSnapshot({
        researchBatchId,
      });

    if (existing) {
      return {
        created:
          false,

        snapshot:
          toPlain(
            existing
          ),
      };
    }

    const payload =
      await buildResearchReport({
        researchBatchId,
      });

    const reportChecksum =
      hashResearchReport(
        payload
      );

    try {
      const snapshot =
        await createResearchReport({
          researchBatchId,

          schemaVersion:
            payload.schemaVersion,

          reportEngineVersion:
            REPORT_ENGINE_VERSION,

          evidenceEngineVersion:
            EVIDENCE_ENGINE_VERSION,

          evidencePolicyId:
            EVIDENCE_POLICY_V1
              .id,

          evidencePolicyVersion:
            EVIDENCE_POLICY_V1
              .version,

          evidencePolicyChecksum:
            EVIDENCE_POLICY_CHECKSUM,

          reportChecksum,

          payload,
        });

      return {
        created:
          true,

        snapshot:
          toPlain(
            snapshot
          ),
      };
    } catch (error) {
      if (
        error?.name !==
        "SequelizeUniqueConstraintError"
      ) {
        throw error;
      }

      const concurrent =
        await findExistingSnapshot({
          researchBatchId,
        });

      if (!concurrent) {
        throw error;
      }

      return {
        created:
          false,

        snapshot:
          toPlain(
            concurrent
          ),
      };
    }
  };

module.exports = {
  createResearchReportSnapshot,
};