const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const {
  stitchCandleCsv,
} = require("./stitchCandleCsv");

const stitchCandleFiles = async ({
  inputPaths,
  outputPath,
}) => {
  if (
    !Array.isArray(inputPaths) ||
    inputPaths.length < 2
  ) {
    throw new Error(
      "STITCH_REQUIRES_MULTIPLE_FILES"
    );
  }

  const tempDirectory =
    path.resolve(
      "storage/temp-stitch"
    );

  await fs.mkdir(
    tempDirectory,
    {
      recursive: true,
    }
  );

  let currentPath =
    inputPaths[0];

  let finalResult = null;

  let duplicateOverlapCount = 0;

  const temporaryFiles = [];

  try {
    for (
      let index = 1;
      index < inputPaths.length;
      index += 1
    ) {
      const isLast =
        index ===
        inputPaths.length - 1;

      const nextOutputPath =
        isLast
          ? outputPath
          : path.join(
              tempDirectory,
              `${crypto.randomUUID()}.csv`
            );

      const result =
        await stitchCandleCsv({
          leftPath:
            currentPath,

          rightPath:
            inputPaths[index],

          outputPath:
            nextOutputPath,
        });

      duplicateOverlapCount +=
        result.duplicateOverlapCount;

      finalResult = result;

      if (!isLast) {
        temporaryFiles.push(
          nextOutputPath
        );
      }

      currentPath =
        nextOutputPath;
    }

    return {
      outputRowCount:
        finalResult.outputRowCount,

      duplicateOverlapCount,

      sourceFileCount:
        inputPaths.length,

      firstTimestamp:
        finalResult.firstTimestamp,

      lastTimestamp:
        finalResult.lastTimestamp,
    };
  } finally {
    await Promise.all(
      temporaryFiles.map(
        (filePath) =>
          fs.rm(
            filePath,
            {
              force: true,
            }
          )
      )
    );
  }
};

module.exports = {
  stitchCandleFiles,
};