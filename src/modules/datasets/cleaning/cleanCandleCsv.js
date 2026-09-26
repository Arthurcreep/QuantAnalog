const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");

const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

const {
  validateCandleRow,
} = require("../validation/validateCandleRow");

const rowsEqual = (left, right) => {
  if (!left || left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => {
    return String(value).trim() ===
      String(right[index]).trim();
  });
};

const cleanCandleCsv = async ({
  inputPath,
  outputPath,
}) => {
  await fsPromises.mkdir(
    path.dirname(outputPath),
    {
      recursive: true,
    }
  );

  const parser = parse({
    trim: true,
    skip_empty_lines: true,
  });

  const stringifier = stringify();

  fs.createReadStream(inputPath).pipe(parser);

  const outputStream =
    fs.createWriteStream(outputPath);

  stringifier.pipe(outputStream);

  let headers = null;
  let previousRawRow = null;

  let inputRowCount = 0;
  let outputRowCount = 0;

  let removedDuplicateCount = 0;
  let removedInvalidCount = 0;

  const repairEvents = [];

  for await (const row of parser) {
    if (!headers) {
      headers = row.map((value) =>
        String(value).trim().toLowerCase()
      );

      stringifier.write(row);
      continue;
    }

    inputRowCount += 1;

    const candle = Object.fromEntries(
      headers.map((header, index) => [
        header,
        row[index],
      ])
    );

    if (
      previousRawRow &&
      rowsEqual(previousRawRow, row)
    ) {
      removedDuplicateCount += 1;

      repairEvents.push({
        type: "EXACT_DUPLICATE_REMOVED",
        sourceDataRow: inputRowCount,
        sourceLine: inputRowCount + 1,
        timestamp: candle.timestamp || null,
        oldValue: candle,
        issues: [],
      });

      previousRawRow = row;

      continue;
    }

    previousRawRow = row;

    const validation =
      validateCandleRow(candle);

    if (validation.status === "INVALID") {
      removedInvalidCount += 1;

      repairEvents.push({
        type: "INVALID_ROW_REMOVED",
        sourceDataRow: inputRowCount,
        sourceLine: inputRowCount + 1,
        timestamp: candle.timestamp || null,
        oldValue: candle,
        issues: validation.issues,
      });

      continue;
    }

    stringifier.write(row);

    outputRowCount += 1;
  }

  stringifier.end();

  await new Promise((resolve, reject) => {
    outputStream.on("finish", resolve);
    outputStream.on("error", reject);
  });

  return {
    inputRowCount,
    outputRowCount,

    removedCount:
      removedDuplicateCount +
      removedInvalidCount,

    removedDuplicateCount,
    removedInvalidCount,

    repairEvents,
  };
};

module.exports = {
  cleanCandleCsv,
};