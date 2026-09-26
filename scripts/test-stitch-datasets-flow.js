const fs = require("fs/promises");
const path = require("path");

const sequelize = require(
  "../src/config/database"
);

const {
  importRawDataset,
} = require(
  "../src/modules/datasets/services/importRawDataset.service"
);

const {
  cleanDataset,
} = require(
  "../src/modules/datasets/services/cleanDataset.service"
);

const {
  stitchDatasets,
} = require(
  "../src/modules/datasets/services/stitchDatasets.service"
);

const {
  validateDatasetQuality,
} = require(
  "../src/modules/datasets/services/validateDatasetQuality.service"
);

const {
  findDatasetById,
} = require(
  "../src/modules/datasets/repositories/dataset.repository"
);

const {
  findParentsByDatasetId,
} = require(
  "../src/modules/datasets/lineage/datasetLineage.repository"
);

const {
  analyzeCandleIntervals,
} = require(
  "../src/modules/datasets/validation/analyzeCandleIntervals"
);

const createCleanSource = async ({
  sourcePath,
  name,
  rows,
}) => {
  await fs.writeFile(
    sourcePath,
    [
      "timestamp,open,high,low,close,volume",
      ...rows,
    ].join("\n")
  );

  const imported =
    await importRawDataset({
      sourcePath,
      originalFilename:
        path.basename(sourcePath),

      datasetMetadata: {
        name,
        datasetType: "CANDLES",
        version: 1,
        venue: "BYBIT",
        instrument: "BTCUSDT",
        marketType: "SPOT",
        sourceTimeframe: "1m",
        timezone: "UTC",
        startTime: null,
        endTime: null,
        rowCount: null,
      },
    });

  const cleaned =
    await cleanDataset({
      datasetId:
        imported.dataset.id,
    });

  return cleaned.cleanDatasetId;
};

const run = async () => {
  const directory = path.resolve(
    "storage/temp-stitch-datasets-flow"
  );

  try {
    await sequelize.authenticate();

    await fs.mkdir(
      directory,
      {
        recursive: true,
      }
    );

    const firstId =
      await createCleanSource({
        sourcePath:
          path.join(
            directory,
            "a.csv"
          ),

        name:
          "BTCUSDT_BYBIT_PART_A_RAW",

        rows: [
          "2026-09-20T00:00:00Z,100,110,90,105,10",
          "2026-09-20T00:01:00Z,105,112,101,108,15",
        ],
      });

    const secondId =
      await createCleanSource({
        sourcePath:
          path.join(
            directory,
            "b.csv"
          ),

        name:
          "BTCUSDT_BYBIT_PART_B_RAW",

        rows: [
          "2026-09-20T00:01:00Z,105,112,101,108,15",
          "2026-09-20T00:02:00Z,108,115,106,110,12",
        ],
      });

    const thirdId =
      await createCleanSource({
        sourcePath:
          path.join(
            directory,
            "c.csv"
          ),

        name:
          "BTCUSDT_BYBIT_PART_C_RAW",

        rows: [
          "2026-09-20T00:02:00Z,108,115,106,110,12",
          "2026-09-20T00:04:00Z,110,118,109,116,20",
        ],
      });

    const stitching =
      await stitchDatasets({
        datasetIds: [
          thirdId,
          firstId,
          secondId,
        ],
      });

    console.dir(
      stitching,
      {
        depth: null,
      }
    );

    const canonical =
      await findDatasetById(
        stitching.canonicalDatasetId
      );

    const parents =
      await findParentsByDatasetId(
        canonical.id
      );

    const intervals =
      await analyzeCandleIntervals({
        filePath:
          canonical.storageUri,

        sourceTimeframe:
          canonical.sourceTimeframe,
      });

    if (
      canonical.stage !==
      "CANONICAL"
    ) {
      throw new Error(
        "CANONICAL dataset was not created"
      );
    }

    if (
      Number(canonical.rowCount) !== 4
    ) {
      throw new Error(
        "Incorrect CANONICAL row count"
      );
    }

    if (
      parents.length !== 3
    ) {
      throw new Error(
        "Incorrect lineage parent count"
      );
    }

    if (
      stitching
        .duplicateOverlapCount !== 2
    ) {
      throw new Error(
        "Incorrect overlap count"
      );
    }

    if (
      intervals.duplicateCount !== 0
    ) {
      throw new Error(
        "CANONICAL contains duplicates"
      );
    }

    if (
      intervals.outOfOrderCount !== 0
    ) {
      throw new Error(
        "CANONICAL is not chronological"
      );
    }

    if (
      intervals
        .missingIntervalCount !== 1
    ) {
      throw new Error(
        "Gap was not preserved"
      );
    }

    const quality =
      await validateDatasetQuality({
        datasetId:
          canonical.id,

        policy: {
          maxInvalidRows: 0,

          maxInvalidTimestampCount: 0,

          maxOutOfOrderCount: 0,

          maxMissingIntervalRatio:
            0.25,

          maxDuplicateRatio: 0,
        },
      });

    const canonicalAfterQuality =
      await findDatasetById(
        canonical.id
      );

    console.dir(
      {
        qualityStatus:
          quality.qualityStatus,

        coverage:
          quality.report.coverage,

        missingIntervalCount:
          quality.report
            .missingIntervalCount,
      },
      {
        depth: null,
      }
    );

    if (
      quality.qualityStatus !==
      "ACCEPTABLE_WITH_WARNINGS"
    ) {
      throw new Error(
        `Unexpected quality status: ${quality.qualityStatus}`
      );
    }

    if (
      canonicalAfterQuality
        .qualityStatus !==
      "ACCEPTABLE_WITH_WARNINGS"
    ) {
      throw new Error(
        "CANONICAL quality status was not persisted"
      );
    }

    if (
      quality.report.coverage !== 0.8
    ) {
      throw new Error(
        `Unexpected coverage: ${quality.report.coverage}`
      );
    }

    if (
      quality.report
        .missingIntervalCount !== 1
    ) {
      throw new Error(
        "Quality report did not preserve gap"
      );
    }

    console.log(
      "Dataset stitching flow test passed"
    );
  } catch (error) {
    console.error(
      "Dataset stitching flow test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await fs.rm(
      directory,
      {
        recursive: true,
        force: true,
      }
    );

    await sequelize.close();
  }
};

run();