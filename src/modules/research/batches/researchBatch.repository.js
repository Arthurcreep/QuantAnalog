const ResearchBatch = require(
  "./researchBatch.model"
);

const ResearchBatchAnalysisRun =
  require(
    "./researchBatchAnalysisRun.model"
  );

const createResearchBatch =
  async (
    data,
    options = {}
  ) => {
    return ResearchBatch.create(
      data,
      options
    );
  };

const findResearchBatchById =
  async (
    id,
    options = {}
  ) => {
    return ResearchBatch.findByPk(
      id,
      options
    );
  };

const updateResearchBatch =
  async (
    id,
    data,
    options = {}
  ) => {
    const [, batches] =
      await ResearchBatch.update(
        data,
        {
          where: {
            id,
          },

          returning:
            true,

          ...options,
        }
      );

    return (
      batches[0] ||
      null
    );
  };

const linkAnalysisRunToResearchBatch =
  async (
    data,
    options = {}
  ) => {
    return ResearchBatchAnalysisRun.create(
      data,
      options
    );
  };

const linkAnalysisRunsToResearchBatch =
  async (
    rows,
    options = {}
  ) => {
    if (
      !Array.isArray(rows) ||
      rows.length === 0
    ) {
      return [];
    }

    return ResearchBatchAnalysisRun.bulkCreate(
      rows,
      options
    );
  };

const findResearchBatchAnalysisRuns =
  async (
    researchBatchId,
    options = {}
  ) => {
    return ResearchBatchAnalysisRun.findAll({
      where: {
        researchBatchId,
      },

      order: [
        [
          "created_at",
          "ASC",
        ],
      ],

      ...options,
    });
  };

module.exports = {
  createResearchBatch,
  findResearchBatchById,
  updateResearchBatch,
  linkAnalysisRunToResearchBatch,
  linkAnalysisRunsToResearchBatch,
  findResearchBatchAnalysisRuns,
};