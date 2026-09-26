const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");

const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

const {
  parseTimestamp,
} = require("../calculations/parseTimestamp");

const {
  validateTimeframeConversion,
} = require("./validateTimeframeConversion");

const createBucket = ({
  row,
  bucketTimestamp,
}) => ({
  timestamp:
    new Date(bucketTimestamp).toISOString(),

  open: Number(row.open),
  high: Number(row.high),
  low: Number(row.low),
  close: Number(row.close),
  volume: Number(row.volume),

  sourceCount: 1,
});

const addRowToBucket = (
  bucket,
  row
) => {
  bucket.high = Math.max(
    bucket.high,
    Number(row.high)
  );

  bucket.low = Math.min(
    bucket.low,
    Number(row.low)
  );

  bucket.close =
    Number(row.close);

  bucket.volume +=
    Number(row.volume);

  bucket.sourceCount += 1;
};

const aggregateCandleTimeframe = async ({
  inputPath,
  outputPath,
  sourceTimeframe,
  targetTimeframe,
}) => {
  const conversion =
    validateTimeframeConversion({
      sourceTimeframe,
      targetTimeframe,
    });

  await fsPromises.mkdir(
    path.dirname(outputPath),
    {
      recursive: true,
    }
  );

  const parser = fs
    .createReadStream(inputPath)
    .pipe(
      parse({
        columns: true,
        trim: true,
        skip_empty_lines: true,
      })
    );

  const outputStream =
    fs.createWriteStream(outputPath);

  const writer = stringify({
    header: true,
    columns: [
      "timestamp",
      "open",
      "high",
      "low",
      "close",
      "volume",
      "source_count",
      "expected_source_count",
      "is_complete",
    ],
  });

  writer.pipe(outputStream);

  let bucket = null;

  let outputRowCount = 0;
  let incompleteBucketCount = 0;

  const flushBucket = () => {
    if (!bucket) {
      return;
    }

    const isComplete =
      bucket.sourceCount ===
      conversion.expectedSourceRows;

    if (!isComplete) {
      incompleteBucketCount += 1;
    }

    writer.write({
      timestamp:
        bucket.timestamp,

      open:
        bucket.open,

      high:
        bucket.high,

      low:
        bucket.low,

      close:
        bucket.close,

      volume:
        bucket.volume,

      source_count:
        bucket.sourceCount,

      expected_source_count:
        conversion.expectedSourceRows,

      is_complete:
        isComplete
          ? "true"
          : "false",
    });

    outputRowCount += 1;
  };

  for await (const row of parser) {
    const timestamp =
      parseTimestamp(
        row.timestamp
      );

    if (timestamp === null) {
      throw new Error(
        "TIMEFRAME_INVALID_TIMESTAMP"
      );
    }

    const bucketTimestamp =
      Math.floor(
        timestamp /
          conversion.targetMs
      ) * conversion.targetMs;

    const bucketIso =
      new Date(
        bucketTimestamp
      ).toISOString();

    if (
      !bucket ||
      bucket.timestamp !== bucketIso
    ) {
      flushBucket();

      bucket = createBucket({
        row,
        bucketTimestamp,
      });

      continue;
    }

    addRowToBucket(
      bucket,
      row
    );
  }

  flushBucket();

  writer.end();

  await new Promise(
    (resolve, reject) => {
      outputStream.on(
        "finish",
        resolve
      );

      outputStream.on(
        "error",
        reject
      );

      writer.on(
        "error",
        reject
      );
    }
  );

  return {
    sourceTimeframe,
    targetTimeframe,

    outputRowCount,
    incompleteBucketCount,

    expectedSourceRows:
      conversion.expectedSourceRows,
  };
};

module.exports = {
  aggregateCandleTimeframe,
};