const fs = require("fs/promises");
const path = require("path");

const {
  QueryTypes,
} = require("sequelize");

const sequelize = require(
  "../src/config/database"
);

const {
  cleanDataset,
} = require(
  "../src/modules/datasets/services/cleanDataset.service"
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

const SOURCE_MANIFEST_PATH =
  path.resolve(
    "storage/backfill-state",
    "bybit",
    "BTCUSDT",
    "linear",
    "1m",
    "manifest.json"
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

const QUALITY_POLICY = {
  maxInvalidRows: 0,
  maxInvalidTimestampCount: 0,
  maxOutOfOrderCount: 0,
  maxMissingIntervalRatio: 0,
  maxDuplicateRatio: 0,
  maxIncompleteBucketRatio: 0,
};

const readJson = async (
  filePath,
  fallback = null
) => {
  try {
    const content =
      await fs.readFile(
        filePath,
        "utf8"
      );

    return JSON.parse(content);
  } catch {
    return fallback;
  }
};

const writeJson = async (
  filePath,
  value
) => {
  await fs.writeFile(
    filePath,
    JSON.stringify(
      value,
      null,
      2
    )
  );
};

const findExistingCleanDataset =
  async (rawDatasetId) => {
    const rows =
      await sequelize.query(
        `
        SELECT d.id
        FROM dataset_lineage dl
        JOIN datasets d
          ON d.id = dl.child_dataset_id
        WHERE
          dl.parent_dataset_id = :rawDatasetId
          AND d.stage = 'CLEAN'
        ORDER BY dl.created_at DESC
        LIMIT 1
        `,
        {
          replacements: {
            rawDatasetId,
          },

          type:
            QueryTypes.SELECT,
        }
      );

    if (!rows.length) {
      return null;
    }

    return findDatasetById(
      rows[0].id
    );
  };

const getCleanDataset =
  async (rawDatasetId) => {
    const existing =
      await findExistingCleanDataset(
        rawDatasetId
      );

    if (existing) {
      console.log(
        `  existing CLEAN: ${existing.id}`
      );

      return existing;
    }

    const result =
      await cleanDataset({
        datasetId:
          rawDatasetId,
      });

    if (
      !result?.cleanDatasetId
    ) {
      throw new Error(
        "CLEAN_DATASET_ID_NOT_RETURNED"
      );
    }

    const dataset =
      await findDatasetById(
        result.cleanDatasetId
      );

    if (!dataset) {
      throw new Error(
        "CLEAN_DATASET_NOT_FOUND"
      );
    }

    return dataset;
  };

const run = async () => {
  try {
    await sequelize.authenticate();

    const sourceManifest =
      await readJson(
        SOURCE_MANIFEST_PATH
      );

    if (
      !sourceManifest ||
      !Array.isArray(
        sourceManifest.datasetIds
      )
    ) {
      throw new Error(
        "BACKFILL_MANIFEST_NOT_FOUND"
      );
    }

    const cleanManifest =
      await readJson(
        CLEAN_MANIFEST_PATH,
        {
          completed: [],
        }
      );

    const completedRawIds =
      new Set(
        cleanManifest.completed.map(
          (item) =>
            item.rawDatasetId
        )
      );

    const total =
      sourceManifest.datasetIds.length;

    console.log({
      rawDatasets:
        total,

      alreadyCleaned:
        completedRawIds.size,
    });

    for (
      let index = 0;
      index < total;
      index += 1
    ) {
      const rawDatasetId =
        sourceManifest
          .datasetIds[index];

      if (
        completedRawIds.has(
          rawDatasetId
        )
      ) {
        console.log(
          `[SKIP ${index + 1}/${total}]`
        );

        continue;
      }

      console.log(
        `[CLEAN ${index + 1}/${total}] ${rawDatasetId}`
      );

      const dataset =
        await getCleanDataset(
          rawDatasetId
        );

      const quality =
        await validateDatasetQuality({
          datasetId:
            dataset.id,

          policy:
            QUALITY_POLICY,
        });

      cleanManifest.completed.push({
        rawDatasetId,

        cleanDatasetId:
          dataset.id,

        rowCount:
          Number(
            dataset.rowCount
          ),

        checksum:
          dataset.checksum,

        qualityStatus:
          quality.qualityStatus,
      });

      completedRawIds.add(
        rawDatasetId
      );

      await writeJson(
        CLEAN_MANIFEST_PATH,
        cleanManifest
      );

      console.log(
        `[DONE ${index + 1}/${total}] rows=${dataset.rowCount} quality=${quality.qualityStatus}`
      );
    }

    const result = {
      cleanDatasetCount:
        cleanManifest.completed.length,

      totalRows:
        cleanManifest.completed.reduce(
          (sum, item) =>
            sum +
            item.rowCount,
          0
        ),

      passCount:
        cleanManifest.completed.filter(
          (item) =>
            item.qualityStatus ===
            "PASS"
        ).length,

      warningCount:
        cleanManifest.completed.filter(
          (item) =>
            item.qualityStatus ===
            "ACCEPTABLE_WITH_WARNINGS"
        ).length,

      blockedCount:
        cleanManifest.completed.filter(
          (item) =>
            item.qualityStatus ===
            "BLOCKED"
        ).length,
    };

    console.dir(
      result,
      {
        depth: null,
      }
    );

    if (
      result.blockedCount > 0
    ) {
      throw new Error(
        "CLEAN_HISTORY_CONTAINS_BLOCKED_DATASETS"
      );
    }

    console.log(
      "BTCUSDT historical cleaning completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT historical cleaning failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();