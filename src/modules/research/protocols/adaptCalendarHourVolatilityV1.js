const {
  CALENDAR_HOUR_VOLATILITY_V1,
} = require(
  "./calendarHourVolatilityV1"
);

const adaptCalendarHourVolatilityV1 =
  () => ({
    id:
      CALENDAR_HOUR_VOLATILITY_V1
        .id,

    version:
      CALENDAR_HOUR_VOLATILITY_V1
        .version,

    feature: {
      name:
        CALENDAR_HOUR_VOLATILITY_V1
          .feature,

      kind:
        "CATEGORICAL",

      field:
        "calendarHourUtc",

      categoryCount:
        24,
    },

    target: {
      name:
        CALENDAR_HOUR_VOLATILITY_V1
          .target,

      field:
        "futureRealizedVolatility",
    },

    modelTimeframe:
      CALENDAR_HOUR_VOLATILITY_V1
        .modelTimeframe,

    incompletePolicy:
      CALENDAR_HOUR_VOLATILITY_V1
        .incompletePolicy,

    horizons:
      CALENDAR_HOUR_VOLATILITY_V1
        .horizons
        .map(
          (horizon) => ({
            ...horizon,
          })
        ),

    development: {
      ...CALENDAR_HOUR_VOLATILITY_V1
        .development,
    },

    retrospectiveValidation: {
      ...CALENDAR_HOUR_VOLATILITY_V1
        .retrospectiveValidation,
    },

    statistics: {
      hacLagFloor:
        24,

      multipleTesting: {
        method:
          "BENJAMINI_HOCHBERG",
      },

      bootstrap: {
        blockSizeBars:
          168,

        iterations:
          2000,

        seed:
          20260921,
      },
    },

    candidateSelection: {
      mode:
        "DEVELOPMENT_ONLY",
    },

    forwardOos: {
      status:
        CALENDAR_HOUR_VOLATILITY_V1
          .forwardOosStatus,
    },
  });

module.exports = {
  adaptCalendarHourVolatilityV1,
};