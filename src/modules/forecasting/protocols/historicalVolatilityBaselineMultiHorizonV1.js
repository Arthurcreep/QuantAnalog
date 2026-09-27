const HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1 =
  Object.freeze({
    id:
      "HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1",

    version:
      "1.1.0",

    status:
      "FROZEN",

    modelId:
      "HISTORICAL_VOLATILITY_BASELINE",

    modelVersion:
      "1.0.0",

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

    lookbackBars:
      168,

    estimator:
      "MEAN_PAST_SQUARED_RETURN_SCALED_TO_HORIZON",

    aggregation:
      "SQRT_HORIZON_TIMES_MEAN_PAST_SQUARED_RETURN",

    targetSemantics:
      "SQRT_SUM_FUTURE_SQUARED_LOG_RETURNS",

    informationAvailability:
      "CANDLE_CLOSE_EQUALS_CANDLE_TIMESTAMP_PLUS_TIMEFRAME",

    issuePolicy:
      "CLOSED_BARS_ONLY",

    forecastIdentity:
      "SOURCE_ANALYSIS_RUN_AWARE_V1",
  });

module.exports = {
  HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1,
};