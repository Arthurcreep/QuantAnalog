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

const MANIFEST_PATH =
  path.resolve(
    "storage/backfill-state",
    "bybit",
    "BTCUSDT",
    "linear",
    "1m",
    "clean-manifest.json"
  );

const ONE_MINUTE_MS =
  60_000;

const run = async () => {
  try {
    await sequelize.authenticate();

    const manifest =
      JSON.parse(
        await fs.readFile(
          MANIFEST_PATH,
          "utf8"
        )
      );

    const datasets = [];

    for (
      const item of manifest.completed
    ) {
      const dataset =
        await findDatasetById(
          item.cleanDatasetId
        );

      if (!dataset) {
        throw new Error(
          `DATASET_NOT_FOUND_${item.cleanDatasetId}`
        );
      }

      datasets.push(dataset);
    }

    datasets.sort(
      (left, right) =>
        new Date(
          left.startTime
        ).getTime() -
        new Date(
          right.startTime
        ).getTime()
    );

    let gapCount = 0;
    let overlapCount = 0;

    for (
      let index = 1;
      index < datasets.length;
      index += 1
    ) {
      const previous =
        datasets[index - 1];

      const current =
        datasets[index];

      const expectedNext =
        new Date(
          previous.endTime
        ).getTime() +
        ONE_MINUTE_MS;

      const actualNext =
        new Date(
          current.startTime
        ).getTime();

      if (
        actualNext >
        expectedNext
      ) {
        gapCount += 1;

        console.log(
          "GAP",
          previous.endTime,
          "→",
          current.startTime
        );
      }

      if (
        actualNext <
        expectedNext
      ) {
        overlapCount += 1;

        console.log(
          "OVERLAP",
          previous.endTime,
          "→",
          current.startTime
        );
      }

      const compatible =
        previous.venue ===
          current.venue &&
        previous.instrument ===
          current.instrument &&
        previous.marketType ===
          current.marketType &&
        previous.sourceTimeframe ===
          current.sourceTimeframe &&
        previous.timezone ===
          current.timezone;

      if (!compatible) {
        throw new Error(
          `INCOMPATIBLE_DATASETS_${previous.id}_${current.id}`
        );
      }
    }

    const totalRows =
      datasets.reduce(
        (sum, dataset) =>
          sum +
          Number(
            dataset.rowCount
          ),
        0
      );

    const result = {
      datasetCount:
        datasets.length,

      boundaryCount:
        datasets.length - 1,

      gapCount,
      overlapCount,

      totalRows,

      firstTimestamp:
        datasets[0]
          .startTime,

      lastTimestamp:
        datasets[
          datasets.length - 1
        ].endTime,
    };

    console.dir(
      result,
      {
        depth: null,
      }
    );

    if (
      gapCount !== 0 ||
      overlapCount !== 0
    ) {
      throw new Error(
        "CLEAN_HISTORY_BOUNDARIES_INVALID"
      );
    }

    console.log(
      "BTCUSDT CLEAN boundaries passed"
    );
  } catch (error) {
    console.error(
      "Boundary check failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();