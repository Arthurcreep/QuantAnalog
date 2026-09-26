const fs = require("fs");
const { parse } = require("csv-parse");

const {
  validateCandleRow,
} = require("./validateCandleRow");

const validateCandleDomain = async (filePath) => {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    let validCount = 0;
    let invalidCount = 0;
    let zeroVolumeCount = 0;

    const issues = [];

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
        rowCount += 1;

        const result = validateCandleRow(row);

        if (result.status === "VALID") {
          validCount += 1;
        } else {
          invalidCount += 1;
        }

        if (result.zeroVolume) {
          zeroVolumeCount += 1;
        }

        if (
          result.issues.length > 0 &&
          issues.length < 50
        ) {
          issues.push({
            row: rowCount,
            issues: result.issues,
          });
        }
      }
    });

    parser.on("error", reject);

    parser.on("end", () => {
      resolve({
        valid: invalidCount === 0,
        rowCount,
        validCount,
        invalidCount,
        zeroVolumeCount,
        issues,
      });
    });

    fs.createReadStream(filePath).pipe(parser);
  });
};

module.exports = {
  validateCandleDomain,
};