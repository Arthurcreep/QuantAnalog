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
  findDatasetById,
} = require(
  "../src/modules/datasets/repositories/dataset.repository"
);

const {
  findChildrenByDatasetId,
} = require(
  "../src/modules/datasets/lineage/datasetLineage.repository"
);

const {
  findRepairEventsByDataset,
} = require(
  "../src/modules/datasets/repairs/dataRepairEvent.repository"
);

const {
  validateCandleDomain,
} = require(
  "../src/modules/datasets/validation/validateCandleDomain"
);

const {
  analyzeCandleIntervals,
} = require(
  "../src/modules/datasets/validation/analyzeCandleIntervals"
);

const run = async () => {
  const tempDirectory = path.resolve(
    "storage/temp-clean-flow"
  );

  const sourcePath = path.join(
    tempDirectory,
    "btc.csv"
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

        // exact duplicate
        "2026-09-20T00:00:00Z,100,110,90,105,10",

        // invalid OHLC
        "2026-09-20T00:01:00Z,105,100,101,108,15",

        // gap 00:01 + 00:02 remains
        "2026-09-20T00:03:00Z,108,115,106,110,12",
      ].join("\n")
    );

    const imported =
      await importRawDataset({
        sourcePath,
        originalFilename: "btc.csv",

        datasetMetadata: {
          name:
            "BTCUSDT_BYBIT_1M_RAW",

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

    const rawBefore =
      await findDatasetById(
        imported.dataset.id
      );

    const result =
      await cleanDataset({
        datasetId:
          imported.dataset.id,
      });

    console.dir(result, {
      depth: null,
    });

    const rawAfter =
      await findDatasetById(
        result.sourceDatasetId
      );

    const clean =
      await findDatasetById(
        result.cleanDatasetId
      );

    const lineage =
      await findChildrenByDatasetId(
        rawAfter.id
      );

    const repairs =
      await findRepairEventsByDataset(
        rawAfter.id
      );

    const cleanDomain =
      await validateCandleDomain(
        clean.storageUri
      );

    const cleanIntervals =
      await analyzeCandleIntervals({
        filePath: clean.storageUri,
        sourceTimeframe: "1m",
      });

    if (
      rawBefore.checksum !==
      rawAfter.checksum
    ) {
      throw new Error(
        "RAW checksum was modified"
      );
    }

    if (
      rawBefore.storageUri !==
      rawAfter.storageUri
    ) {
      throw new Error(
        "RAW storage was modified"
      );
    }

    if (rawAfter.stage !== "RAW") {
      throw new Error(
        "RAW stage was modified"
      );
    }

    if (clean.stage !== "CLEAN") {
      throw new Error(
        "CLEAN dataset was not created"
      );
    }

    if (
      Number(clean.rowCount) !== 2
    ) {
      throw new Error(
        "Incorrect CLEAN row count"
      );
    }

    if (
      result.removedDuplicateCount !== 1
    ) {
      throw new Error(
        "Duplicate was not removed"
      );
    }

    if (
      result.removedInvalidCount !== 1
    ) {
      throw new Error(
        "Invalid candle was not removed"
      );
    }

    if (repairs.length !== 2) {
      throw new Error(
        "Incorrect repair event count"
      );
    }

    if (lineage.length !== 1) {
      throw new Error(
        "Lineage was not created"
      );
    }

    if (
      cleanDomain.invalidCount !== 0
    ) {
      throw new Error(
        "CLEAN contains invalid candles"
      );
    }

    if (
      cleanIntervals
        .missingIntervalCount !== 2
    ) {
      throw new Error(
        "Gap was not preserved"
      );
    }

    console.log(
      "Clean dataset flow test passed"
    );
  } catch (error) {
    console.error(
      "Clean dataset flow test failed:",
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