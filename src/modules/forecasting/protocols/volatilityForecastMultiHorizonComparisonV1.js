const VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1 =
  Object.freeze({
    id:
      "VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON",

    version:
      "1.0.0",

    status:
      "FROZEN",

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

      lagRule:
        "MAX_24_OR_HORIZON_MINUS_ONE",

      minimumLag:
        24,
    },

    bootstrap: {
      method:
        "MOVING_BLOCK_MEAN",

      blockSizeRule:
        "MAX_168_OR_HORIZON",

      minimumBlockSizeBars:
        168,

      iterations:
        2000,

      seed:
        20261006,

      confidenceLevel:
        0.95,
    },

    overlapPolicy:
      "OVERLAPPING_FORECAST_TARGETS_ALLOWED_WITH_HORIZON_AWARE_DEPENDENCE_ADJUSTMENT",

    evidenceUse:
      "PRE_REGISTERED_MULTI_HORIZON_FORECAST_COMPARISON",
  });

const resolveMultiHorizonComparisonConfig =
  ({
    horizonBars,
  }) => {
    if (
      !Number.isInteger(
        horizonBars
      ) ||
      horizonBars <= 0
    ) {
      throw new Error(
        "INVALID_COMPARISON_HORIZON_BARS"
      );
    }

    return {
      hacLag:
        Math.max(
          VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1
            .hac
            .minimumLag,

          horizonBars -
            1
        ),

      blockSize:
        Math.max(
          VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1
            .bootstrap
            .minimumBlockSizeBars,

          horizonBars
        ),

      iterations:
        VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1
          .bootstrap
          .iterations,

      seed:
        VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1
          .bootstrap
          .seed,

      confidenceLevel:
        VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1
          .bootstrap
          .confidenceLevel,
    };
  };

module.exports = {
  VOLATILITY_FORECAST_MULTI_HORIZON_COMPARISON_V1,
  resolveMultiHorizonComparisonConfig,
};