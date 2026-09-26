const ResearchReport =
  require(
    "./researchReport.model"
  );

const createResearchReport =
  async ({
    researchBatchId,
    schemaVersion,
    reportEngineVersion,
    evidenceEngineVersion,
    evidencePolicyId,
    evidencePolicyVersion,
    evidencePolicyChecksum,
    reportChecksum,
    payload,
  }) =>
    ResearchReport.create({
      researchBatchId,
      schemaVersion,
      reportEngineVersion,
      evidenceEngineVersion,
      evidencePolicyId,
      evidencePolicyVersion,
      evidencePolicyChecksum,
      reportChecksum,
      payload,
    });

const findResearchReportById =
  async (
    id
  ) =>
    ResearchReport.findByPk(
      id
    );

const findResearchReportSnapshot =
  async ({
    researchBatchId,
    schemaVersion,
    reportEngineVersion,
    evidenceEngineVersion,
    evidencePolicyChecksum,
  }) =>
    ResearchReport.findOne({
      where: {
        researchBatchId,
        schemaVersion,
        reportEngineVersion,
        evidenceEngineVersion,
        evidencePolicyChecksum,
      },
    });

const findResearchReportsByBatchId =
  async (
    researchBatchId
  ) =>
    ResearchReport.findAll({
      where: {
        researchBatchId,
      },

      order: [
        [
          "created_at",
          "ASC",
        ],
      ],
    });

module.exports = {
  createResearchReport,
  findResearchReportById,
  findResearchReportSnapshot,
  findResearchReportsByBatchId,
};