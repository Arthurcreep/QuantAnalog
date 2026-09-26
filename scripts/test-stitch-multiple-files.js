const fs = require("fs/promises");
const path = require("path");

const {
  stitchCandleFiles,
} = require(
  "../src/modules/datasets/stitching/stitchCandleFiles"
);

const {
  analyzeCandleIntervals,
} = require(
  "../src/modules/datasets/validation/analyzeCandleIntervals"
);

const run = async () => {
  const directory =
    path.resolve(
      "storage/temp-multi-stitch-test"
    );

  const firstPath =
    path.join(
      directory,
      "first.csv"
    );

  const secondPath =
    path.join(
      directory,
      "second.csv"
    );

  const thirdPath =
    path.join(
      directory,
      "third.csv"
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
      firstPath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:00:00Z,100,110,90,105,10",
        "2026-09-20T00:01:00Z,105,112,101,108,15",
      ].join("\n")
    );

    await fs.writeFile(
      secondPath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:01:00Z,105,112,101,108,15",
        "2026-09-20T00:02:00Z,108,115,106,110,12",
      ].join("\n")
    );

    await fs.writeFile(
      thirdPath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:02:00Z,108,115,106,110,12",
        "2026-09-20T00:04:00Z,110,118,109,116,20",
      ].join("\n")
    );

    const result =
      await stitchCandleFiles({
        // специально неправильный порядок
        inputPaths: [
          thirdPath,
          firstPath,
          secondPath,
        ],

        outputPath,
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

    const intervals =
      await analyzeCandleIntervals({
        filePath:
          outputPath,

        sourceTimeframe:
          "1m",
      });

    if (
      result.outputRowCount !== 4
    ) {
      throw new Error(
        "Incorrect stitched row count"
      );
    }

    if (
      result.duplicateOverlapCount !== 2
    ) {
      throw new Error(
        "Incorrect duplicate overlap count"
      );
    }

    if (
      result.sourceFileCount !== 3
    ) {
      throw new Error(
        "Incorrect source file count"
      );
    }

    if (
      result.firstTimestamp !==
      "2026-09-20T00:00:00Z"
    ) {
      throw new Error(
        "Incorrect first timestamp"
      );
    }

    if (
      result.lastTimestamp !==
      "2026-09-20T00:04:00Z"
    ) {
      throw new Error(
        "Incorrect last timestamp"
      );
    }

    if (
      intervals.outOfOrderCount !== 0
    ) {
      throw new Error(
        "Output is not chronological"
      );
    }

    if (
      intervals.duplicateCount !== 0
    ) {
      throw new Error(
        "Output still contains duplicates"
      );
    }

    if (
      intervals.missingIntervalCount !== 1
    ) {
      throw new Error(
        "Gap was not preserved"
      );
    }

    console.log(
      "Multiple candle file stitching test passed"
    );
  } catch (error) {
    console.error(
      "Multiple candle file stitching test failed:",
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