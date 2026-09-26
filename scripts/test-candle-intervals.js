const fs = require("fs/promises");
const path = require("path");

const {
  analyzeCandleIntervals,
} = require(
  "../src/modules/datasets/validation/analyzeCandleIntervals"
);

const run = async () => {
  const tempDirectory = path.resolve(
    "storage/temp-intervals"
  );

  const filePath = path.join(
    tempDirectory,
    "intervals.csv"
  );

  try {
    await fs.mkdir(tempDirectory, {
      recursive: true,
    });

    await fs.writeFile(
      filePath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:00:00Z,100,110,90,105,10",
        "2026-09-20T00:01:00Z,105,112,101,108,15",
        "2026-09-20T00:01:00Z,105,112,101,108,15",
        "2026-09-20T00:04:00Z,108,115,106,110,12",
      ].join("\n")
    );

    const result =
      await analyzeCandleIntervals({
        filePath,
        sourceTimeframe: "1m",
      });

    console.log(result);

    if (result.duplicateCount !== 1) {
      throw new Error(
        "Duplicate detection failed"
      );
    }

    if (result.gapCount !== 1) {
      throw new Error(
        "Gap detection failed"
      );
    }

    if (result.missingIntervalCount !== 2) {
      throw new Error(
        "Missing interval count is incorrect"
      );
    }

    console.log(
      "Candle interval analysis test passed"
    );
  } catch (error) {
    console.error(
      "Candle interval analysis test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await fs.rm(tempDirectory, {
      recursive: true,
      force: true,
    });
  }
};

run();