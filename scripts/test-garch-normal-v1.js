const assert = require(
  "assert"
);

const {
  GARCH_NORMAL_V1,
} = require(
  "../src/modules/forecasting/protocols/garchNormalV1"
);

const {
  fitGarchNormalV1,
  forecastNextGarchVariance,
} = require(
  "../src/modules/forecasting/models/garchNormalV1"
);

const ONE_HOUR_MS =
  60 * 60 * 1000;

const createRandom = (
  seed
) => {
  let state =
    seed >>> 0;

  return () => {
    state =
      (
        1664525 *
          state +
        1013904223
      ) >>> 0;

    return state /
      4294967296;
  };
};

const createNormalRandom = (
  random
) => {
  let spare =
    null;

  return () => {
    if (
      spare !== null
    ) {
      const value =
        spare;

      spare =
        null;

      return value;
    }

    let first =
      0;

    let second =
      0;

    while (
      first <=
      Number.EPSILON
    ) {
      first =
        random();
    }

    second =
      random();

    const radius =
      Math.sqrt(
        -2 *
        Math.log(
          first
        )
      );

    const angle =
      2 *
      Math.PI *
      second;

    spare =
      radius *
      Math.sin(
        angle
      );

    return radius *
      Math.cos(
        angle
      );
  };
};

const buildSyntheticGarchSeries = ({
  count,
  omega,
  alpha,
  beta,
  seed,
}) => {
  const random =
    createRandom(
      seed
    );

  const normal =
    createNormalRandom(
      random
    );

  const unconditionalVariance =
    omega /
    (
      1 -
      alpha -
      beta
    );

  let variance =
    unconditionalVariance;

  let previousReturn =
    0;

  const series =
    [];

  for (
    let index = 0;
    index <
      count;
    index += 1
  ) {
    if (
      index > 0
    ) {
      variance =
        omega +
        alpha *
          previousReturn ** 2 +
        beta *
          variance;
    }

    const logReturn =
      Math.sqrt(
        variance
      ) *
      normal();

    series.push({
      timestamp:
        new Date(
          Date.UTC(
            2025,
            0,
            1
          ) +
          index *
            ONE_HOUR_MS
        ).toISOString(),

      logReturn,
    });

    previousReturn =
      logReturn;
  }

  return series;
};

const assertClose = (
  first,
  second,
  tolerance
) => {
  assert.ok(
    Math.abs(
      first -
      second
    ) <= tolerance,
    `${first} not within ${tolerance} of ${second}`
  );
};

const run = () => {
  const trueParameters = {
    alpha:
      0.08,

    beta:
      0.9,

    longRunVariance:
      0.0001,
  };

  const omega =
    (
      1 -
      trueParameters.alpha -
      trueParameters.beta
    ) *
    trueParameters
      .longRunVariance;

  const series =
    buildSyntheticGarchSeries({
      count:
        5000,

      omega,

      alpha:
        trueParameters.alpha,

      beta:
        trueParameters.beta,

      seed:
        20260926,
    });

  const first =
    fitGarchNormalV1({
      series,
    });

  const second =
    fitGarchNormalV1({
      series,
    });

  assert.strictEqual(
    first.modelId,
    "GARCH_NORMAL"
  );

  assert.strictEqual(
    first.protocolId,
    "GARCH_NORMAL_V1"
  );

  assert.ok(
    first
      .parameters
      .omega >
      0
  );

  assert.ok(
    first
      .parameters
      .alpha >=
      0
  );

  assert.ok(
    first
      .parameters
      .beta >=
      0
  );

  assert.ok(
    first
      .parameters
      .persistence <
      0.999
  );

  assert.ok(
    first
      .optimization
      .negativeLogLikelihood <=
      first
        .optimization
        .initialNegativeLogLikelihood
  );

  assert.ok(
    Number.isFinite(
      first
        .prediction
        .varianceValue
    )
  );

  assert.ok(
    first
      .prediction
      .varianceValue >
      0
  );

  assert.ok(
    Number.isFinite(
      first
        .prediction
        .value
    )
  );

  /*
   * The test is intentionally broad.
   * We are testing estimator sanity,
   * not demanding exact recovery from
   * one finite random sample.
   */

  assertClose(
    first
      .parameters
      .alpha,
    trueParameters.alpha,
    0.06
  );

  assertClose(
    first
      .parameters
      .beta,
    trueParameters.beta,
    0.08
  );

  assertClose(
    first
      .parameters
      .persistence,
    trueParameters.alpha +
      trueParameters.beta,
    0.06
  );

  /*
   * Determinism.
   */

  assertClose(
    first
      .parameters
      .omega,
    second
      .parameters
      .omega,
    1e-15
  );

  assertClose(
    first
      .parameters
      .alpha,
    second
      .parameters
      .alpha,
    1e-12
  );

  assertClose(
    first
      .parameters
      .beta,
    second
      .parameters
      .beta,
    1e-12
  );

  assertClose(
    first
      .prediction
      .varianceValue,
    second
      .prediction
      .varianceValue,
    1e-15
  );

  const recursive =
    forecastNextGarchVariance({
      previousForecastVariance:
        first
          .prediction
          .varianceValue,

      observedReturn:
        0.01,

      parameters:
        first.parameters,
    });

  assert.ok(
    recursive
      .varianceValue >
      0
  );

  assertClose(
    recursive
      .varianceValue,
    first
        .parameters
        .omega +
      first
        .parameters
        .alpha *
        0.01 ** 2 +
      first
        .parameters
        .beta *
        first
          .prediction
          .varianceValue,
    1e-15
  );

  console.log(
    "GARCH Normal V1 test passed."
  );

  console.log({
    protocol:
      `${GARCH_NORMAL_V1.id}@${GARCH_NORMAL_V1.version}`,

    sample:
      first.sample.returnCount,

    trueParameters: {
      omega,

      alpha:
        trueParameters.alpha,

      beta:
        trueParameters.beta,

      persistence:
        trueParameters.alpha +
        trueParameters.beta,

      longRunVariance:
        trueParameters
          .longRunVariance,
    },

    fittedParameters:
      first.parameters,

    optimization:
      first.optimization,

    nextForecast: {
      variance:
        first
          .prediction
          .varianceValue,

      volatility:
        first
          .prediction
          .value,
    },

    recursiveForecast:
      recursive,
  });
};

run();