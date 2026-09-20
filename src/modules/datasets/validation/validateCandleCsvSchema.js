const fs = require("fs");
const { parse } = require("csv-parse");

const REQUIRED_FIELDS = [
  "timestamp",
  "open",
  "high",
  "low",
  "close",
  "volume",
];

const validateCandleCsvSchema = async (filePath) => {
  return new Promise((resolve, reject) => {
    let detectedFields = [];
    let rowCount = 0;

    const parser = parse({
      columns: (headers) => {
        detectedFields = headers.map((header) =>
          header.trim().toLowerCase()
        );

        return detectedFields;
      },

      trim: true,
      skip_empty_lines: true,
    });

    parser.on("readable", () => {
      let row;

      while ((row = parser.read()) !== null) {
        rowCount += 1;
      }
    });

    parser.on("error", (error) => {
      reject(error);
    });

    parser.on("end", () => {
      const missingFields = REQUIRED_FIELDS.filter(
        (field) => !detectedFields.includes(field)
      );

      resolve({
        valid: missingFields.length === 0,
        requiredFields: REQUIRED_FIELDS,
        detectedFields,
        missingFields,
        rowCount,
      });
    });

    fs.createReadStream(filePath).pipe(parser);
  });
};

module.exports = {
  validateCandleCsvSchema,
};