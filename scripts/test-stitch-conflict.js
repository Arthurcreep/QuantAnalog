const fs = require("fs/promises");
const path = require("path");

const {
  stitchCandleCsv,
} = require(
  "../src/modules/datasets/stitching/stitchCandleCsv"
);

const run = async () => {
  const directory = path.resolve(
    "storage/temp-stitch-conflict"
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
      ].join("\n")
    );

    await fs.writeFile(
      rightPath,
      [
        "timestamp,open,high,low,close,volume",

        // same timestamp, different close
        "2026-09-20T00:01:00Z,105,112,101,109,15",

        "2026-09-20T00:02:00Z,109,115,106,110,12",
      ].join("\n")
    );

    let conflictDetected = false;

    try {
      await stitchCandleCsv({
        leftPath,
        rightPath,
        outputPath,
      });
    } catch (error) {
      conflictDetected =
        error.message.includes(
          "STITCH_CONFLICT"
        );

      console.log(error.message);
    }

    if (!conflictDetected) {
      throw new Error(
        "Conflicting overlap was not detected"
      );
    }

    console.log(
      "Candle stitching conflict test passed"
    );
  } catch (error) {
    console.error(
      "Candle stitching conflict test failed:",
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