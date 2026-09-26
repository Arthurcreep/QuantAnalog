const fs = require("fs/promises");
const path = require("path");

const {
  validateCandleDataset,
} = require(
  "../src/modules/datasets/validation/validateCandleDataset"
);

const {
  buildDataQualityReport,
} = require(
  "../src/modules/datasets/quality/buildDataQualityReport"
);

const {
  evaluateDataQualityStatus,
} = require(
  "../src/modules/datasets/quality/evaluateDataQualityStatus"
);

const run = async () => {
  const tempDirectory = path.resolve(
    "storage/temp-quality"
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
        "2026-09-20T00:03:00Z,108,115,106,110,12",
        "2026-09-20T00:04:00Z,110,105,108,112,9",
      ].join("\n")
    );

    const validation =
      await validateCandleDataset({
        filePath,
        sourceTimeframe: "1m",
      });

    const report =
      buildDataQualityReport(validation);

    const policy = {
      maxInvalidRows: 0,
      maxInvalidTimestampCount: 0,
      maxOutOfOrderCount: 0,
      maxMissingIntervalRatio: 0.25,
      maxDuplicateRatio: 0,
    };

    const qualityStatus =
      evaluateDataQualityStatus({
        report,
        policy,
      });

    const result = {
      ...report,
      qualityStatus,
    };

    console.log(result);

    if (
      qualityStatus !== "BLOCKED"
    ) {
      throw new Error(
        "Dataset should be BLOCKED"
      );
    }

    console.log(
      "Data Quality Report test passed"
    );
  } catch (error) {
    console.error(
      "Data Quality Report test failed:",
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