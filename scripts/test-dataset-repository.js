const sequelize = require("../src/config/database");

const {
  createDataset,
  findDatasetById,
} = require("../src/modules/datasets/repositories/dataset.repository");

const run = async () => {
  let transaction;

  try {
    await sequelize.authenticate();

    transaction = await sequelize.transaction();

    const createdDataset = await createDataset(
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
        checksum: "test-checksum-001",
        storageUri: "file:///D:/quantlog/storage/raw/test.csv",
        qualityStatus: null,
      },
      {
        transaction,
      }
    );

    const dataset = await findDatasetById(createdDataset.id, {
      transaction,
    });

    console.log({
      id: dataset.id,
      name: dataset.name,
      datasetType: dataset.datasetType,
      stage: dataset.stage,
      version: dataset.version,
      venue: dataset.venue,
      instrument: dataset.instrument,
      sourceTimeframe: dataset.sourceTimeframe,
      rowCount: dataset.rowCount,
      checksum: dataset.checksum,
      qualityStatus: dataset.qualityStatus,
    });

    await transaction.rollback();

    console.log("Dataset repository test passed");
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error("Dataset repository test failed:", error);

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();