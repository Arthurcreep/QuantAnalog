const {
  findResearchBatchById,
  findResearchBatchAnalysisRuns,
} = require(
  "../batches/researchBatch.repository"
);

const {
  findAnalysisRunById,
} = require(
  "../runs/analysisRun.repository"
);

const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
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

const loadResearchBatchReportData =
  async ({
    researchBatchId,
  }) => {
    const batchModel =
      await findResearchBatchById(
        researchBatchId
      );

    if (!batchModel) {
      throw new Error(
        `RESEARCH_BATCH_NOT_FOUND:${researchBatchId}`
      );
    }

    const linkModels =
      await findResearchBatchAnalysisRuns(
        researchBatchId
      );

    const batch =
      toPlain(
        batchModel
      );

    const links =
      linkModels.map(
        toPlain
      );

    const analysisRuns =
      await Promise.all(
        links.map(
          async (link) => {
            const runModel =
              await findAnalysisRunById(
                link.analysisRunId
              );

            if (!runModel) {
              throw new Error(
                `ANALYSIS_RUN_NOT_FOUND:${link.analysisRunId}`
              );
            }

            return {
              link,
              run:
                toPlain(
                  runModel
                ),
            };
          }
        )
      );

    const datasetIds =
      [
        ...new Set(
          analysisRuns.map(
            (item) =>
              item.run.datasetId
          )
        ),
      ];

    const datasets =
      await Promise.all(
        datasetIds.map(
          async (
            datasetId
          ) => {
            const datasetModel =
              await findDatasetById(
                datasetId
              );

            if (!datasetModel) {
              throw new Error(
                `DATASET_NOT_FOUND:${datasetId}`
              );
            }

            return toPlain(
              datasetModel
            );
          }
        )
      );

    return {
      batch,
      links,
      analysisRuns,
      datasets,
    };
  };

module.exports = {
  loadResearchBatchReportData,
};