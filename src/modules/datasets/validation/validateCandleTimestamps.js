const fs = require("fs");
const { parse } = require("csv-parse");

const {
  timeframeToMilliseconds,
} = require("../calculations/timeframeToMilliseconds");

const {
  createAppError,
} = require("../../../errors/appError");

const {
  parseTimestamp,
} = require("../calculations/parseTimestamp");

const validateCandleTimestamps = async ({
  filePath,
  sourceTimeframe,
}) => {
  const timeframeMs =
    timeframeToMilliseconds(sourceTimeframe);

  if (!timeframeMs) {
    throw createAppError({
      statusCode: 400,
      code: "UNSUPPORTED_TIMEFRAME",
      message: `Unsupported source timeframe: ${sourceTimeframe}`,
    });
  }

  return new Promise((resolve, reject) => {
    let rowCount = 0;

    let invalidTimestampCount = 0;
    let outOfOrderCount = 0;
    let misalignedCount = 0;
    let intervalMismatchCount = 0;

    let previousTimestamp = null;
    let firstTimestamp = null;
    let lastTimestamp = null;

    const issues = [];

    const addIssue = (issue) => {
      if (issues.length < 10) {
        issues.push(issue);
      }
    };

    const parser = parse({
      columns: (headers) => {
        return headers.map((header) =>
          header.trim().toLowerCase()
        );
      },

      trim: true,
      skip_empty_lines: true,
    });

    parser.on("readable", () => {
      let row;

      while ((row = parser.read()) !== null) {
        rowCount += 1;

        const timestamp =
          parseTimestamp(row.timestamp);

        if (timestamp === null) {
          invalidTimestampCount += 1;

          addIssue({
            row: rowCount,
            type: "INVALID_TIMESTAMP",
            value: row.timestamp,
          });

          continue;
        }

        if (firstTimestamp === null) {
          firstTimestamp = timestamp;
        }

        lastTimestamp = timestamp;

        if (timestamp % timeframeMs !== 0) {
          misalignedCount += 1;

          addIssue({
            row: rowCount,
            type: "MISALIGNED_TIMESTAMP",
            value: row.timestamp,
          });
        }

        if (previousTimestamp !== null) {
          const interval =
            timestamp - previousTimestamp;

          if (timestamp < previousTimestamp) {
            outOfOrderCount += 1;

            addIssue({
              row: rowCount,
              type: "OUT_OF_ORDER",
              value: row.timestamp,
            });
          }

          if (interval !== timeframeMs) {
            intervalMismatchCount += 1;
          }
        }

        previousTimestamp = timestamp;
      }
    });

    parser.on("error", (error) => {
      reject(error);
    });

    parser.on("end", () => {
      const valid =
        invalidTimestampCount === 0 &&
        outOfOrderCount === 0 &&
        misalignedCount === 0;

      resolve({
        valid,
        intervalConsistent:
          intervalMismatchCount === 0,

        sourceTimeframe,
        expectedIntervalMs: timeframeMs,

        rowCount,

        invalidTimestampCount,
        outOfOrderCount,
        misalignedCount,
        intervalMismatchCount,

        firstTimestamp:
          firstTimestamp === null
            ? null
            : new Date(firstTimestamp).toISOString(),

        lastTimestamp:
          lastTimestamp === null
            ? null
            : new Date(lastTimestamp).toISOString(),

        issues,
      });
    });

    fs.createReadStream(filePath).pipe(parser);
  });
};

module.exports = {
  validateCandleTimestamps,
};