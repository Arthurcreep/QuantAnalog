const { createAppError } = require("../../../errors/appError");

const validateSeriesContinuity = ({ series, expectedIntervalMs }) => {
  if (!Array.isArray(series) || !Number.isSafeInteger(expectedIntervalMs) || expectedIntervalMs <= 0) {
    throw createAppError({ statusCode: 400, code: "INVALID_SERIES_INTERVAL", message: "A series and a positive expected interval are required" });
  }
  let previous = null;
  for (const row of series) {
    const timestamp = Date.parse(row.timestamp);
    if (!Number.isFinite(timestamp)) {
      throw createAppError({ statusCode: 400, code: "INVALID_SERIES_TIMESTAMP", message: "Invalid time-series timestamp" });
    }
    if (previous !== null && timestamp - previous !== expectedIntervalMs) {
      throw createAppError({ statusCode: 400, code: "NON_CONTIGUOUS_DIAGNOSTIC_SERIES", message: "Diagnostics require a continuous series; select a continuous dataset interval" });
    }
    previous = timestamp;
  }
};

module.exports = { validateSeriesContinuity };
