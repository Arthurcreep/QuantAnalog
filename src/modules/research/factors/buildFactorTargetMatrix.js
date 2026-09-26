const {
  buildCalendarVolatilityMatrix,
} = require(
  "../matrix/buildCalendarVolatilityMatrix"
);

const CALENDAR_FEATURES =
  new Set([
    "CALENDAR_HOUR_UTC",
    "CALENDAR_WEEKDAY_UTC",
    "CALENDAR_WEEKEND_UTC",
    "CALENDAR_MONTH_UTC",
  ]);

const buildFactorTargetMatrix =
  ({
    returnSeries,
    protocol,
    horizonBars,
    expectedIntervalMs,
  }) => {
    const featureName =
      protocol
        .feature
        .name;

    const targetName =
      protocol
        .target
        .name;

    if (
      CALENDAR_FEATURES.has(
        featureName
      ) &&
      targetName ===
        "FUTURE_REALIZED_VOLATILITY"
    ) {
      return buildCalendarVolatilityMatrix({
        returnSeries,

        horizonBars,

        expectedIntervalMs,
      });
    }

    throw new Error(
      `UNSUPPORTED_FACTOR_TARGET_PAIR: ${featureName} -> ${targetName}`
    );
  };

module.exports = {
  buildFactorTargetMatrix,
};