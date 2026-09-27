const GARCH_NORMAL_V1 =
  Object.freeze({
    id:
      "GARCH_NORMAL_V1",

    version:
      "1.0.0",

    status:
      "FROZEN",

    modelId:
      "GARCH_NORMAL",

    modelVersion:
      "1.0.0",

    target:
      "FUTURE_REALIZED_VOLATILITY",

    modelTimeframe:
      "1h",

    horizonBars:
      1,

    trainingWindowBars:
      2160,

    refitEveryForecasts:
      24,

    meanModel:
      "ZERO",

    distribution:
      "GAUSSIAN_QMLE",

    varianceEquation:
      "h_t = omega + alpha * r_t_minus_1_squared + beta * h_t_minus_1",

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
  });

module.exports = {
  GARCH_NORMAL_V1,
};