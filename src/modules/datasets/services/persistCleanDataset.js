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

const {
  createRepairEvents,
} = require(
  "../repairs/dataRepairEvent.repository"
);

const {
  buildRepairEvents,
} = require(
  "../cleaning/buildRepairEvents"
);

const {
  DEFAULT_CANDLE_CLEANING_POLICY,
  CANDLE_CLEANING_POLICY_VERSION,
} = require(
  "../cleaning/cleaningPolicy"
);

const buildCleanName = (name) =>
  /_RAW$/i.test(name)
    ? name.replace(/_RAW$/i, "_CLEAN")
    : `${name}_CLEAN`;

const persistCleanDataset = async ({
  source,
  checksum,
  storageUri,
  cleaning,
}) =>
  sequelize.transaction(
    async (transaction) => {
      const clean =
        await registerDataset(
          {
            name:
              buildCleanName(
                source.name
              ),

            datasetType:
              source.datasetType,

            stage: "CLEAN",
            version: source.version,

            venue: source.venue,
            instrument:
              source.instrument,
            marketType:
              source.marketType,

            sourceTimeframe:
              source.sourceTimeframe,

            timezone:
              source.timezone,

            startTime:
              source.startTime,

            endTime:
              source.endTime,

            rowCount:
              cleaning.outputRowCount,

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
            clean.id,

          transformationType:
            "CLEANING",

          transformationVersion:
            CANDLE_CLEANING_POLICY_VERSION,

          metadata: {
            policy:
              DEFAULT_CANDLE_CLEANING_POLICY,

            inputRowCount:
              cleaning.inputRowCount,

            outputRowCount:
              cleaning.outputRowCount,

            removedDuplicateCount:
              cleaning.removedDuplicateCount,

            removedInvalidCount:
              cleaning.removedInvalidCount,
          },
        },
        {
          transaction,
        }
      );

      const repairEvents =
        buildRepairEvents({
          events:
            cleaning.repairEvents,

          sourceDatasetId:
            source.id,

          targetDatasetId:
            clean.id,

          policyVersion:
            CANDLE_CLEANING_POLICY_VERSION,
        });

      await createRepairEvents(
        repairEvents,
        {
          transaction,
        }
      );

      return {
        sourceDatasetId:
          source.id,

        cleanDatasetId:
          clean.id,

        checksum,
        storageUri,

        inputRowCount:
          cleaning.inputRowCount,

        outputRowCount:
          cleaning.outputRowCount,

        removedCount:
          cleaning.removedCount,

        removedDuplicateCount:
          cleaning.removedDuplicateCount,

        removedInvalidCount:
          cleaning.removedInvalidCount,

        repairEventCount:
          repairEvents.length,

        policyVersion:
          CANDLE_CLEANING_POLICY_VERSION,
      };
    }
  );

module.exports = {
  persistCleanDataset,
};