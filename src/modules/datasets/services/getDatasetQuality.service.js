const {
  findDatasetById,
} = require(
  "../repositories/dataset.repository"
);

const {
  findLatestDataQualityReport,
} = require(
  "../quality/dataQualityReport.repository"
);

const {
  findRepairEventsByDataset,
} = require(
  "../repairs/dataRepairEvent.repository"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "dataset-quality-read-v1.0";

const serializeModel = (
  model
) =>
  model
    ? model.get({
        plain: true,
      })
    : null;

const getDatasetQuality =
  async ({
    datasetId,
  }, options = {}) => {
    const dataset =
      await findDatasetById(
        datasetId,
        options
      );

    if (!dataset) {
      throw createAppError({
        statusCode: 404,

        code:
          "DATASET_NOT_FOUND",

        message:
          `Dataset ${datasetId} not found`,
      });
    }

    const [
      qualityReport,
      repairEvents,
    ] =
      await Promise.all([
        findLatestDataQualityReport(
          datasetId,
          options
        ),

        findRepairEventsByDataset(
          datasetId,
          options
        ),
      ]);

    return {
      engineVersion:
        ENGINE_VERSION,

      dataset:
        serializeModel(
          dataset
        ),

      qualityReport:
        serializeModel(
          qualityReport
        ),

      repairs: {
        count:
          repairEvents.length,

        items:
          repairEvents.map(
            serializeModel
          ),
      },
    };
  };

module.exports = {
  ENGINE_VERSION,
  getDatasetQuality,
};
