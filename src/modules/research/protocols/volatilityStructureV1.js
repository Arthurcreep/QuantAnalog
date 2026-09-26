const VOLATILITY_STRUCTURE_V1 = {
  id: "VOLATILITY_STRUCTURE",
  version: "1.0.0",

  targetPhenomenon:
    "CONDITIONAL_VOLATILITY",

  incompletePolicy:
    "DROP_INCOMPLETE",

  maxAcfLag: 40,

  diagnosticLags: [
    10,
    20,
    40,
  ],

  displayedAcfLags: [
    1,
    2,
    3,
    6,
    12,
    24,
    40,
  ],

  development: {
    end:
      "2024-12-31T23:59:59.999Z",
  },

  retrospectiveValidation: {
    start:
      "2025-01-01T00:00:00.000Z",
  },

  hypothesis: {
    primary:
      "Squared returns exhibit persistent serial dependence",

    secondary:
      "Absolute and squared returns exhibit stronger serial dependence than raw returns",
  },

  forwardOosStatus:
    "PENDING_FUTURE_DATA",
};

module.exports = {
  VOLATILITY_STRUCTURE_V1,
};