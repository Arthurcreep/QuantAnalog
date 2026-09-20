const fs = require("fs/promises");
const path = require("path");

const sequelize = require("../src/config/database");

const {
  importRawDataset,
} = require(
  "../src/modules/datasets/services/importRawDataset.service"
);

const run = async () => {
  let transaction;

  const tempDirectory = path.resolve("storage/temp");
  const sourcePath = path.join(
    tempDirectory,
    "btc-import-test.csv"
  );

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
      ].join("\n")
    );

    transaction = await sequelize.transaction();

    const result = await importRawDataset({
      sourcePath,
      originalFilename: "btc-import-test.csv",

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

      transaction,
    });

    console.log({
      id: result.dataset.id,
      stage: result.dataset.stage,
      checksum: result.dataset.checksum,
      storageUri: result.dataset.storageUri,
      qualityStatus: result.dataset.qualityStatus,
      alreadyExists: result.storage.alreadyExists,
    });

    await transaction.rollback();

    console.log("RAW dataset import test passed");
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error(
      "RAW dataset import test failed:",
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