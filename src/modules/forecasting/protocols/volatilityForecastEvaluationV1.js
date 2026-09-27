const VOLATILITY_FORECAST_EVALUATION_V1 =
  Object.freeze({
    id:
      "VOLATILITY_FORECAST_EVALUATION",

    version:
      "1.0.0",

    status:
      "FROZEN",

    target:
      "FUTURE_REALIZED_VOLATILITY",

    metrics: [
      "VOLATILITY_ERROR",
      "VOLATILITY_ABSOLUTE_ERROR",
      "VOLATILITY_SQUARED_ERROR",
      "VARIANCE_ERROR",
      "VARIANCE_ABSOLUTE_ERROR",
      "VARIANCE_SQUARED_ERROR",
      "QLIKE",
    ],

    qlike: {
      varianceFloor:
        1e-12,

      formula:
        "actualVariance / forecastVariance - log(actualVariance / forecastVariance) - 1",
    },
  });

module.exports = {
  VOLATILITY_FORECAST_EVALUATION_V1,
};