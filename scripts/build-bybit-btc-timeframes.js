const sequelize = require(
  "../src/config/database"
);

const {
  buildPreparedDataset,
} = require(
  "../src/modules/datasets/services/buildPreparedDataset.service"
);

const {
  validateDatasetQuality,
} = require(
  "../src/modules/datasets/services/validateDatasetQuality.service"
);

const CANONICAL_DATASET_ID =
  "f636a456-db12-42da-a595-ae5763d9e735";

const TARGET_TIMEFRAMES = [
  "5m",
  "15m",
  "1h",
  "4h",
  "1d",
];

const QUALITY_POLICY = {
  maxInvalidRows: 0,
  maxInvalidTimestampCount: 0,
  maxOutOfOrderCount: 0,
  maxMissingIntervalRatio: 0,
  maxDuplicateRatio: 0,

  // Разрешаем только очень малую долю
  // неполных boundary buckets.
  maxIncompleteBucketRatio: 0.001,
};

const getPreparedDatasetId = (
  result
) =>
  result.preparedDatasetId ||
  result.datasetId ||
  result.id;

const run = async () => {
  try {
    await sequelize.authenticate();

    const results = [];

    for (
      const targetTimeframe of
      TARGET_TIMEFRAMES
    ) {
      console.log(
        `\n[BUILD] ${targetTimeframe}`
      );

      const prepared =
        await buildPreparedDataset({
          datasetId:
            CANONICAL_DATASET_ID,

          targetTimeframe,
        });

      const preparedDatasetId =
        getPreparedDatasetId(
          prepared
        );

      if (!preparedDatasetId) {
        console.dir(
          prepared,
          {
            depth: null,
          }
        );

        throw new Error(
          `PREPARED_DATASET_ID_NOT_RETURNED_${targetTimeframe}`
        );
      }

      const quality =
        await validateDatasetQuality({
          datasetId:
            preparedDatasetId,

          policy:
            QUALITY_POLICY,
        });

      const result = {
        targetTimeframe,

        preparedDatasetId,

        rowCount:
          Number(
            prepared.rowCount
          ),

        incompleteBucketCount:
          quality.report
            .incompleteBucketCount,

        incompleteBucketRatio:
          quality.report
            .incompleteBucketRatio,

        gapCount:
          quality.report.gapCount,

        missingIntervalCount:
          quality.report
            .missingIntervalCount,

        duplicateCount:
          quality.report
            .duplicateCount,

        invalidRows:
          quality.report.invalidRows,

        qualityStatus:
          quality.qualityStatus,

        checksum:
          prepared.checksum,

        storageUri:
          prepared.storageUri,
      };

      console.dir(
        result,
        {
          depth: null,
        }
      );

      if (
        result.qualityStatus ===
        "BLOCKED"
      ) {
        throw new Error(
          `PREPARED_DATASET_BLOCKED_${targetTimeframe}`
        );
      }

      results.push(result);
    }

    console.log(
      "\n===== PREPARED DATASETS ====="
    );

    for (
      const result of results
    ) {
      console.log(
        `${result.targetTimeframe} | rows=${result.rowCount} | incomplete=${result.incompleteBucketCount} | quality=${result.qualityStatus}`
      );
    }

    console.log(
      "\nBTCUSDT timeframe build completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT timeframe build failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();