const ARCH_NORMAL_MODEL_V1_0 =
  Object.freeze({
    id:
      "ARCH_NORMAL",

    version:
      "1.0.0",

    family:
      "ARCH",

    order: {
      arch:
        1,
    },

    target:
      "FUTURE_REALIZED_VOLATILITY",

    meanModel:
      "ZERO",

    distribution:
      "GAUSSIAN_QMLE",

    varianceEquation:
      "h_t = omega + alpha * r_t_minus_1_squared",

    parameters: [
      "omega",
      "alpha",
    ],

    constraints: {
      omega:
        "POSITIVE",

      alpha:
        "NON_NEGATIVE",

      persistenceMaximum:
        0.999,
    },

    output: {
      variance:
        "CONDITIONAL_VARIANCE",

      volatility:
        "SQRT_CONDITIONAL_VARIANCE",
    },
  });

module.exports = {
  ARCH_NORMAL_MODEL_V1_0,
};