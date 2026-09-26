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
    "storage/temp-timeframe-test"
  );

  const inputPath =
    path.join(
      directory,
      "input.csv"
    );

  const outputPath =
    path.join(
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

    const result =
      await aggregateCandleTimeframe({
        inputPath,
        outputPath,
        sourceTimeframe: "1m",
        targetTimeframe: "5m",
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

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
      rows,
      {
        depth: null,
      }
    );

    if (rows.length !== 2) {
      throw new Error(
        "Expected 2 aggregated candles"
      );
    }

    const first = rows[0];
    const second = rows[1];

    if (
      first.open !== "100" ||
      first.high !== "106" ||
      first.low !== "99" ||
      first.close !== "105"
    ) {
      throw new Error(
        "Incorrect first 5m OHLC"
      );
    }

    if (
      Number(first.volume) !== 60
    ) {
      throw new Error(
        "Incorrect first 5m volume"
      );
    }

    if (
      first.source_count !== "5" ||
      first.is_complete !== "true"
    ) {
      throw new Error(
        "First bucket should be complete"
      );
    }

    if (
      second.source_count !== "4" ||
      second.is_complete !== "false"
    ) {
      throw new Error(
        "Second bucket should be incomplete"
      );
    }

    if (
      result.incompleteBucketCount !== 1
    ) {
      throw new Error(
        "Incorrect incomplete bucket count"
      );
    }

    console.log(
      "Timeframe aggregation test passed"
    );
  } catch (error) {
    console.error(
      "Timeframe aggregation test failed:",
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