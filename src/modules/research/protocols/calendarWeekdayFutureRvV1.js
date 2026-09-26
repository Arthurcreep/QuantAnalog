const CALENDAR_WEEKDAY_FUTURE_RV_V1 = {
  id:
    "CALENDAR_WEEKDAY_FUTURE_RV",

  version:
    "1.0.0",

  feature: {
    name:
      "CALENDAR_WEEKDAY_UTC",

    kind:
      "CATEGORICAL",

    field:
      "calendarWeekdayUtc",

    categoryCount:
      7,
  },

  target: {
    name:
      "FUTURE_REALIZED_VOLATILITY",

    field:
      "futureRealizedVolatility",
  },

  modelTimeframe:
    "1h",

  incompletePolicy:
    "DROP_INCOMPLETE",

  horizons: [
    {
      label: "1h",
      bars: 1,
    },
    {
      label: "4h",
      bars: 4,
    },
    {
      label: "6h",
      bars: 6,
    },
    {
      label: "12h",
      bars: 12,
    },
    {
      label: "24h",
      bars: 24,
    },
  ],

  development: {
    end:
      "2024-12-31T23:59:59.999Z",
  },

  retrospectiveValidation: {
    start:
      "2025-01-01T00:00:00.000Z",
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
        20260925,
    },
  },

  candidateSelection: {
    mode:
      "DEVELOPMENT_ONLY",
  },

  forwardOos: {
    status:
      "PENDING_FUTURE_DATA",
  },
};

module.exports = {
  CALENDAR_WEEKDAY_FUTURE_RV_V1,
};