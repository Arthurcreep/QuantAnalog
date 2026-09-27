const DEFAULT_VARIANCE_FLOOR =
  1e-12;

const validateFiniteNonNegative = ({
  value,
  field,
}) => {
  const numeric =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numeric
    ) ||
    numeric < 0
  ) {
    throw new Error(
      `INVALID_${field}`
    );
  }

  return numeric;
};

const calculateVolatilityForecastScores =
  ({
    forecastVolatility,
    actualVolatility,
    forecastVariance,
    actualVariance,
    varianceFloor =
      DEFAULT_VARIANCE_FLOOR,
  }) => {
    const forecastVol =
      validateFiniteNonNegative({
        value:
          forecastVolatility,

        field:
          "FORECAST_VOLATILITY",
      });

    const actualVol =
      validateFiniteNonNegative({
        value:
          actualVolatility,

        field:
          "ACTUAL_VOLATILITY",
      });

    const forecastVar =
      validateFiniteNonNegative({
        value:
          forecastVariance,

        field:
          "FORECAST_VARIANCE",
      });

    const actualVar =
      validateFiniteNonNegative({
        value:
          actualVariance,

        field:
          "ACTUAL_VARIANCE",
      });

    if (
      !Number.isFinite(
        varianceFloor
      ) ||
      varianceFloor <= 0
    ) {
      throw new Error(
        "INVALID_VARIANCE_FLOOR"
      );
    }

    const volatilityError =
      actualVol -
      forecastVol;

    const varianceError =
      actualVar -
      forecastVar;

    const absoluteError =
      Math.abs(
        volatilityError
      );

    const squaredError =
      volatilityError ** 2;

    const absoluteVarianceError =
      Math.abs(
        varianceError
      );

    const squaredVarianceError =
      varianceError ** 2;

    /*
     * QLIKE is evaluated on variance.
     *
     * ratio =
     * actualVariance /
     * forecastVariance
     *
     * Loss:
     *
     * ratio - log(ratio) - 1
     *
     * A fixed floor protects the metric
     * from zero realized/forecast
     * variance while keeping the scoring
     * rule deterministic.
     */

    const safeForecastVariance =
      Math.max(
        forecastVar,
        varianceFloor
      );

    const safeActualVariance =
      Math.max(
        actualVar,
        varianceFloor
      );

    const varianceRatio =
      safeActualVariance /
      safeForecastVariance;

    const qlike =
      varianceRatio -
      Math.log(
        varianceRatio
      ) -
      1;

    return {
      volatility: {
        forecast:
          forecastVol,

        actual:
          actualVol,

        error:
          volatilityError,

        absoluteError,

        squaredError,
      },

      variance: {
        forecast:
          forecastVar,

        actual:
          actualVar,

        error:
          varianceError,

        absoluteError:
          absoluteVarianceError,

        squaredError:
          squaredVarianceError,

        ratio:
          varianceRatio,

        floor:
          varianceFloor,
      },

      qlike,
    };
  };

module.exports = {
  DEFAULT_VARIANCE_FLOOR,
  calculateVolatilityForecastScores,
};