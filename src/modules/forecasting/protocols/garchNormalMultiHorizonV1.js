const GARCH_NORMAL_MULTI_HORIZON_V1 =
  Object.freeze({
    id:
      "GARCH_NORMAL_MULTI_HORIZON_V1",

    version:
      "1.1.0",

    status:
      "FROZEN",

    modelId:
      "GARCH_NORMAL",

    modelVersion:
      "1.1.0",

    target:
      "FUTURE_REALIZED_VOLATILITY",

    modelTimeframe:
      "1h",

    supportedHorizons: [
      "1h",
      "6h",
      "1d",
      "3d",
      "5d",
    ],

    supportedHorizonBars: [
      1,
      6,
      24,
      72,
      120,
    ],

    trainingWindowBars:
      2160,

    refitEveryForecasts:
      24,

    meanModel:
      "ZERO",

    distribution:
      "GAUSSIAN_QMLE",

    oneStepVarianceEquation:
      "h_t = omega + alpha * r_t_minus_1_squared + beta * h_t_minus_1",

    multiStepVarianceEquation:
      "h_t_plus_k = omega + (alpha + beta) * h_t_plus_k_minus_1",

    aggregation:
      "SUM_CONDITIONAL_VARIANCES_THEN_SQRT",

    targetSemantics:
      "SQRT_SUM_FUTURE_SQUARED_LOG_RETURNS",

    predictionInterval: {
      enabled:
        true,

      confidenceLevel:
        0.95,

      method:
        "SATTERTHWAITE_WEIGHTED_CHI_SQUARE",

      distribution:
        "GAUSSIAN_INNOVATIONS",

      target:
        "FUTURE_REALIZED_VOLATILITY",

      varianceSemantics:
        "SUM_FUTURE_SQUARED_LOG_RETURNS",
    },

    constraints: {
      omega:
        "POSITIVE",

      alpha:
        "NON_NEGATIVE",

      beta:
        "NON_NEGATIVE",

      persistenceMaximum:
        0.999,
    },

    initialization: {
      conditionalVariance:
        "TRAINING_MEAN_SQUARED_RETURN",

      alpha:
        0.05,

      beta:
        0.9,

      longRunVariance:
        "TRAINING_MEAN_SQUARED_RETURN",
    },

    optimization: {
      method:
        "NELDER_MEAD",

      returnsScale:
        100,

      maxIterations:
        300,

      tolerance:
        1e-8,

      initialStep: [
        0.2,
        0.2,
        0.2,
      ],
    },

    informationAvailability:
      "CANDLE_CLOSE_EQUALS_CANDLE_TIMESTAMP_PLUS_TIMEFRAME",

    issuePolicy:
      "CLOSED_BARS_ONLY",
  });

module.exports = {
  GARCH_NORMAL_MULTI_HORIZON_V1,
};