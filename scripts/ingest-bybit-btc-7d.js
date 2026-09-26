const path = require("path");

const sequelize = require(
  "../src/config/database"
);

const {
  validateCandleDataset,
} = require(
  "../src/modules/datasets/validation/validateCandleDataset"
);

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

const run = async () => {
  const sourcePath = path.resolve(
    "storage/temp-bybit",
    "BTCUSDT_LINEAR_1M_7D.csv"
  );

  try {
    await sequelize.authenticate();

    const validation =
      await validateCandleDataset({
        filePath: sourcePath,
        sourceTimeframe: "1m",
      });

    console.dir(
      {
        schema: {
          valid:
            validation.schema.valid,

          rowCount:
            validation.schema.rowCount,
        },

        timestamps: {
          valid:
            validation.timestamps.valid,

          firstTimestamp:
            validation.timestamps.firstTimestamp,

          lastTimestamp:
            validation.timestamps.lastTimestamp,

          outOfOrderCount:
            validation.timestamps.outOfOrderCount,

          misalignedCount:
            validation.timestamps.misalignedCount,
        },

        intervals: {
          duplicateCount:
            validation.intervals.duplicateCount,

          gapCount:
            validation.intervals.gapCount,

          missingIntervalCount:
            validation.intervals.missingIntervalCount,
        },

        domain: {
          valid:
            validation.domain.valid,

          validCount:
            validation.domain.validCount,

          invalidCount:
            validation.domain.invalidCount,

          zeroVolumeCount:
            validation.domain.zeroVolumeCount,
        },
      },
      {
        depth: null,
      }
    );

    if (!validation.schema.valid) {
      throw new Error(
        "REAL_BYBIT_SCHEMA_INVALID"
      );
    }

    if (!validation.timestamps.valid) {
      throw new Error(
        "REAL_BYBIT_TIMESTAMPS_INVALID"
      );
    }

    if (!validation.domain.valid) {
      throw new Error(
        "REAL_BYBIT_DOMAIN_INVALID"
      );
    }

    const imported =
      await importRawDataset({
        sourcePath,

        originalFilename:
          "BTCUSDT_LINEAR_1M_7D.csv",

        datasetMetadata: {
          name:
            "BTCUSDT_BYBIT_LINEAR_1M_RAW",

          datasetType:
            "CANDLES",

          version: 1,

          venue:
            "BYBIT",

          instrument:
            "BTCUSDT",

          marketType:
            "LINEAR",

          sourceTimeframe:
            "1m",

          timezone:
            "UTC",

          startTime:
            validation.timestamps.firstTimestamp,

          endTime:
            validation.timestamps.lastTimestamp,

          rowCount:
            validation.schema.rowCount,
        },
      });

    const dataset =
      imported.dataset;

    const quality =
      await validateDatasetQuality({
        datasetId:
          dataset.id,

        policy: {
          maxInvalidRows: 0,

          maxInvalidTimestampCount: 0,

          maxOutOfOrderCount: 0,

          maxMissingIntervalRatio: 0,

          maxDuplicateRatio: 0,
        },
      });

    console.dir(
      {
        datasetId:
          dataset.id,

        stage:
          dataset.stage,

        checksum:
          dataset.checksum,

        storageUri:
          dataset.storageUri,

        rowCount:
          dataset.rowCount,

        qualityStatus:
          quality.qualityStatus,

        coverage:
          quality.report.coverage,

        invalidRows:
          quality.report.invalidRows,

        duplicateCount:
          quality.report.duplicateCount,

        gapCount:
          quality.report.gapCount,

        missingIntervalCount:
          quality.report.missingIntervalCount,

        zeroVolumeCount:
          quality.report.zeroVolumeCount,
      },
      {
        depth: null,
      }
    );

    if (
      quality.qualityStatus ===
      "BLOCKED"
    ) {
      throw new Error(
        "REAL_BYBIT_DATASET_BLOCKED"
      );
    }

    console.log(
      "Real Bybit BTCUSDT ingestion passed"
    );
  } catch (error) {
    console.error(
      "Real Bybit BTCUSDT ingestion failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();