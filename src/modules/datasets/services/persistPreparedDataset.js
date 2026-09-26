const sequelize = require(
  "../../../config/database"
);

const {
  registerDataset,
} = require("../dataset.service");

const {
  createLineage,
} = require(
  "../lineage/datasetLineage.repository"
);

const TIMEFRAME_BUILD_VERSION =
  "timeframe-builder-v1";

const buildPreparedName = (
  name,
  targetTimeframe
) => {
  const base = name.replace(
    /_CANONICAL$/i,
    ""
  );

  return `${base}_PREPARED_${targetTimeframe.toUpperCase()}`;
};

const persistPreparedDataset = async ({
  source,
  targetTimeframe,
  checksum,
  storageUri,
  aggregation,
  startTime,
  endTime,
}) =>
  sequelize.transaction(
    async (transaction) => {
      const prepared =
        await registerDataset(
          {
            name:
              buildPreparedName(
                source.name,
                targetTimeframe
              ),

            datasetType:
              source.datasetType,

            stage: "PREPARED",
            version: 1,

            venue:
              source.venue,

            instrument:
              source.instrument,

            marketType:
              source.marketType,

            sourceTimeframe:
              targetTimeframe,

            timezone:
              source.timezone,

            startTime,
            endTime,

            rowCount:
              aggregation.outputRowCount,

            checksum,
            storageUri,

            qualityStatus: null,
          },
          {
            transaction,
          }
        );

      await createLineage(
        {
          parentDatasetId:
            source.id,

          childDatasetId:
            prepared.id,

          transformationType:
            "TIMEFRAME_AGGREGATION",

          transformationVersion:
            TIMEFRAME_BUILD_VERSION,

          metadata: {
            sourceTimeframe:
              source.sourceTimeframe,

            targetTimeframe,

            expectedSourceRows:
              aggregation.expectedSourceRows,

            incompleteBucketCount:
              aggregation.incompleteBucketCount,
          },
        },
        {
          transaction,
        }
      );

      return {
        preparedDatasetId:
          prepared.id,

        sourceDatasetId:
          source.id,

        sourceTimeframe:
          source.sourceTimeframe,

        targetTimeframe,

        rowCount:
          aggregation.outputRowCount,

        incompleteBucketCount:
          aggregation.incompleteBucketCount,

        expectedSourceRows:
          aggregation.expectedSourceRows,

        startTime,
        endTime,

        checksum,
        storageUri,

        transformationVersion:
          TIMEFRAME_BUILD_VERSION,
      };
    }
  );

module.exports = {
  persistPreparedDataset,
};