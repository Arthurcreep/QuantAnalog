const sequelize = require("../src/config/database");

const {
  registerDataset,
} = require("../src/modules/datasets/dataset.service");

const run = async () => {
  let transaction;

  try {
    await sequelize.authenticate();

    transaction = await sequelize.transaction();

    const validDataset = await registerDataset(
      {
        name: "BTCUSDT_BYBIT_1M_RAW",
        datasetType: "CANDLES",
        stage: "RAW",
        version: 1,
        venue: "BYBIT",
        instrument: "BTCUSDT",
        marketType: "SPOT",
        sourceTimeframe: "1m",
        timezone: "UTC",
        startTime: new Date("2026-09-01T00:00:00Z"),
        endTime: new Date("2026-09-02T00:00:00Z"),
        rowCount: 1440,
        checksum: "service-test-checksum-001",
        storageUri: "file:///D:/quantlog/storage/raw/test.csv",
        qualityStatus: null,
      },
      {
        transaction,
      }
    );

    console.log("VALID DATASET PASSED");

    console.log({
      id: validDataset.id,
      name: validDataset.name,
      stage: validDataset.stage,
      datasetType: validDataset.datasetType,
    });

    try {
      await registerDataset(
        {
          name: "BROKEN_DATASET",
          datasetType: "CANDLES",
          stage: "MAGIC",
          version: 1,
          venue: "BYBIT",
          instrument: "BTCUSDT",
          marketType: "SPOT",
          sourceTimeframe: "1m",
          timezone: "UTC",
          checksum: "service-test-checksum-002",
          storageUri: "file:///D:/quantlog/storage/raw/broken.csv",
        },
        {
          transaction,
        }
      );

      throw new Error("Invalid dataset unexpectedly passed validation");
    } catch (error) {
      if (error.code !== "INVALID_DATASET_STAGE") {
        throw error;
      }

      console.log("INVALID DATASET BLOCKED");

      console.log({
        code: error.code,
        message: error.message,
      });
    }

    await transaction.rollback();

    console.log("Dataset service test passed");
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error("Dataset service test failed:", error);

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();