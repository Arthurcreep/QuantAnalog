const assert = require(
  "assert"
);

const {
  forecastGarchVarianceHorizon,
} = require(
  "../src/modules/forecasting/calculations/forecastGarchVarianceHorizon"
);

const assertClose = (
  actual,
  expected,
  tolerance = 1e-12
) => {
  assert.ok(
    Math.abs(
      actual -
      expected
    ) <= tolerance,
    `${actual} not close to ${expected}`
  );
};

const run = () => {
  /*
   * Simple deterministic example.
   *
   * persistence = 0.5
   *
   * h1 = 0.040
   * h2 = 0.010 + 0.5 * 0.040 = 0.030
   * h3 = 0.010 + 0.5 * 0.030 = 0.025
   *
   * cumulative = 0.095
   */

  const threeStep =
    forecastGarchVarianceHorizon({
      oneStepVariance:
        0.04,

      omega:
        0.01,

      alpha:
        0.1,

      beta:
        0.4,

      horizonBars:
        3,
    });

  assert.strictEqual(
    threeStep.horizonBars,
    3
  );

  assertClose(
    threeStep.persistence,
    0.5
  );

  assertClose(
    threeStep
      .stepVariances[0],
    0.04
  );

  assertClose(
    threeStep
      .stepVariances[1],
    0.03
  );

  assertClose(
    threeStep
      .stepVariances[2],
    0.025
  );

  assertClose(
    threeStep
      .cumulativeVariance,
    0.095
  );

  assertClose(
    threeStep
      .forecastVolatility,
    Math.sqrt(
      0.095
    )
  );

  /*
   * H = 1 must reproduce
   * the existing one-step variance
   * exactly.
   */

  const oneStep =
    forecastGarchVarianceHorizon({
      oneStepVariance:
        0.000023,

      omega:
        0.000001,

      alpha:
        0.1,

      beta:
        0.8,

      horizonBars:
        1,
    });

  assertClose(
    oneStep
      .cumulativeVariance,
    0.000023
  );

  assertClose(
    oneStep
      .prediction
      .varianceValue,
    0.000023
  );

  assertClose(
    oneStep
      .prediction
      .value,
    Math.sqrt(
      0.000023
    )
  );

  /*
   * If h1 already equals
   * unconditional variance,
   * every future expected
   * variance stays equal.
   */

  const omega =
    0.000002;

  const alpha =
    0.08;

  const beta =
    0.9;

  const persistence =
    alpha +
    beta;

  const longRunVariance =
    omega /
    (
      1 -
      persistence
    );

  const oneDay =
    forecastGarchVarianceHorizon({
      oneStepVariance:
        longRunVariance,

      omega,

      alpha,

      beta,

      horizonBars:
        24,
    });

  assertClose(
    longRunVariance,
    0.0001
  );

  for (
    const variance of
      oneDay
        .stepVariances
  ) {
    assertClose(
      variance,
      longRunVariance
    );
  }

  assertClose(
    oneDay
      .cumulativeVariance,
    24 *
      longRunVariance
  );

  assertClose(
    oneDay
      .forecastVolatility,
    Math.sqrt(
      24 *
      longRunVariance
    )
  );

  /*
   * Invalid contracts.
   */

  assert.throws(
    () =>
      forecastGarchVarianceHorizon({
        oneStepVariance:
          0.01,

        omega:
          0.001,

        alpha:
          0.1,

        beta:
          0.8,

        horizonBars:
          0,
      }),
    /INVALID_GARCH_HORIZON_BARS/
  );

  assert.throws(
    () =>
      forecastGarchVarianceHorizon({
        oneStepVariance:
          0.01,

        omega:
          0.001,

        alpha:
          0.6,

        beta:
          0.4,

        horizonBars:
          24,
      }),
    /NON_STATIONARY_GARCH_PARAMETERS/
  );

  assert.throws(
    () =>
      forecastGarchVarianceHorizon({
        oneStepVariance:
          -0.01,

        omega:
          0.001,

        alpha:
          0.1,

        beta:
          0.8,

        horizonBars:
          24,
      }),
    /GARCH_ONE_STEP_VARIANCE_MUST_BE_POSITIVE/
  );

  console.log(
    "GARCH variance horizon test passed."
  );

  console.log({
    threeStep: {
      stepVariances:
        threeStep
          .stepVariances,

      cumulativeVariance:
        threeStep
          .cumulativeVariance,

      forecastVolatility:
        threeStep
          .forecastVolatility,
    },

    oneDaySteadyState: {
      horizonBars:
        oneDay
          .horizonBars,

      oneStepVariance:
        longRunVariance,

      cumulativeVariance:
        oneDay
          .cumulativeVariance,

      forecastVolatility:
        oneDay
          .forecastVolatility,
    },
  });
};

run();