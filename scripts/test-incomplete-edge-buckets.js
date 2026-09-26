const fs = require("fs/promises");
const path = require("path");

const { parse } = require("csv-parse/sync");

const {
  aggregateCandleTimeframe,
} = require(
  "../src/modules/datasets/timeframes/aggregateCandleTimeframe"
);

const run = async () => {
  const directory = path.resolve(
    "storage/temp-edge-buckets"
  );

  const inputPath = path.join(
    directory,
    "input.csv"
  );

  const outputPath = path.join(
    directory,
    "output.csv"
  );

  try {
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

        // Первый 5m bucket начинается с 00:02
        "2026-09-20T00:02:00Z,100,102,99,101,10",
        "2026-09-20T00:03:00Z,101,103,100,102,11",
        "2026-09-20T00:04:00Z,102,104,101,103,12",

        // Полный bucket 00:05-00:09
        "2026-09-20T00:05:00Z,103,105,102,104,13",
        "2026-09-20T00:06:00Z,104,106,103,105,14",
        "2026-09-20T00:07:00Z,105,107,104,106,15",
        "2026-09-20T00:08:00Z,106,108,105,107,16",
        "2026-09-20T00:09:00Z,107,109,106,108,17",

        // Последний bucket заканчивается на 00:12
        "2026-09-20T00:10:00Z,108,110,107,109,18",
        "2026-09-20T00:11:00Z,109,111,108,110,19",
        "2026-09-20T00:12:00Z,110,112,109,111,20",
      ].join("\n")
    );

    const result =
      await aggregateCandleTimeframe({
        inputPath,
        outputPath,
        sourceTimeframe: "1m",
        targetTimeframe: "5m",
      });

    const content =
      await fs.readFile(
        outputPath,
        "utf8"
      );

    const rows = parse(
      content,
      {
        columns: true,
        trim: true,
        skip_empty_lines: true,
      }
    );

    console.dir(
      result,
      {
        depth: null,
      }
    );

    console.dir(
      rows,
      {
        depth: null,
      }
    );

    if (
      result.outputRowCount !== 3
    ) {
      throw new Error(
        "Expected 3 aggregated buckets"
      );
    }

    if (
      result.incompleteBucketCount !== 2
    ) {
      throw new Error(
        "Expected 2 incomplete edge buckets"
      );
    }

    if (
      rows[0].timestamp !==
      "2026-09-20T00:00:00.000Z"
    ) {
      throw new Error(
        "Incorrect first bucket timestamp"
      );
    }

    if (
      rows[0].source_count !== "3" ||
      rows[0].is_complete !== "false"
    ) {
      throw new Error(
        "First edge bucket should be incomplete"
      );
    }

    if (
      rows[1].source_count !== "5" ||
      rows[1].is_complete !== "true"
    ) {
      throw new Error(
        "Middle bucket should be complete"
      );
    }

    if (
      rows[2].timestamp !==
      "2026-09-20T00:10:00.000Z"
    ) {
      throw new Error(
        "Incorrect last bucket timestamp"
      );
    }

    if (
      rows[2].source_count !== "3" ||
      rows[2].is_complete !== "false"
    ) {
      throw new Error(
        "Last edge bucket should be incomplete"
      );
    }

    console.log(
      "Incomplete edge buckets test passed"
    );
  } catch (error) {
    console.error(
      "Incomplete edge buckets test failed:",
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
  }
};

run();