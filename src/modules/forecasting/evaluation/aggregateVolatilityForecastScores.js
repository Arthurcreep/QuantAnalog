const median = (
  values
) => {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return null;
  }

  const sorted =
    [...values].sort(
      (a, b) =>
        a - b
    );

  const middle =
    Math.floor(
      sorted.length / 2
    );

  if (
    sorted.length % 2 ===
    1
  ) {
    return sorted[
      middle
    ];
  }

  return (
    sorted[
      middle - 1
    ] +
    sorted[
      middle
    ]
  ) / 2;
};

const mean = (
  values
) => {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return null;
  }

  return values.reduce(
    (sum, value) =>
      sum + value,
    0
  ) / values.length;
};

const aggregateVolatilityForecastScores =
  (
    scores
  ) => {
    if (
      !Array.isArray(
        scores
      )
    ) {
      throw new Error(
        "INVALID_FORECAST_SCORES"
      );
    }

    if (
      scores.length ===
      0
    ) {
      return {
        count:
          0,

        volatility: {
          mae:
            null,

          rmse:
            null,

          medianAbsoluteError:
            null,

          bias:
            null,
        },

        variance: {
          mae:
            null,

          rmse:
            null,

          bias:
            null,
        },

        qlike: {
          mean:
            null,

          median:
            null,
        },
      };
    }

    const volatilityErrors =
      scores.map(
        (item) =>
          item
            .volatility
            .error
      );

    const volatilityAbsoluteErrors =
      scores.map(
        (item) =>
          item
            .volatility
            .absoluteError
      );

    const volatilitySquaredErrors =
      scores.map(
        (item) =>
          item
            .volatility
            .squaredError
      );

    const varianceErrors =
      scores.map(
        (item) =>
          item
            .variance
            .error
      );

    const varianceAbsoluteErrors =
      scores.map(
        (item) =>
          item
            .variance
            .absoluteError
      );

    const varianceSquaredErrors =
      scores.map(
        (item) =>
          item
            .variance
            .squaredError
      );

    const qlikes =
      scores.map(
        (item) =>
          item.qlike
      );

    return {
      count:
        scores.length,

      volatility: {
        mae:
          mean(
            volatilityAbsoluteErrors
          ),

        rmse:
          Math.sqrt(
            mean(
              volatilitySquaredErrors
            )
          ),

        medianAbsoluteError:
          median(
            volatilityAbsoluteErrors
          ),

        bias:
          mean(
            volatilityErrors
          ),
      },

      variance: {
        mae:
          mean(
            varianceAbsoluteErrors
          ),

        rmse:
          Math.sqrt(
            mean(
              varianceSquaredErrors
            )
          ),

        bias:
          mean(
            varianceErrors
          ),
      },

      qlike: {
        mean:
          mean(
            qlikes
          ),

        median:
          median(
            qlikes
          ),
      },
    };
  };

module.exports = {
  aggregateVolatilityForecastScores,
};