const fs = require("fs/promises");
const path = require("path");

const {
  validateCandleCsvSchema,
} = require(
  "../src/modules/datasets/validation/validateCandleCsvSchema"
);

const run = async () => {
  const tempDirectory = path.resolve("storage/temp-schema");

  const validFilePath = path.join(
    tempDirectory,
    "valid.csv"
  );

  const invalidFilePath = path.join(
    tempDirectory,
    "invalid.csv"
  );

  try {
    await fs.mkdir(tempDirectory, {
      recursive: true,
    });

    await fs.writeFile(
      validFilePath,
      [
        "timestamp,open,high,low,close,volume",
        "2026-09-20T00:00:00Z,100,110,90,105,10",
        "2026-09-20T00:01:00Z,105,112,101,108,15",
      ].join("\n")
    );

    await fs.writeFile(
      invalidFilePath,
      [
        "timestamp,open,close",
        "2026-09-20T00:00:00Z,100,105",
      ].join("\n")
    );

    const validResult =
      await validateCandleCsvSchema(validFilePath);

    const invalidResult =
      await validateCandleCsvSchema(invalidFilePath);

    console.log("VALID FILE");

    console.log(validResult);

    console.log("INVALID FILE");

    console.log(invalidResult);

    if (!validResult.valid) {
      throw new Error(
        "Valid candle CSV failed schema validation"
      );
    }

    if (invalidResult.valid) {
      throw new Error(
        "Invalid candle CSV unexpectedly passed validation"
      );
    }

    console.log("Candle schema validation test passed");
  } catch (error) {
    console.error(
      "Candle schema validation test failed:",
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