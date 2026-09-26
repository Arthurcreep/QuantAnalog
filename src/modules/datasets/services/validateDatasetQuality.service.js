const sequelize = require(
  "../../../config/database"
);

const {
  findDatasetById,
  updateDatasetQualityStatus,
} = require(
  "../repositories/dataset.repository"
);

const {
  validateCandleDataset,
} = require(
  "../validation/validateCandleDataset"
);

const {
  analyzePreparedBuckets,
} = require(
  "../timeframes/analyzePreparedBuckets"
);

const {
  buildDataQualityReport,
} = require(
  "../quality/buildDataQualityReport"
);

const {
  evaluateDataQualityStatus,
} = require(
  "../quality/evaluateDataQualityStatus"
);

const {
  saveDataQualityReport,
} = require(
  "../quality/saveDataQualityReport"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const buildPreparedMetrics = async (
  dataset
) => {
  if (dataset.stage !== "PREPARED") {
    return {
      incompleteBucketCount: 0,
      incompleteBucketRatio: 0,
    };
  }

  const analysis =
    await analyzePreparedBuckets(
      dataset.storageUri
    );

  return {
    incompleteBucketCount:
      analysis.incompleteBucketCount,

    incompleteBucketRatio:
      analysis.incompleteBucketRatio,
  };
};

const validateDatasetQuality = async ({
  datasetId,
  policy,
}) => {
  const dataset =
    await findDatasetById(datasetId);

  if (!dataset) {
    throw createAppError({
      statusCode: 404,
      code: "DATASET_NOT_FOUND",
      message:
        `Dataset ${datasetId} not found`,
    });
  }

  if (
    dataset.datasetType !== "CANDLES"
  ) {
    throw createAppError({
      statusCode: 400,
      code: "UNSUPPORTED_DATASET_TYPE",
      message:
        `Dataset type ${dataset.datasetType} is not supported yet`,
    });
  }

  const validation =
    await validateCandleDataset({
      filePath:
        dataset.storageUri,

      sourceTimeframe:
        dataset.sourceTimeframe,
    });

  const preparedMetrics =
    await buildPreparedMetrics(
      dataset
    );

  const report = {
    ...buildDataQualityReport(
      validation
    ),

    ...preparedMetrics,
  };

  const qualityStatus =
    evaluateDataQualityStatus({
      report,
      policy,
    });

  const savedReport =
    await sequelize.transaction(
      async (transaction) => {
        const saved =
          await saveDataQualityReport({
            datasetId:
              dataset.id,

            report,
            policy,
            qualityStatus,
            transaction,
          });

        await updateDatasetQualityStatus(
          dataset.id,
          qualityStatus,
          {
            transaction,
          }
        );

        return saved;
      }
    );

  return {
    datasetId:
      dataset.id,

    qualityReportId:
      savedReport.id,

    qualityStatus,

    report,
  };
};

module.exports = {
  validateDatasetQuality,
};