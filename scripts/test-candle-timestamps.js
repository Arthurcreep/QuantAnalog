const fs = require("fs/promises");
const path = require("path");

const {
  validateCandleTimestamps,
} = require(
  "../src/modules/datasets/validation/validateCandleTimestamps"
);

const run = async () => {
  const tempDirectory = path.resolve(
    "storage/temp-timestamps"
  );

  const validPath = path.join(
    tempDirectory,
    "valid.csv"
  );

  const gapPath = path.join(
    tempDirectory,
    "gap.csv"
  );

  const brokenPath = path.join(
    tempDirectory,
    "broken.csv"
  );

  try {
    await fs.mkdir(tempDirectory, {
      recursive: true,
    });

    await fs.writeFile(
      validPath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:00:00Z,100,110,90,105,10",
        "2026-09-20T00:01:00Z,105,112,101,108,15",
        "2026-09-20T00:02:00Z,108,115,106,110,12",
      ].join("\n")
    );

    await fs.writeFile(
      gapPath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:00:00Z,100,110,90,105,10",
        "2026-09-20T00:02:00Z,108,115,106,110,12",
      ].join("\n")
    );

    await fs.writeFile(
      brokenPath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:00:30Z,100,110,90,105,10",
        "not-a-timestamp,105,112,101,108,15",
      ].join("\n")
    );

    const validResult =
      await validateCandleTimestamps({
        filePath: validPath,
        sourceTimeframe: "1m",
      });

    const gapResult =
      await validateCandleTimestamps({
        filePath: gapPath,
        sourceTimeframe: "1m",
      });

    const brokenResult =
      await validateCandleTimestamps({
        filePath: brokenPath,
        sourceTimeframe: "1m",
      });

    console.log("VALID TIMESTAMPS");
    console.log(validResult);

    console.log("INTERVAL IRREGULARITY");
    console.log(gapResult);

    console.log("BROKEN TIMESTAMPS");
    console.log(brokenResult);

    if (!validResult.valid) {
      throw new Error(
        "Valid timestamps unexpectedly failed"
      );
    }

    if (!validResult.intervalConsistent) {
      throw new Error(
        "Valid intervals unexpectedly failed"
      );
    }

    if (
      !gapResult.valid ||
      gapResult.intervalConsistent
    ) {
      throw new Error(
        "Interval irregularity was classified incorrectly"
      );
    }

    if (brokenResult.valid) {
      throw new Error(
        "Broken timestamps unexpectedly passed"
      );
    }

    console.log(
      "Candle timestamp validation test passed"
    );
  } catch (error) {
    console.error(
      "Candle timestamp validation test failed:",
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