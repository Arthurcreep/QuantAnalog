const VOLATILITY_ROBUSTNESS_V1 = {
  id:
    "VOLATILITY_ROBUSTNESS",

  version:
    "1.0.0",

  parentProtocol: {
    id:
      "VOLATILITY_STRUCTURE",

    version:
      "1.0.0",
  },

  grouping:
    "CALENDAR_YEAR_UTC",

  incompletePolicy:
    "DROP_INCOMPLETE",

  acfLag:
    1,

  archLmLags:
    10,

  minimumSampleSize:
    100,
};

module.exports = {
  VOLATILITY_ROBUSTNESS_V1,
};