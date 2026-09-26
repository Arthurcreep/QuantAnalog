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
  buildPreparedDataset,
} = require(
  "../src/modules/datasets/services/buildPreparedDataset.service"
);

const {
  findDatasetById,
} = require(
  "../src/modules/datasets/repositories/dataset.repository"
);

const {
  findParentsByDatasetId,
} = require(
  "../src/modules/datasets/lineage/datasetLineage.repository"
);

const run = async () => {
  const directory = path.resolve(
    "storage/temp-prepared-flow"
  );

  const inputPath = path.join(
    directory,
    "canonical.csv"
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
      inputPath,
      [
        "timestamp,open,high,low,close,volume",

        "2026-09-20T00:00:00Z,100,102,99,101,10",
        "2026-09-20T00:01:00Z,101,103,100,102,11",
        "2026-09-20T00:02:00Z,102,104,101,103,12",
        "2026-09-20T00:03:00Z,103,105,102,104,13",
        "2026-09-20T00:04:00Z,104,106,103,105,14",

        "2026-09-20T00:05:00Z,105,107,104,106,15",
        "2026-09-20T00:06:00Z,106,108,105,107,16",

        // 00:07 missing

        "2026-09-20T00:08:00Z,108,110,107,109,18",
        "2026-09-20T00:09:00Z,109,111,108,110,19",
      ].join("\n")
    );

    const checksum =
      await calculateFileChecksum(
        inputPath
      );

    const canonical =
      await registerDataset({
        name:
          "BTCUSDT_BYBIT_CANONICAL",

        datasetType:
          "CANDLES",

        stage:
          "CANONICAL",

        version: 1,

        venue:
          "BYBIT",

        instrument:
          "BTCUSDT",

        marketType:
          "SPOT",

        sourceTimeframe:
          "1m",

        timezone:
          "UTC",

        startTime:
          "2026-09-20T00:00:00Z",

        endTime:
          "2026-09-20T00:09:00Z",

        rowCount: 9,

        checksum,

        storageUri:
          inputPath,

        qualityStatus:
          "ACCEPTABLE_WITH_WARNINGS",
      });

    const result =
      await buildPreparedDataset({
        datasetId:
          canonical.id,

        targetTimeframe:
          "5m",
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

    const prepared =
      await findDatasetById(
        result.preparedDatasetId
      );

    const parents =
      await findParentsByDatasetId(
        prepared.id
      );

    if (
      prepared.stage !==
      "PREPARED"
    ) {
      throw new Error(
        "PREPARED dataset was not created"
      );
    }

    if (
      prepared.sourceTimeframe !==
      "5m"
    ) {
      throw new Error(
        "Incorrect prepared timeframe"
      );
    }

    if (
      Number(prepared.rowCount) !== 2
    ) {
      throw new Error(
        "Incorrect prepared row count"
      );
    }

    if (
      result.incompleteBucketCount !== 1
    ) {
      throw new Error(
        "Incomplete bucket was not detected"
      );
    }

    if (
      result.expectedSourceRows !== 5
    ) {
      throw new Error(
        "Incorrect expected source count"
      );
    }

    if (
      parents.length !== 1
    ) {
      throw new Error(
        "Prepared lineage was not created"
      );
    }

    if (
      parents[0]
        .transformationType !==
      "TIMEFRAME_AGGREGATION"
    ) {
      throw new Error(
        "Incorrect lineage transformation"
      );
    }

    console.log(
      "Prepared dataset flow test passed"
    );
  } catch (error) {
    console.error(
      "Prepared dataset flow test failed:",
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