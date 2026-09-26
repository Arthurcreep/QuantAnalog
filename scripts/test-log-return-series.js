const fs = require("fs/promises");
const path = require("path");

const {
  buildLogReturnSeries,
} = require(
  "../src/modules/research/series/buildLogReturnSeries"
);

const {
  INCOMPLETE_BUCKET_POLICIES,
} = require(
  "../src/modules/datasets/timeframes/applyIncompleteBucketPolicy"
);

const run = async () => {
  const directory = path.resolve(
    "storage/temp-return-series"
  );

  const filePath = path.join(
    directory,
    "prepared.csv"
  );

  try {
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

        "2026-09-20T00:00:00Z,100,102,99,100,10,5,5,true",
        "2026-09-20T00:05:00Z,100,103,99,105,12,5,5,true",

        // incomplete — DROP policy уберёт её
        "2026-09-20T00:10:00Z,105,107,104,110,8,4,5,false",

        // нельзя считать 00:05 -> 00:15 как обычную 5m доходность
        "2026-09-20T00:15:00Z,110,113,109,115,14,5,5,true",

        "2026-09-20T00:20:00Z,115,118,114,120,15,5,5,true",
      ].join("\n")
    );

    const result =
      await buildLogReturnSeries({
        filePath,
        timeframe: "5m",

        incompletePolicy:
          INCOMPLETE_BUCKET_POLICIES.DROP,
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

    if (
      result.inputRowCount !== 5
    ) {
      throw new Error(
        "Incorrect input row count"
      );
    }

    if (
      result.skippedIncompleteCount !== 1
    ) {
      throw new Error(
        "Incomplete candle was not skipped"
      );
    }

    if (
      result.returnCount !== 2
    ) {
      throw new Error(
        `Expected 2 returns, got ${result.returnCount}`
      );
    }

    const firstExpected =
      Math.log(105 / 100);

    const secondExpected =
      Math.log(120 / 115);

    if (
      Math.abs(
        result.series[0].logReturn -
          firstExpected
      ) > 1e-12
    ) {
      throw new Error(
        "Incorrect first return"
      );
    }

    if (
      Math.abs(
        result.series[1].logReturn -
          secondExpected
      ) > 1e-12
    ) {
      throw new Error(
        "Incorrect second return"
      );
    }

    console.log(
      "Log return series test passed"
    );
  } catch (error) {
    console.error(
      "Log return series test failed:",
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