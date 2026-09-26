const fs = require("fs/promises");
const path = require("path");

const sequelize = require(
  "../src/config/database"
);

const {
  registerDataset,
} = require(
  "../src/modules/datasets/dataset.service"
);

const {
  calculateFileChecksum,
} = require(
  "../src/modules/datasets/calculations/calculateFileChecksum"
);

const {
  validateDatasetQuality,
} = require(
  "../src/modules/datasets/services/validateDatasetQuality.service"
);

const run = async () => {
  const directory = path.resolve(
    "storage/temp-prepared-quality"
  );

  const filePath = path.join(
    directory,
    "prepared.csv"
  );

  try {
    await sequelize.authenticate();

    await fs.mkdir(
      directory,
      {
        recursive: true,
      }
    );

    await fs.writeFile(
      filePath,
      [
        [
          "timestamp",
          "open",
          "high",
          "low",
          "close",
          "volume",
          "source_count",
          "expected_source_count",
          "is_complete",
        ].join(","),

        "2026-09-20T00:00:00Z,100,106,99,105,60,5,5,true",

        "2026-09-20T00:05:00Z,105,111,104,110,68,4,5,false",
      ].join("\n")
    );

    const checksum =
      await calculateFileChecksum(
        filePath
      );

    const dataset =
      await registerDataset({
        name:
          "BTCUSDT_PREPARED_5M",

        datasetType:
          "CANDLES",

        stage:
          "PREPARED",

        version: 1,

        venue:
          "BYBIT",

        instrument:
          "BTCUSDT",

        marketType:
          "SPOT",

        sourceTimeframe:
          "5m",

        timezone:
          "UTC",

        startTime:
          "2026-09-20T00:00:00Z",

        endTime:
          "2026-09-20T00:05:00Z",

        rowCount: 2,

        checksum,

        storageUri:
          filePath,

        qualityStatus:
          null,
      });

    const result =
      await validateDatasetQuality({
        datasetId:
          dataset.id,

        policy: {
          maxInvalidRows: 0,

          maxInvalidTimestampCount: 0,

          maxOutOfOrderCount: 0,

          maxMissingIntervalRatio: 0,

          maxDuplicateRatio: 0,

          maxIncompleteBucketRatio: 0.5,
        },
      });

    console.dir(
      {
        qualityStatus:
          result.qualityStatus,

        incompleteBucketCount:
          result.report
            .incompleteBucketCount,

        incompleteBucketRatio:
          result.report
            .incompleteBucketRatio,

        gapCount:
          result.report.gapCount,
      },
      {
        depth: null,
      }
    );

    if (
      result.report
        .incompleteBucketCount !== 1
    ) {
      throw new Error(
        "Incomplete bucket was not detected"
      );
    }

    if (
      result.report
        .incompleteBucketRatio !== 0.5
    ) {
      throw new Error(
        "Incorrect incomplete bucket ratio"
      );
    }

    if (
      result.qualityStatus !==
      "ACCEPTABLE_WITH_WARNINGS"
    ) {
      throw new Error(
        `Unexpected quality status: ${result.qualityStatus}`
      );
    }

    console.log(
      "Prepared quality test passed"
    );
  } catch (error) {
    console.error(
      "Prepared quality test failed:",
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