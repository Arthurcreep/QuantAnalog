const CALENDAR_HOUR_VOLATILITY_V1 = {
  id:
    "CALENDAR_HOUR_FUTURE_RV",

  version:
    "1.0.0",

  feature:
    "CALENDAR_HOUR_UTC",

  target:
    "FUTURE_REALIZED_VOLATILITY",

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

  forwardOosStatus:
    "PENDING_FUTURE_DATA",
};

module.exports = {
  CALENDAR_HOUR_VOLATILITY_V1,
};