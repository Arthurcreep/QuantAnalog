const fs = require("fs/promises");
const path = require("path");

const sequelize = require(
  "../src/config/database"
);

const {
  findDatasetById,
} = require(
  "../src/modules/datasets/repositories/dataset.repository"
);

const {
  calculateFileChecksum,
} = require(
  "../src/modules/datasets/calculations/calculateFileChecksum"
);

const {
  storeCanonicalFile,
} = require(
  "../src/modules/datasets/storage/canonicalStorage"
);

const {
  persistCanonicalDataset,
} = require(
  "../src/modules/datasets/services/persistCanonicalDataset"
);

const {
  validateDatasetQuality,
} = require(
  "../src/modules/datasets/services/validateDatasetQuality.service"
);

const CLEAN_MANIFEST_PATH =
  path.resolve(
    "storage/backfill-state",
    "bybit",
    "BTCUSDT",
    "linear",
    "1m",
    "clean-manifest.json"
  );

const CANDIDATE_PATH =
  path.resolve(
    "storage/temp-canonical",
    "BTCUSDT_BYBIT_LINEAR_1M_CANONICAL_CANDIDATE.csv"
  );

const QUALITY_POLICY = {
  maxInvalidRows: 0,
  maxInvalidTimestampCount: 0,
  maxOutOfOrderCount: 0,
  maxMissingIntervalRatio: 0,
  maxDuplicateRatio: 0,
  maxIncompleteBucketRatio: 0,
};

const run = async () => {
  try {
    await sequelize.authenticate();

    const manifest =
      JSON.parse(
        await fs.readFile(
          CLEAN_MANIFEST_PATH,
          "utf8"
        )
      );

    if (
      !Array.isArray(
        manifest.completed
      ) ||
      manifest.completed.length === 0
    ) {
      throw new Error(
        "CLEAN_MANIFEST_EMPTY"
      );
    }

    const sources = [];

    for (
      const item of manifest.completed
    ) {
      const dataset =
        await findDatasetById(
          item.cleanDatasetId
        );

      if (!dataset) {
        throw new Error(
          `CLEAN_DATASET_NOT_FOUND_${item.cleanDatasetId}`
        );
      }

      if (
        dataset.stage !==
        "CLEAN"
      ) {
        throw new Error(
          `EXPECTED_CLEAN_DATASET_${dataset.id}`
        );
      }

      sources.push(
        dataset
      );
    }

    sources.sort(
      (left, right) =>
        new Date(
          left.startTime
        ).getTime() -
        new Date(
          right.startTime
        ).getTime()
    );

    const outputRowCount =
      sources.reduce(
        (sum, source) =>
          sum +
          Number(
            source.rowCount
          ),
        0
      );

    const firstTimestamp =
      new Date(
        sources[0].startTime
      ).toISOString();

    const lastTimestamp =
      new Date(
        sources[
          sources.length - 1
        ].endTime
      ).toISOString();

    console.log({
      sourceDatasetCount:
        sources.length,

      outputRowCount,

      firstTimestamp,

      lastTimestamp,
    });

    const checksum =
      await calculateFileChecksum(
        CANDIDATE_PATH
      );

    console.log({
      checksum,
    });

    const stored =
      await storeCanonicalFile({
        sourcePath:
          CANDIDATE_PATH,

        checksum,
      });

    console.log({
      canonicalStorage:
        stored.path,

      alreadyExists:
        stored.alreadyExists,
    });

    const persisted =
      await persistCanonicalDataset({
        sources,

        checksum,

        storageUri:
          stored.path,

        stitching: {
          sourceFileCount:
            sources.length,

          outputRowCount,

          firstTimestamp,

          lastTimestamp,

          duplicateOverlapCount: 0,
        },
      });

    console.dir(
      persisted,
      {
        depth: null,
      }
    );

    const quality =
      await validateDatasetQuality({
        datasetId:
          persisted
            .canonicalDatasetId,

        policy:
          QUALITY_POLICY,
      });

    const result = {
      canonicalDatasetId:
        persisted
          .canonicalDatasetId,

      parentDatasetCount:
        persisted
          .parentDatasetCount,

      rowCount:
        persisted.rowCount,

      startTime:
        persisted.startTime,

      endTime:
        persisted.endTime,

      checksum:
        persisted.checksum,

      storageUri:
        persisted.storageUri,

      transformationVersion:
        persisted
          .transformationVersion,

      qualityStatus:
        quality.qualityStatus,

      coverage:
        quality.report.coverage,

      duplicateCount:
        quality.report
          .duplicateCount,

      gapCount:
        quality.report.gapCount,

      missingIntervalCount:
        quality.report
          .missingIntervalCount,

      invalidRows:
        quality.report.invalidRows,

      zeroVolumeCount:
        quality.report
          .zeroVolumeCount,
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
        "CANONICAL_DATASET_BLOCKED"
      );
    }

    if (
      result.rowCount !==
      3414522
    ) {
      throw new Error(
        "CANONICAL_ROW_COUNT_MISMATCH"
      );
    }

    console.log(
      "BTCUSDT CANONICAL dataset registered successfully"
    );
  } catch (error) {
    console.error(
      "BTCUSDT CANONICAL registration failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();