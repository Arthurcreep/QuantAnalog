const fs = require("fs/promises");
const path = require("path");

const sequelize = require("../src/config/database");

const {
  importRawDataset,
} = require(
  "../src/modules/datasets/services/importRawDataset.service"
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

const run = async () => {
  const tempDirectory = path.resolve(
    "storage/temp-quality-flow"
  );

  const sourcePath = path.join(
    tempDirectory,
    "btc-quality-test.csv"
  );

  let datasetId = null;

  try {
    await sequelize.authenticate();

    await fs.mkdir(tempDirectory, {
      recursive: true,
    });

    await fs.writeFile(
      sourcePath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:00:00Z,100,110,90,105,10",
        "2026-09-20T00:01:00Z,105,112,101,108,15",
        "2026-09-20T00:03:00Z,108,115,106,110,12",
        "2026-09-20T00:04:00Z,110,105,108,112,9",
      ].join("\n")
    );

    const imported =
      await importRawDataset({
        sourcePath,
        originalFilename:
          "btc-quality-test.csv",

        datasetMetadata: {
          name: "BTCUSDT_BYBIT_1M_RAW",
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

    datasetId = imported.dataset.id;

    const policy = {
      maxInvalidRows: 0,
      maxInvalidTimestampCount: 0,
      maxOutOfOrderCount: 0,
      maxMissingIntervalRatio: 0.25,
      maxDuplicateRatio: 0,
    };

    const result =
      await validateDatasetQuality({
        datasetId,
        policy,
      });

    console.dir(result, {
      depth: null,
    });

    const dataset =
      await findDatasetById(datasetId);

    if (
      result.qualityStatus !== "BLOCKED"
    ) {
      throw new Error(
        "Expected BLOCKED quality status"
      );
    }

    if (
      dataset.qualityStatus !== "BLOCKED"
    ) {
      throw new Error(
        "Dataset quality status was not updated"
      );
    }

    if (!result.qualityReportId) {
      throw new Error(
        "Quality report was not saved"
      );
    }

    console.log(
      "Dataset quality flow test passed"
    );
  } catch (error) {
    console.error(
      "Dataset quality flow test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await fs.rm(tempDirectory, {
      recursive: true,
      force: true,
    });

    await sequelize.close();
  }
};

run();