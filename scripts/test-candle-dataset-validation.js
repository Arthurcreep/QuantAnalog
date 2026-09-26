const fs = require("fs/promises");
const path = require("path");

const {
  validateCandleDataset,
} = require(
  "../src/modules/datasets/validation/validateCandleDataset"
);

const run = async () => {
  const tempDirectory = path.resolve(
    "storage/temp-dataset-validation"
  );

  const filePath = path.join(
    tempDirectory,
    "dataset.csv"
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

        // 00:02 отсутствует

        "2026-09-20T00:03:00Z,108,115,106,110,12",

        // invalid high
        "2026-09-20T00:04:00Z,110,105,108,112,9",
      ].join("\n")
    );

    const result =
      await validateCandleDataset({
        filePath,
        sourceTimeframe: "1m",
      });

    console.dir(result, {
      depth: null,
    });

    if (result.schema.valid !== true) {
      throw new Error(
        "Schema validation failed"
      );
    }

    if (
      result.intervals.missingIntervalCount !== 1
    ) {
      throw new Error(
        "Gap analysis failed"
      );
    }

    if (result.domain.invalidCount !== 1) {
      throw new Error(
        "Domain validation failed"
      );
    }

    if (result.valid !== false) {
      throw new Error(
        "Invalid dataset unexpectedly passed"
      );
    }

    console.log(
      "Candle dataset validation test passed"
    );
  } catch (error) {
    console.error(
      "Candle dataset validation test failed:",
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