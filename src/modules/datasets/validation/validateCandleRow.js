const parseNumericValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
};

const validateCandleRow = (row) => {
  const open = parseNumericValue(row.open);
  const high = parseNumericValue(row.high);
  const low = parseNumericValue(row.low);
  const close = parseNumericValue(row.close);
  const volume = parseNumericValue(row.volume);

  const issues = [];

  const prices = {
    open,
    high,
    low,
    close,
  };

  Object.entries(prices).forEach(([field, value]) => {
    if (value === null) {
      issues.push({
        type: "INVALID_NUMERIC_VALUE",
        field,
      });

      return;
    }

    if (value <= 0) {
      issues.push({
        type: "NON_POSITIVE_PRICE",
        field,
        value,
      });
    }
  });

  if (volume === null) {
    issues.push({
      type: "INVALID_NUMERIC_VALUE",
      field: "volume",
    });
  } else if (volume < 0) {
    issues.push({
      type: "NEGATIVE_VOLUME",
      value: volume,
    });
  }

  const pricesValid =
    open !== null &&
    high !== null &&
    low !== null &&
    close !== null &&
    open > 0 &&
    high > 0 &&
    low > 0 &&
    close > 0;

  if (pricesValid) {
    if (high < Math.max(open, close, low)) {
      issues.push({
        type: "INVALID_HIGH",
        value: high,
      });
    }

    if (low > Math.min(open, close, high)) {
      issues.push({
        type: "INVALID_LOW",
        value: low,
      });
    }
  }

  return {
    status: issues.length === 0
      ? "VALID"
      : "INVALID",

    zeroVolume:
      volume !== null && volume === 0,

    issues,
  };
};

module.exports = {
  validateCandleRow,
};