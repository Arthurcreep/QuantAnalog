const {
  minimizeNelderMead,
} = require(
  "../optimization/minimizeNelderMead"
);

const {
  calculateGaussianNegativeLogLikelihood,
} = require(
  "./garchNormalV1"
);

const {
  ARCH_NORMAL_V1,
} = require(
  "../protocols/archNormalV1"
);

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
    !Array.isArray(
      values
    ) ||
    values.length === 0
  ) {
    throw new Error(
      "INVALID_ARCH_RETURNS"
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
        "INVALID_ARCH_RETURN_VALUE"
      );
    }

    total +=
      value ** 2;
  }

  return total /
    values.length;
};

const transformThetaToArchParameters =
  ({
    theta,
    persistenceMaximum,
  }) => {
    if (
      !Array.isArray(
        theta
      ) ||
      theta.length !==
        2
    ) {
      throw new Error(
        "INVALID_ARCH_THETA"
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

    const alpha =
      persistenceMaximum *
      alphaWeight /
      (
        1 +
        alphaWeight
      );

    const omega =
      (
        1 -
        alpha
      ) *
      longRunVariance;

    return {
      omega,

      alpha,

      beta:
        0,

      persistence:
        alpha,

      longRunVariance,
    };
  };

const buildInitialTheta = ({
  sampleVariance,
  persistenceMaximum,
  initialAlpha,
}) => {
  if (
    !Number.isFinite(
      sampleVariance
    ) ||
    sampleVariance <= 0
  ) {
    throw new Error(
      "INVALID_ARCH_SAMPLE_VARIANCE"
    );
  }

  if (
    !Number.isFinite(
      initialAlpha
    ) ||
    initialAlpha <= 0 ||
    initialAlpha >=
      persistenceMaximum
  ) {
    throw new Error(
      "INVALID_ARCH_INITIAL_ALPHA"
    );
  }

  const alphaWeight =
    initialAlpha /
    (
      persistenceMaximum -
      initialAlpha
    );

  return [
    Math.log(
      sampleVariance
    ),

    Math.log(
      alphaWeight
    ),
  ];
};

const fitArchNormalV1 = ({
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
      "INSUFFICIENT_ARCH_TRAINING_DATA"
    );
  }

  const returnsScale =
    ARCH_NORMAL_V1
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
            "INVALID_ARCH_RETURN_VALUE"
          );
        }

        return (
          value *
          returnsScale
        );
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
      "ZERO_ARCH_TRAINING_VARIANCE"
    );
  }

  const persistenceMaximum =
    ARCH_NORMAL_V1
      .constraints
      .persistenceMaximum;

  const initialTheta =
    buildInitialTheta({
      sampleVariance,

      persistenceMaximum,

      initialAlpha:
        ARCH_NORMAL_V1
          .initialization
          .alpha,
    });

  const objective = (
    theta
  ) => {
    const parameters =
      transformThetaToArchParameters({
        theta,

        persistenceMaximum,
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
        ARCH_NORMAL_V1
          .optimization
          .initialStep,

      maxIterations:
        ARCH_NORMAL_V1
          .optimization
          .maxIterations,

      tolerance:
        ARCH_NORMAL_V1
          .optimization
          .tolerance,
    });

  const parametersScaled =
    transformThetaToArchParameters({
      theta:
        optimization.point,

      persistenceMaximum,
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
      squaredReturns.length -
      1
    ];

  const nextVarianceScaled =
    parametersScaled
      .omega +
    parametersScaled
      .alpha *
      lastSquaredReturn;

  const scaleSquared =
    returnsScale ** 2;

  const parameters = {
    omega:
      parametersScaled
        .omega /
      scaleSquared,

    alpha:
      parametersScaled
        .alpha,

    beta:
      0,

    persistence:
      parametersScaled
        .alpha,

    longRunVariance:
      parametersScaled
        .longRunVariance /
      scaleSquared,
  };

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
      ARCH_NORMAL_V1
        .modelId,

    modelVersion:
      ARCH_NORMAL_V1
        .modelVersion,

    protocolId:
      ARCH_NORMAL_V1.id,

    protocolVersion:
      ARCH_NORMAL_V1
        .version,

    sample: {
      returnCount:
        returns.length,

      firstTimestamp:
        series[0]
          .timestamp,

      lastTimestamp:
        series[
          series.length -
          1
        ].timestamp,
    },

    parameters,

    state: {
      initialVariance,

      lastConditionalVariance,
    },

    optimization: {
      method:
        ARCH_NORMAL_V1
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

const forecastNextArchVariance = ({
  observedReturn,
  parameters,
}) => {
  const returnValue =
    Number(
      observedReturn
    );

  if (
    !Number.isFinite(
      returnValue
    )
  ) {
    throw new Error(
      "INVALID_ARCH_OBSERVED_RETURN"
    );
  }

  if (
    !parameters ||
    !Number.isFinite(
      parameters.omega
    ) ||
    !Number.isFinite(
      parameters.alpha
    )
  ) {
    throw new Error(
      "INVALID_ARCH_PARAMETERS"
    );
  }

  const variance =
    parameters.omega +
    parameters.alpha *
      returnValue ** 2;

  if (
    !Number.isFinite(
      variance
    ) ||
    variance < 0
  ) {
    throw new Error(
      "INVALID_ARCH_FORECAST_VARIANCE"
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
  transformThetaToArchParameters,
  fitArchNormalV1,
  forecastNextArchVariance,
};