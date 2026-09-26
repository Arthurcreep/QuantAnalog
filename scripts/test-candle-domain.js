const fs = require("fs/promises");
const path = require("path");

const {
  validateCandleDomain,
} = require(
  "../src/modules/datasets/validation/validateCandleDomain"
);

const run = async () => {
  const tempDirectory = path.resolve(
    "storage/temp-domain"
  );

  const filePath = path.join(
    tempDirectory,
    "domain.csv"
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

        "2026-09-20T00:01:00Z,105,100,101,108,15",

        "2026-09-20T00:02:00Z,108,115,106,110,-5",

        "2026-09-20T00:03:00Z,110,115,108,112,0",
      ].join("\n")
    );

    const result =
      await validateCandleDomain(filePath);

    console.log(result);

    if (result.rowCount !== 4) {
      throw new Error(
        "Incorrect row count"
      );
    }

    if (result.validCount !== 2) {
      throw new Error(
        "Incorrect valid candle count"
      );
    }

    if (result.invalidCount !== 2) {
      throw new Error(
        "Incorrect invalid candle count"
      );
    }

    if (result.zeroVolumeCount !== 1) {
      throw new Error(
        "Zero volume detection failed"
      );
    }

    console.log(
      "Candle domain validation test passed"
    );
  } catch (error) {
    console.error(
      "Candle domain validation test failed:",
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