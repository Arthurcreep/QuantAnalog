const fs = require("fs/promises");
const path = require("path");

const {
  cleanCandleCsv,
} = require(
  "../src/modules/datasets/cleaning/cleanCandleCsv"
);

const {
  validateCandleDomain,
} = require(
  "../src/modules/datasets/validation/validateCandleDomain"
);

const {
  analyzeCandleIntervals,
} = require(
  "../src/modules/datasets/validation/analyzeCandleIntervals"
);

const run = async () => {
  const tempDirectory = path.resolve(
    "storage/temp-clean-candle"
  );

  const inputPath = path.join(
    tempDirectory,
    "input.csv"
  );

  const outputPath = path.join(
    tempDirectory,
    "output.csv"
  );

  try {
    await fs.mkdir(tempDirectory, {
      recursive: true,
    });

    await fs.writeFile(
      inputPath,
      [
        "timestamp,open,high,low,close,volume",

        "2026-09-20T00:00:00Z,100,110,90,105,10",

        // exact duplicate
        "2026-09-20T00:00:00Z,100,110,90,105,10",

        // invalid
        "2026-09-20T00:01:00Z,105,100,101,108,15",

        // gap remains
        "2026-09-20T00:03:00Z,108,115,106,110,12",
      ].join("\n")
    );

    const result =
      await cleanCandleCsv({
        inputPath,
        outputPath,
      });

    console.dir(result, {
      depth: null,
    });

    const domain =
      await validateCandleDomain(
        outputPath
      );

    const intervals =
      await analyzeCandleIntervals({
        filePath: outputPath,
        sourceTimeframe: "1m",
      });

    if (result.inputRowCount !== 4) {
      throw new Error(
        "Incorrect input row count"
      );
    }

    if (result.outputRowCount !== 2) {
      throw new Error(
        "Incorrect output row count"
      );
    }

    if (
      result.removedDuplicateCount !== 1
    ) {
      throw new Error(
        "Duplicate cleaning failed"
      );
    }

    if (
      result.removedInvalidCount !== 1
    ) {
      throw new Error(
        "Invalid row cleaning failed"
      );
    }

    if (domain.invalidCount !== 0) {
      throw new Error(
        "CLEAN dataset still contains invalid rows"
      );
    }

    if (
      intervals.missingIntervalCount !== 2
    ) {
      throw new Error(
        "Gap was not preserved correctly"
      );
    }

    console.log(
      "Candle cleaning pipeline test passed"
    );
  } catch (error) {
    console.error(
      "Candle cleaning pipeline test failed:",
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