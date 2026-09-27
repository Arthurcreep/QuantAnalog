const {
  minimizeNelderMead,
} = require(
  "../optimization/minimizeNelderMead"
);

const {
  GARCH_NORMAL_V1,
} = require(
  "../protocols/garchNormalV1"
);

const TWO_PI =
  2 * Math.PI;

const VARIANCE_FLOOR =
  1e-12;

const clamp = (
  value,
  minimum,
  maximum
) =>
  Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );

const safeExp = (
  value
) =>
  Math.exp(
    clamp(
      value,
      -40,
      40
    )
  );

const meanSquared = (
  values
) => {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    throw new Error(
      "INVALID_GARCH_RETURNS"
    );
  }

  let total =
    0;

  for (
    const value of
    values
  ) {
    if (
      !Number.isFinite(
        value
      )
    ) {
      throw new Error(
        "INVALID_GARCH_RETURN_VALUE"
      );
    }

    total +=
      value ** 2;
  }

  return total /
    values.length;
};

const transformThetaToParameters =
  ({
    theta,
    persistenceMaximum,
  }) => {
    if (
      !Array.isArray(
        theta
      ) ||
      theta.length !==
        3
    ) {
      throw new Error(
        "INVALID_GARCH_THETA"
      );
    }

    const longRunVariance =
      safeExp(
        theta[0]
      );

    const alphaWeight =
      safeExp(
        theta[1]
      );

    const betaWeight =
      safeExp(
        theta[2]
      );

    const denominator =
      1 +
      alphaWeight +
      betaWeight;

    const alpha =
      persistenceMaximum *
      alphaWeight /
      denominator;

    const beta =
      persistenceMaximum *
      betaWeight /
      denominator;

    const persistence =
      alpha +
      beta;

    const omega =
      (
        1 -
        persistence
      ) *
      longRunVariance;

    return {
      omega,

      alpha,

      beta,

      persistence,

      longRunVariance,
    };
  };

const buildInitialTheta = ({
  sampleVariance,
  persistenceMaximum,
  initialAlpha,
  initialBeta,
}) => {
  if (
    !Number.isFinite(
      sampleVariance
    ) ||
    sampleVariance <= 0
  ) {
    throw new Error(
      "INVALID_GARCH_SAMPLE_VARIANCE"
    );
  }

  const remainder =
    persistenceMaximum -
    initialAlpha -
    initialBeta;

  if (
    remainder <= 0
  ) {
    throw new Error(
      "INVALID_GARCH_INITIAL_PERSISTENCE"
    );
  }

  return [
    Math.log(
      sampleVariance
    ),

    Math.log(
      initialAlpha /
      remainder
    ),

    Math.log(
      initialBeta /
      remainder
    ),
  ];
};

const calculateGaussianNegativeLogLikelihood =
  ({
    squaredReturns,
    parameters,
    initialVariance,
  }) => {
    if (
      !Array.isArray(
        squaredReturns
      ) ||
      squaredReturns.length ===
        0
    ) {
      throw new Error(
        "INVALID_GARCH_SQUARED_RETURNS"
      );
    }

    let variance =
      Math.max(
        initialVariance,
        VARIANCE_FLOOR
      );

    let negativeLogLikelihood =
      0;

    for (
      let index = 0;
      index <
        squaredReturns.length;
      index += 1
    ) {
      if (
        index > 0
      ) {
        variance =
          parameters.omega +
          parameters.alpha *
            squaredReturns[
              index - 1
            ] +
          parameters.beta *
            variance;

        variance =
          Math.max(
            variance,
            VARIANCE_FLOOR
          );
      }

      negativeLogLikelihood +=
        0.5 *
        (
          Math.log(
            TWO_PI
          ) +
          Math.log(
            variance
          ) +
          squaredReturns[
            index
          ] /
            variance
        );
    }

    return {
      negativeLogLikelihood,

      lastConditionalVariance:
        variance,
    };
  };

const fitGarchNormalV1 = ({
  series,
}) => {
  if (
    !Array.isArray(
      series
    ) ||
    series.length <
      10
  ) {
    throw new Error(
      "INSUFFICIENT_GARCH_TRAINING_DATA"
    );
  }

  const returnsScale =
    GARCH_NORMAL_V1
      .optimization
      .returnsScale;

  const returns =
    series.map(
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
            "INVALID_GARCH_RETURN_VALUE"
          );
        }

        return value *
          returnsScale;
      }
    );

  const squaredReturns =
    returns.map(
      (value) =>
        value ** 2
    );

  const sampleVariance =
    meanSquared(
      returns
    );

  if (
    sampleVariance <= 0
  ) {
    throw new Error(
      "ZERO_GARCH_TRAINING_VARIANCE"
    );
  }

  const protocolConstraints =
    GARCH_NORMAL_V1
      .constraints;

  const protocolInitialization =
    GARCH_NORMAL_V1
      .initialization;

  const initialTheta =
    buildInitialTheta({
      sampleVariance,

      persistenceMaximum:
        protocolConstraints
          .persistenceMaximum,

      initialAlpha:
        protocolInitialization
          .alpha,

      initialBeta:
        protocolInitialization
          .beta,
    });

  const objective = (
    theta
  ) => {
    const parameters =
      transformThetaToParameters({
        theta,

        persistenceMaximum:
          protocolConstraints
            .persistenceMaximum,
      });

    return calculateGaussianNegativeLogLikelihood({
      squaredReturns,

      parameters,

      initialVariance:
        sampleVariance,
    })
      .negativeLogLikelihood;
  };

  const initialNegativeLogLikelihood =
    objective(
      initialTheta
    );

  const optimization =
    minimizeNelderMead({
      objective,

      initialPoint:
        initialTheta,

      initialStep:
        GARCH_NORMAL_V1
          .optimization
          .initialStep,

      maxIterations:
        GARCH_NORMAL_V1
          .optimization
          .maxIterations,

      tolerance:
        GARCH_NORMAL_V1
          .optimization
          .tolerance,
    });

  const parametersScaled =
    transformThetaToParameters({
      theta:
        optimization.point,

      persistenceMaximum:
        protocolConstraints
          .persistenceMaximum,
    });

  const fittedState =
    calculateGaussianNegativeLogLikelihood({
      squaredReturns,

      parameters:
        parametersScaled,

      initialVariance:
        sampleVariance,
    });

  const lastSquaredReturn =
    squaredReturns[
      squaredReturns.length - 1
    ];

  const nextVarianceScaled =
    parametersScaled.omega +
    parametersScaled.alpha *
      lastSquaredReturn +
    parametersScaled.beta *
      fittedState
        .lastConditionalVariance;

  const scaleSquared =
    returnsScale ** 2;

  const omega =
    parametersScaled.omega /
    scaleSquared;

  const longRunVariance =
    parametersScaled
      .longRunVariance /
    scaleSquared;

  const initialVariance =
    sampleVariance /
    scaleSquared;

  const lastConditionalVariance =
    fittedState
      .lastConditionalVariance /
    scaleSquared;

  const nextVariance =
    Math.max(
      nextVarianceScaled /
        scaleSquared,
      0
    );

  return {
    modelId:
      GARCH_NORMAL_V1
        .modelId,

    modelVersion:
      GARCH_NORMAL_V1
        .modelVersion,

    protocolId:
      GARCH_NORMAL_V1.id,

    protocolVersion:
      GARCH_NORMAL_V1
        .version,

    sample: {
      returnCount:
        returns.length,

      firstTimestamp:
        series[0]
          .timestamp,

      lastTimestamp:
        series[
          series.length - 1
        ].timestamp,
    },

    parameters: {
      omega,

      alpha:
        parametersScaled
          .alpha,

      beta:
        parametersScaled
          .beta,

      persistence:
        parametersScaled
          .persistence,

      longRunVariance,
    },

    state: {
      initialVariance,

      lastConditionalVariance,
    },

    optimization: {
      method:
        GARCH_NORMAL_V1
          .optimization
          .method,

      iterations:
        optimization
          .iterations,

      converged:
        optimization
          .converged,

      initialNegativeLogLikelihood,

      negativeLogLikelihood:
        optimization.value,

      improvement:
        initialNegativeLogLikelihood -
        optimization.value,
    },

    prediction: {
      type:
        "POINT",

      value:
        Math.sqrt(
          nextVariance
        ),

      varianceValue:
        nextVariance,

      unit:
        "REALIZED_VOLATILITY",
    },
  };
};

const forecastNextGarchVariance = ({
  previousForecastVariance,
  observedReturn,
  parameters,
}) => {
  const previousVariance =
    Number(
      previousForecastVariance
    );

  const returnValue =
    Number(
      observedReturn
    );

  if (
    !Number.isFinite(
      previousVariance
    ) ||
    previousVariance < 0
  ) {
    throw new Error(
      "INVALID_GARCH_PREVIOUS_VARIANCE"
    );
  }

  if (
    !Number.isFinite(
      returnValue
    )
  ) {
    throw new Error(
      "INVALID_GARCH_OBSERVED_RETURN"
    );
  }

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
      "INVALID_GARCH_PARAMETERS"
    );
  }

  const variance =
    parameters.omega +
    parameters.alpha *
      returnValue ** 2 +
    parameters.beta *
      previousVariance;

  if (
    !Number.isFinite(
      variance
    ) ||
    variance < 0
  ) {
    throw new Error(
      "INVALID_GARCH_FORECAST_VARIANCE"
    );
  }

  return {
    type:
      "POINT",

    value:
      Math.sqrt(
        variance
      ),

    varianceValue:
      variance,

    unit:
      "REALIZED_VOLATILITY",
  };
};

module.exports = {
  VARIANCE_FLOOR,
  transformThetaToParameters,
  calculateGaussianNegativeLogLikelihood,
  fitGarchNormalV1,
  forecastNextGarchVariance,
};