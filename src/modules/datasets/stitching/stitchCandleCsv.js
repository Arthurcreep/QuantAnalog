const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const { finished } = require("stream/promises");

const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

const {
  parseTimestamp,
} = require("../calculations/parseTimestamp");

const CANDLE_COLUMNS = [
  "timestamp",
  "open",
  "high",
  "low",
  "close",
  "volume",
];

const rowsEqual = (left, right) =>
  CANDLE_COLUMNS.every(
    (column) =>
      String(left[column]).trim() ===
      String(right[column]).trim()
  );

const createRowIterator = (filePath) => {
  const parser = fs
    .createReadStream(filePath)
    .pipe(
      parse({
        columns: true,
        trim: true,
        skip_empty_lines: true,
      })
    );

  return parser[Symbol.asyncIterator]();
};

const stitchCandleCsv = async ({
  leftPath,
  rightPath,
  outputPath,
}) => {
  await fsPromises.mkdir(
    path.dirname(outputPath),
    {
      recursive: true,
    }
  );

  const left =
    createRowIterator(leftPath);

  const right =
    createRowIterator(rightPath);

  const outputStream =
    fs.createWriteStream(outputPath);

  const writer = stringify({
    header: true,
    columns: CANDLE_COLUMNS,
  });

  writer.pipe(outputStream);

  const outputFinished =
    finished(outputStream);

  let leftItem = await left.next();
  let rightItem = await right.next();

  let outputRowCount = 0;
  let duplicateOverlapCount = 0;

  let firstTimestamp = null;
  let lastTimestamp = null;

  const writeRow = (row) => {
    writer.write(row);

    outputRowCount += 1;

    if (!firstTimestamp) {
      firstTimestamp = row.timestamp;
    }

    lastTimestamp = row.timestamp;
  };

  try {
    while (
      !leftItem.done ||
      !rightItem.done
    ) {
      if (leftItem.done) {
        writeRow(rightItem.value);

        rightItem =
          await right.next();

        continue;
      }

      if (rightItem.done) {
        writeRow(leftItem.value);

        leftItem =
          await left.next();

        continue;
      }

      const leftTimestamp =
        parseTimestamp(
          leftItem.value.timestamp
        );

      const rightTimestamp =
        parseTimestamp(
          rightItem.value.timestamp
        );

      if (
        leftTimestamp === null ||
        rightTimestamp === null
      ) {
        throw new Error(
          "STITCH_INVALID_TIMESTAMP"
        );
      }

      if (
        leftTimestamp <
        rightTimestamp
      ) {
        writeRow(leftItem.value);

        leftItem =
          await left.next();

        continue;
      }

      if (
        rightTimestamp <
        leftTimestamp
      ) {
        writeRow(rightItem.value);

        rightItem =
          await right.next();

        continue;
      }

      if (
        !rowsEqual(
          leftItem.value,
          rightItem.value
        )
      ) {
        throw new Error(
          `STITCH_CONFLICT at timestamp ${leftItem.value.timestamp}`
        );
      }

      writeRow(leftItem.value);

      duplicateOverlapCount += 1;

      leftItem =
        await left.next();

      rightItem =
        await right.next();
    }

    writer.end();

    await outputFinished;

    return {
      outputRowCount,
      duplicateOverlapCount,
      firstTimestamp,
      lastTimestamp,
    };
  } catch (error) {
    await Promise.allSettled([
      left.return?.(),
      right.return?.(),
    ]);

    writer.end();

    await outputFinished.catch(
      () => null
    );

    await fsPromises.rm(
      outputPath,
      {
        force: true,
      }
    );

    throw error;
  }
};

module.exports = {
  stitchCandleCsv,
};