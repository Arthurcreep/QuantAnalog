const fs = require(
  "fs/promises"
);

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
  runReturnResearch,
} = require(
  "../src/modules/research/services/runReturnResearch.service"
);

const {
  findAnalysisRunById,
} = require(
  "../src/modules/research/runs/analysisRun.repository"
);

const {
  INCOMPLETE_BUCKET_POLICIES,
} = require(
  "../src/modules/datasets/timeframes/applyIncompleteBucketPolicy"
);

const run = async () => {
  const directory =
    path.resolve(
      "storage/temp-research-run"
    );

  const filePath =
    path.join(
      directory,
      "prepared.csv"
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
      filePath,
      [
        [
          "timestamp",
          "open",
          "high",
          "low",
          "close",
          "volume",
          "source_count",
          "expected_source_count",
          "is_complete",
        ].join(","),

        "2026-09-20T00:00:00Z,100,101,99,100,10,5,5,true",
        "2026-09-20T00:05:00Z,100,102,99,101,11,5,5,true",
        "2026-09-20T00:10:00Z,101,102,98,99,12,5,5,true",
        "2026-09-20T00:15:00Z,99,103,98,102,13,5,5,true",
        "2026-09-20T00:20:00Z,102,104,101,103,14,5,5,true",
        "2026-09-20T00:25:00Z,103,106,102,105,15,5,5,true",
      ].join("\n")
    );

    const checksum =
      await calculateFileChecksum(
        filePath
      );

    const dataset =
      await registerDataset({
        name:
          "BTCUSDT_PREPARED_5M",

        datasetType:
          "CANDLES",

        stage:
          "PREPARED",

        version: 1,

        venue:
          "BYBIT",

        instrument:
          "BTCUSDT",

        marketType:
          "SPOT",

        sourceTimeframe:
          "5m",

        timezone:
          "UTC",

        startTime:
          "2026-09-20T00:00:00Z",

        endTime:
          "2026-09-20T00:25:00Z",

        rowCount: 6,

        checksum,

        storageUri:
          filePath,

        qualityStatus:
          "PASS",
      });

    const result =
      await runReturnResearch({
        datasetId:
          dataset.id,

        incompletePolicy:
          INCOMPLETE_BUCKET_POLICIES.DROP,

        maxLag: 2,

        quantiles: [
          0.25,
          0.5,
          0.75,
        ],
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

    const stored =
      await findAnalysisRunById(
        result.analysisRunId
      );

    if (!stored) {
      throw new Error(
        "Analysis run was not persisted"
      );
    }

    if (
      stored.runType !==
      "RETURN_PROFILE"
    ) {
      throw new Error(
        "Incorrect analysis run type"
      );
    }

    if (
      result.metrics.sample
        .returnCount !== 5
    ) {
      throw new Error(
        "Expected 5 log returns"
      );
    }

    if (
      result.metrics
        .descriptive
        .count !== 5
    ) {
      throw new Error(
        "Incorrect statistics sample size"
      );
    }

    if (
      result.metrics.acf.length !== 3
    ) {
      throw new Error(
        "Incorrect ACF length"
      );
    }

    if (
      !Number.isFinite(
        result.metrics
          .realizedVolatility
          .realizedVolatility
      )
    ) {
      throw new Error(
        "Realized volatility was not calculated"
      );
    }

    console.log(
      "Return research run test passed"
    );
  } catch (error) {
    console.error(
      "Return research run test failed:",
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