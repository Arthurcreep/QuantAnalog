const fs = require("fs");
const { parse } = require("csv-parse");

const {
  parseTimestamp,
} = require("../calculations/parseTimestamp");

const {
  timeframeToMilliseconds,
} = require("../calculations/timeframeToMilliseconds");

const analyzeCandleIntervals = async ({
  filePath,
  sourceTimeframe,
}) => {
  const timeframeMs =
    timeframeToMilliseconds(sourceTimeframe);

  return new Promise((resolve, reject) => {
    let previousTimestamp = null;

    let duplicateCount = 0;
    let gapCount = 0;
    let missingIntervalCount = 0;
    let outOfOrderCount = 0;

    const duplicates = [];
    const gaps = [];

    const parser = parse({
      columns: (headers) =>
        headers.map((header) =>
          header.trim().toLowerCase()
        ),
      trim: true,
      skip_empty_lines: true,
    });

    parser.on("readable", () => {
      let row;

      while ((row = parser.read()) !== null) {
        const timestamp = parseTimestamp(
          row.timestamp
        );

        if (timestamp === null) {
          continue;
        }

        if (previousTimestamp === null) {
          previousTimestamp = timestamp;
          continue;
        }

        const delta =
          timestamp - previousTimestamp;

        if (delta === 0) {
          duplicateCount += 1;

          duplicates.push({
            timestamp: new Date(
              timestamp
            ).toISOString(),
          });
        } else if (delta < 0) {
          outOfOrderCount += 1;
        } else if (delta > timeframeMs) {
          const missingIntervals =
            Math.floor(delta / timeframeMs) - 1;

          gapCount += 1;
          missingIntervalCount +=
            missingIntervals;

          gaps.push({
            after: new Date(
              previousTimestamp
            ).toISOString(),

            before: new Date(
              timestamp
            ).toISOString(),

            missingIntervals,
          });
        }

        previousTimestamp = timestamp;
      }
    });

    parser.on("error", reject);

    parser.on("end", () => {
      resolve({
        sourceTimeframe,
        expectedIntervalMs: timeframeMs,
        duplicateCount,
        gapCount,
        missingIntervalCount,
        outOfOrderCount,
        duplicates,
        gaps,
      });
    });

    fs.createReadStream(filePath).pipe(parser);
  });
};

module.exports = {
  analyzeCandleIntervals,
};