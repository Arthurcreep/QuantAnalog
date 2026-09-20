const fs = require("fs/promises");
const path = require("path");

const {
  calculateFileChecksum,
} = require("../src/modules/datasets/calculations/calculateFileChecksum");

const {
  storeRawFile,
} = require("../src/modules/datasets/storage/rawStorage");

const run = async () => {
  const tempDirectory = path.resolve("storage/temp");
  const tempFilePath = path.join(
    tempDirectory,
    "test-btc.csv"
  );

  try {
    await fs.mkdir(tempDirectory, {
      recursive: true,
    });

    await fs.writeFile(
      tempFilePath,
      "timestamp,open,high,low,close,volume\n2026-09-20T00:00:00Z,100,110,90,105,10\n"
    );

    const checksum = await calculateFileChecksum(
      tempFilePath
    );

    const storedFile = await storeRawFile({
      sourcePath: tempFilePath,
      originalFilename: "test-btc.csv",
      checksum,
    });

    console.log({
      checksum,
      storedPath: storedFile.path,
      alreadyExists: storedFile.alreadyExists,
    });

    console.log("RAW storage test passed");
  } catch (error) {
    console.error("RAW storage test failed:", error);

    process.exitCode = 1;
  } finally {
    await fs.rm(tempDirectory, {
      recursive: true,
      force: true,
    });
  }
};

run();