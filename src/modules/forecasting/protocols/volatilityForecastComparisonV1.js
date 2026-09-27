const VOLATILITY_FORECAST_COMPARISON_V1 =
  Object.freeze({
    id:
      "VOLATILITY_FORECAST_COMPARISON",

    version:
      "1.0.0",

    lossDifferential:
      "BASELINE_MINUS_CANDIDATE",

    interpretation:
      "POSITIVE_MEANS_CANDIDATE_LOWER_LOSS",

    losses: [
      "ABSOLUTE_ERROR",
      "SQUARED_ERROR",
      "QLIKE",
    ],

    hac: {
      method:
        "NEWEY_WEST_MEAN",

      lag:
        24,
    },

    bootstrap: {
      method:
        "MOVING_BLOCK_MEAN",

      blockSizeBars:
        168,

      iterations:
        2000,

      seed:
        20261002,

      confidenceLevel:
        0.95,
    },

    evidenceUse: {
      garchNormalV1:
        "SUPPLEMENTARY_POST_RESULT_DIAGNOSTIC",

      futurePreRegisteredModels:
        "ELIGIBLE_FOR_PRE_REGISTERED_MODEL_COMPARISON",
    },
  });

module.exports = {
  VOLATILITY_FORECAST_COMPARISON_V1,
};