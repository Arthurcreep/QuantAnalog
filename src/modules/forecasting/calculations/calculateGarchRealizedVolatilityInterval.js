const {
  jStat,
} = require(
  "jstat"
);

const DEFAULT_CONFIDENCE_LEVEL =
  0.95;

const validatePositiveFinite = ({
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
    numeric <= 0
  ) {
    throw new Error(
      `INVALID_${field}`
    );
  }

  return numeric;
};

const validateParameters = (
  parameters
) => {
  if (
    !parameters ||
    !Number.isFinite(
      parameters.omega
    ) ||
    !Number.isFinite(
      parameters.alpha
    ) ||
    !Number.isFinite(
      parameters.beta
    )
  ) {
    throw new Error(
      "INVALID_GARCH_INTERVAL_PARAMETERS"
    );
  }

  if (
    parameters.omega < 0 ||
    parameters.alpha < 0 ||
    parameters.beta < 0
  ) {
    throw new Error(
      "INVALID_GARCH_INTERVAL_PARAMETER_DOMAIN"
    );
  }

  const persistence =
    parameters.alpha +
    parameters.beta;

  if (
    !Number.isFinite(
      persistence
    ) ||
    persistence >= 1
  ) {
    throw new Error(
      "INVALID_GARCH_INTERVAL_PERSISTENCE"
    );
  }

  return {
    omega:
      parameters.omega,

    alpha:
      parameters.alpha,

    beta:
      parameters.beta,

    persistence,
  };
};

const buildExpectedVariancePath = ({
  oneStepVariance,
  parameters,
  horizonBars,
}) => {
  const firstVariance =
    validatePositiveFinite({
      value:
        oneStepVariance,

      field:
        "GARCH_INTERVAL_ONE_STEP_VARIANCE",
    });

  if (
    !Number.isInteger(
      horizonBars
    ) ||
    horizonBars <= 0
  ) {
    throw new Error(
      "INVALID_GARCH_INTERVAL_HORIZON"
    );
  }

  const validatedParameters =
    validateParameters(
      parameters
    );

  const path =
    [];

  let variance =
    firstVariance;

  for (
    let step = 0;
    step <
      horizonBars;
    step += 1
  ) {
    path.push(
      variance
    );

    variance =
      validatedParameters
        .omega +
      validatedParameters
        .persistence *
        variance;

    if (
      !Number.isFinite(
        variance
      ) ||
      variance <= 0
    ) {
      throw new Error(
        "INVALID_GARCH_INTERVAL_VARIANCE_PATH"
      );
    }
  }

  return path;
};

const calculateGarchRealizedVolatilityInterval =
  ({
    oneStepVariance,
    parameters,
    horizonBars,
    confidenceLevel =
      DEFAULT_CONFIDENCE_LEVEL,
  }) => {
    if (
      !Number.isFinite(
        confidenceLevel
      ) ||
      confidenceLevel <= 0 ||
      confidenceLevel >= 1
    ) {
      throw new Error(
        "INVALID_GARCH_INTERVAL_CONFIDENCE_LEVEL"
      );
    }

    const variancePath =
      buildExpectedVariancePath({
        oneStepVariance,

        parameters,

        horizonBars,
      });

    let expectedRealizedVariance =
      0;

    let varianceWeightSquares =
      0;

    for (
      const variance of
        variancePath
    ) {
      expectedRealizedVariance +=
        variance;

      varianceWeightSquares +=
        variance ** 2;
    }

    if (
      expectedRealizedVariance <=
        0 ||
      varianceWeightSquares <=
        0
    ) {
      throw new Error(
        "INVALID_GARCH_INTERVAL_MOMENTS"
      );
    }

    /*
     * Weighted chi-square approximation:
     *
     * X = Σ h_i * Z_i²
     *
     * E[X] =
     * Σ h_i
     *
     * Var[X] =
     * 2 Σ h_i²
     *
     * Approx:
     *
     * X ≈ scale * χ²(df)
     *
     * df =
     * (Σ h_i)² /
     * Σ h_i²
     *
     * scale =
     * Σ h_i² /
     * Σ h_i
     */

    const degreesOfFreedom =
      expectedRealizedVariance ** 2 /
      varianceWeightSquares;

    const scale =
      varianceWeightSquares /
      expectedRealizedVariance;

    const alpha =
      1 -
      confidenceLevel;

    const lowerProbability =
      alpha /
      2;

    const upperProbability =
      1 -
      alpha /
        2;

    const lowerChiSquare =
      jStat.chisquare.inv(
        lowerProbability,
        degreesOfFreedom
      );

    const upperChiSquare =
      jStat.chisquare.inv(
        upperProbability,
        degreesOfFreedom
      );

    if (
      !Number.isFinite(
        lowerChiSquare
      ) ||
      !Number.isFinite(
        upperChiSquare
      )
    ) {
      throw new Error(
        "GARCH_INTERVAL_QUANTILE_FAILED"
      );
    }

    const lowerVariance =
      Math.max(
        scale *
          lowerChiSquare,
        0
      );

    const upperVariance =
      Math.max(
        scale *
          upperChiSquare,
        0
      );

    const pointVolatility =
      Math.sqrt(
        expectedRealizedVariance
      );

    return {
      method:
        "SATTERTHWAITE_WEIGHTED_CHI_SQUARE",

      distribution:
        "GAUSSIAN_INNOVATIONS",

      confidenceLevel,

      horizonBars,

      point: {
        volatility:
          pointVolatility,

        variance:
          expectedRealizedVariance,
      },

      interval: {
        volatility: {
          lower:
            Math.sqrt(
              lowerVariance
            ),

          upper:
            Math.sqrt(
              upperVariance
            ),
        },

        variance: {
          lower:
            lowerVariance,

          upper:
            upperVariance,
        },
      },

      approximation: {
        degreesOfFreedom,

        scale,

        varianceOfRealizedVariance:
          2 *
          varianceWeightSquares,

        assumption:
          "EXPECTED_GARCH_VARIANCE_PATH_FIXED",
      },
    };
  };

module.exports = {
  DEFAULT_CONFIDENCE_LEVEL,
  buildExpectedVariancePath,
  calculateGarchRealizedVolatilityInterval,
};