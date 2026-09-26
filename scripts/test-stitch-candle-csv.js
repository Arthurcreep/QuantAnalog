const fs = require("fs/promises");
const path = require("path");

const {
  stitchCandleCsv,
} = require(
  "../src/modules/datasets/stitching/stitchCandleCsv"
);

const {
  analyzeCandleIntervals,
} = require(
  "../src/modules/datasets/validation/analyzeCandleIntervals"
);

const run = async () => {
  const directory = path.resolve(
    "storage/temp-stitch"
  );

  const leftPath =
    path.join(directory, "a.csv");

  const rightPath =
    path.join(directory, "b.csv");

  const outputPath =
    path.join(directory, "out.csv");

  try {
    await fs.mkdir(directory, {
      recursive: true,
    });

    await fs.writeFile(
      leftPath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:00:00Z,100,110,90,105,10",
        "2026-09-20T00:01:00Z,105,112,101,108,15",
        "2026-09-20T00:02:00Z,108,115,106,110,12",
      ].join("\n")
    );

    await fs.writeFile(
      rightPath,
      [
        "timestamp,open,high,low,close,volume",

        // exact overlap
        "2026-09-20T00:02:00Z,108,115,106,110,12",

        // gap at 00:03 remains
        "2026-09-20T00:04:00Z,110,118,109,116,20",
      ].join("\n")
    );

    const result =
      await stitchCandleCsv({
        leftPath,
        rightPath,
        outputPath,
      });

    console.dir(result, {
      depth: null,
    });

    const intervals =
      await analyzeCandleIntervals({
        filePath: outputPath,
        sourceTimeframe: "1m",
      });

    if (result.outputRowCount !== 4) {
      throw new Error(
        "Incorrect stitched row count"
      );
    }

    if (
      result.duplicateOverlapCount !== 1
    ) {
      throw new Error(
        "Exact overlap was not deduplicated"
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
      "Candle stitching test passed"
    );
  } catch (error) {
    console.error(
      "Candle stitching test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await fs.rm(directory, {
      recursive: true,
      force: true,
    });
  }
};

run();