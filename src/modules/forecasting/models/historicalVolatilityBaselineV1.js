const {
  calculateRealizedVolatility,
} = require(
  "../../research/calculations/calculateRealizedVolatility"
);

const MODEL_DEFINITION =
  Object.freeze({
    id:
      "HISTORICAL_VOLATILITY_BASELINE",

    version:
      "1.0.0",

    status:
      "FROZEN",

    target:
      "FUTURE_REALIZED_VOLATILITY",

    estimator:
      "MEAN_PAST_SQUARED_RETURN_SCALED_TO_HORIZON",

    output:
      "REALIZED_VOLATILITY",

    formula:
      "sqrt(horizonBars * mean(pastSquaredReturns))",
  });

const validatePositiveInteger = ({
  value,
  field,
}) => {
  if (
    !Number.isInteger(
      value
    ) ||
    value <= 0
  ) {
    throw new Error(
      `INVALID_${field}`
    );
  }
};

const validateExpectedInterval = (
  expectedIntervalMs
) => {
  if (
    !Number.isFinite(
      expectedIntervalMs
    ) ||
    expectedIntervalMs <= 0
  ) {
    throw new Error(
      "INVALID_EXPECTED_INTERVAL"
    );
  }
};

const validateContiguousWindow = ({
  window,
  expectedIntervalMs,
}) => {
  for (
    let index = 1;
    index < window.length;
    index += 1
  ) {
    const previousTime =
      new Date(
        window[
          index - 1
        ].timestamp
      ).getTime();

    const currentTime =
      new Date(
        window[index]
          .timestamp
      ).getTime();

    if (
      !Number.isFinite(
        previousTime
      ) ||
      !Number.isFinite(
        currentTime
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_RETURN_TIMESTAMP"
      );
    }

    if (
      currentTime -
        previousTime !==
      expectedIntervalMs
    ) {
      throw new Error(
        "FORECAST_LOOKBACK_HAS_GAP"
      );
    }
  }
};

const forecastHistoricalVolatilityBaseline =
  ({
    series,
    lookbackBars,
    horizonBars,
    expectedIntervalMs,
  }) => {
    if (
      !Array.isArray(
        series
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_RETURN_SERIES"
      );
    }

    validatePositiveInteger({
      value:
        lookbackBars,

      field:
        "FORECAST_LOOKBACK_BARS",
    });

    validatePositiveInteger({
      value:
        horizonBars,

      field:
        "FORECAST_HORIZON_BARS",
    });

    validateExpectedInterval(
      expectedIntervalMs
    );

    if (
      series.length <
      lookbackBars
    ) {
      throw new Error(
        "INSUFFICIENT_FORECAST_LOOKBACK"
      );
    }

    const window =
      series.slice(
        -lookbackBars
      );

    validateContiguousWindow({
      window,
      expectedIntervalMs,
    });

    const returns =
      window.map(
        (row) => {
          const value =
            Number(
              row.logReturn
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            throw new Error(
              "INVALID_FORECAST_RETURN_VALUE"
            );
          }

          return value;
        }
      );

    const historical =
      calculateRealizedVolatility(
        returns
      );

    if (!historical) {
      throw new Error(
        "FORECAST_VOLATILITY_CALCULATION_FAILED"
      );
    }

    const variancePerBar =
      historical
        .realizedVariance /
      lookbackBars;

    const forecastVariance =
      variancePerBar *
      horizonBars;

    const forecastVolatility =
      Math.sqrt(
        Math.max(
          forecastVariance,
          0
        )
      );

    return {
      modelId:
        MODEL_DEFINITION.id,

      modelVersion:
        MODEL_DEFINITION.version,

      target:
        MODEL_DEFINITION.target,

      lookbackBars,

      horizonBars,

      sample: {
        firstTimestamp:
          window[0]
            .timestamp,

        lastTimestamp:
          window[
            window.length - 1
          ].timestamp,

        returnCount:
          window.length,
      },

      historical: {
        realizedVariance:
          historical
            .realizedVariance,

        realizedVolatility:
          historical
            .realizedVolatility,

        variancePerBar,
      },

      prediction: {
        type:
          "POINT",

        value:
          forecastVolatility,

        varianceValue:
          forecastVariance,

        unit:
          "REALIZED_VOLATILITY",
      },
    };
  };

module.exports = {
  MODEL_DEFINITION,
  forecastHistoricalVolatilityBaseline,
};