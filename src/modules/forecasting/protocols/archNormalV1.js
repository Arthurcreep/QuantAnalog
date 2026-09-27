const ARCH_NORMAL_V1 =
  Object.freeze({
    id:
      "ARCH_NORMAL_V1",

    version:
      "1.0.0",

    status:
      "FROZEN",

    modelId:
      "ARCH_NORMAL",

    modelVersion:
      "1.0.0",

    target:
      "FUTURE_REALIZED_VOLATILITY",

    modelTimeframe:
      "1h",

    order: {
      arch:
        1,
    },

    meanModel:
      "ZERO",

    distribution:
      "GAUSSIAN_QMLE",

    varianceEquation:
      "h_t = omega + alpha * r_t_minus_1_squared",

    constraints: {
      omega:
        "POSITIVE",

      alpha:
        "NON_NEGATIVE",

      persistenceMaximum:
        0.999,
    },

    initialization: {
      alpha:
        0.1,

      longRunVariance:
        "TRAINING_MEAN_SQUARED_RETURN",

      conditionalVariance:
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
      ],
    },
  });

module.exports = {
  ARCH_NORMAL_V1,
};