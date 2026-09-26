const {
  validateCandleCsvSchema,
} = require("./validateCandleCsvSchema");

const {
  validateCandleTimestamps,
} = require("./validateCandleTimestamps");

const {
  analyzeCandleIntervals,
} = require("./analyzeCandleIntervals");

const {
  validateCandleDomain,
} = require("./validateCandleDomain");

const validateCandleDataset = async ({
  filePath,
  sourceTimeframe,
}) => {
  const schema = await validateCandleCsvSchema(filePath);

  if (!schema.valid) {
    return {
      valid: false,
      blockedBy: "SCHEMA",
      schema,
      timestamps: null,
      intervals: null,
      domain: null,
    };
  }

  const [
    timestamps,
    intervals,
    domain,
  ] = await Promise.all([
    validateCandleTimestamps({
      filePath,
      sourceTimeframe,
    }),

    analyzeCandleIntervals({
      filePath,
      sourceTimeframe,
    }),

    validateCandleDomain(filePath),
  ]);

  const valid =
    timestamps.valid &&
    domain.valid;

  return {
    valid,
    blockedBy: valid
      ? null
      : "DATA_VALIDATION",

    schema,
    timestamps,
    intervals,
    domain,
  };
};

module.exports = {
  validateCandleDataset,
};