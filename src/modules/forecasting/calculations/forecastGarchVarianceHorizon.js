const {
  calculateGarchRealizedVolatilityInterval,
} = require(
  "./calculateGarchRealizedVolatilityInterval"
);

const DEFAULT_INTERVAL_CONFIDENCE_LEVEL =
  0.95;

const validateFiniteNumber = (
  value,
  errorCode
) => {
  if (
    !Number.isFinite(
      value
    )
  ) {
    throw new Error(
      errorCode
    );
  }
};

const forecastGarchVarianceHorizon =
  ({
    oneStepVariance,
    omega,
    alpha,
    beta,
    horizonBars,
    intervalConfidenceLevel =
      DEFAULT_INTERVAL_CONFIDENCE_LEVEL,
  }) => {
    validateFiniteNumber(
      oneStepVariance,
      "INVALID_GARCH_ONE_STEP_VARIANCE"
    );

    validateFiniteNumber(
      omega,
      "INVALID_GARCH_OMEGA"
    );

    validateFiniteNumber(
      alpha,
      "INVALID_GARCH_ALPHA"
    );

    validateFiniteNumber(
      beta,
      "INVALID_GARCH_BETA"
    );

    if (
      oneStepVariance <= 0
    ) {
      throw new Error(
        "GARCH_ONE_STEP_VARIANCE_MUST_BE_POSITIVE"
      );
    }

    if (
      omega <= 0
    ) {
      throw new Error(
        "GARCH_OMEGA_MUST_BE_POSITIVE"
      );
    }

    if (
      alpha < 0
    ) {
      throw new Error(
        "GARCH_ALPHA_MUST_BE_NON_NEGATIVE"
      );
    }

    if (
      beta < 0
    ) {
      throw new Error(
        "GARCH_BETA_MUST_BE_NON_NEGATIVE"
      );
    }

    if (
      !Number.isInteger(
        horizonBars
      ) ||
      horizonBars <= 0
    ) {
      throw new Error(
        "INVALID_GARCH_HORIZON_BARS"
      );
    }

    if (
      !Number.isFinite(
        intervalConfidenceLevel
      ) ||
      intervalConfidenceLevel <= 0 ||
      intervalConfidenceLevel >= 1
    ) {
      throw new Error(
        "INVALID_GARCH_INTERVAL_CONFIDENCE_LEVEL"
      );
    }

    const persistence =
      alpha +
      beta;

    if (
      persistence >= 1
    ) {
      throw new Error(
        "NON_STATIONARY_GARCH_PARAMETERS"
      );
    }

    const stepVariances =
      new Array(
        horizonBars
      );

    let currentVariance =
      oneStepVariance;

    let cumulativeVariance =
      0;

    for (
      let step = 0;
      step <
        horizonBars;
      step += 1
    ) {
      if (
        !Number.isFinite(
          currentVariance
        ) ||
        currentVariance <= 0
      ) {
        throw new Error(
          "INVALID_GARCH_FORECAST_VARIANCE"
        );
      }

      stepVariances[
        step
      ] =
        currentVariance;

      cumulativeVariance +=
        currentVariance;

      currentVariance =
        omega +
        persistence *
          currentVariance;
    }

    if (
      !Number.isFinite(
        cumulativeVariance
      ) ||
      cumulativeVariance <= 0
    ) {
      throw new Error(
        "INVALID_GARCH_CUMULATIVE_VARIANCE"
      );
    }

    const intervalResult =
      calculateGarchRealizedVolatilityInterval({
        oneStepVariance,

        parameters: {
          omega,
          alpha,
          beta,
        },

        horizonBars,

        confidenceLevel:
          intervalConfidenceLevel,
      });

    const intervalVarianceDifference =
      Math.abs(
        intervalResult
          .point
          .variance -
          cumulativeVariance
      );

    const intervalVarianceTolerance =
      Math.max(
        1e-15,
        cumulativeVariance *
          1e-12
      );

    if (
      intervalVarianceDifference >
      intervalVarianceTolerance
    ) {
      throw new Error(
        "GARCH_POINT_INTERVAL_VARIANCE_MISMATCH"
      );
    }

    const forecastVolatility =
      Math.sqrt(
        cumulativeVariance
      );

    return {
      horizonBars,

      persistence,

      oneStepVariance,

      stepVariances,

      cumulativeVariance,

      forecastVolatility,

      interval: {
        method:
          intervalResult
            .method,

        distribution:
          intervalResult
            .distribution,

        confidenceLevel:
          intervalResult
            .confidenceLevel,

        volatility: {
          lower:
            intervalResult
              .interval
              .volatility
              .lower,

          upper:
            intervalResult
              .interval
              .volatility
              .upper,
        },

        variance: {
          lower:
            intervalResult
              .interval
              .variance
              .lower,

          upper:
            intervalResult
              .interval
              .variance
              .upper,
        },

        approximation: {
          degreesOfFreedom:
            intervalResult
              .approximation
              .degreesOfFreedom,

          scale:
            intervalResult
              .approximation
              .scale,
        },
      },

      prediction: {
        type:
          "POINT",

        value:
          forecastVolatility,

        varianceValue:
          cumulativeVariance,

        unit:
          "REALIZED_VOLATILITY",

        interval: {
          method:
            intervalResult
              .method,

          confidenceLevel:
            intervalResult
              .confidenceLevel,

          lower:
            intervalResult
              .interval
              .volatility
              .lower,

          upper:
            intervalResult
              .interval
              .volatility
              .upper,

          varianceLower:
            intervalResult
              .interval
              .variance
              .lower,

          varianceUpper:
            intervalResult
              .interval
              .variance
              .upper,
        },
      },
    };
  };

module.exports = {
  DEFAULT_INTERVAL_CONFIDENCE_LEVEL,
  forecastGarchVarianceHorizon,
};