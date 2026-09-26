const sequelize = require(
  "../../../config/database"
);

const {
  registerDataset,
} = require("../dataset.service");

const {
  createLineages,
} = require(
  "../lineage/datasetLineage.repository"
);

const STITCH_VERSION = "stitch-v1";

const buildCanonicalName = (name) =>
  /_CLEAN$/i.test(name)
    ? name.replace(
        /_CLEAN$/i,
        "_CANONICAL"
      )
    : `${name}_CANONICAL`;

const persistCanonicalDataset = async ({
  sources,
  checksum,
  storageUri,
  stitching,
}) =>
  sequelize.transaction(
    async (transaction) => {
      const reference = sources[0];

      const canonical =
        await registerDataset(
          {
            name:
              buildCanonicalName(
                reference.name
              ),

            datasetType:
              reference.datasetType,

            stage: "CANONICAL",
            version: 1,

            venue: reference.venue,
            instrument:
              reference.instrument,
            marketType:
              reference.marketType,

            sourceTimeframe:
              reference.sourceTimeframe,

            timezone:
              reference.timezone,

            startTime:
              stitching.firstTimestamp,

            endTime:
              stitching.lastTimestamp,

            rowCount:
              stitching.outputRowCount,

            checksum,
            storageUri,

            qualityStatus: null,
          },
          {
            transaction,
          }
        );

      const lineages =
        sources.map((source) => ({
          parentDatasetId:
            source.id,

          childDatasetId:
            canonical.id,

          transformationType:
            "STITCHING",

          transformationVersion:
            STITCH_VERSION,

          metadata: {
            sourceFileCount:
              stitching.sourceFileCount,

            duplicateOverlapCount:
              stitching.duplicateOverlapCount,
          },
        }));

      await createLineages(
        lineages,
        {
          transaction,
        }
      );

      return {
        canonicalDatasetId:
          canonical.id,

        parentDatasetCount:
          sources.length,

        rowCount:
          stitching.outputRowCount,

        startTime:
          stitching.firstTimestamp,

        endTime:
          stitching.lastTimestamp,

        duplicateOverlapCount:
          stitching.duplicateOverlapCount,

        checksum,
        storageUri,

        transformationVersion:
          STITCH_VERSION,
      };
    }
  );

module.exports = {
  persistCanonicalDataset,
};