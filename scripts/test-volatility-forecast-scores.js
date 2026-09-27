const assert = require(
  "assert"
);

const {
  DEFAULT_VARIANCE_FLOOR,
  calculateVolatilityForecastScores,
} = require(
  "../src/modules/forecasting/evaluation/calculateVolatilityForecastScores"
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
    ) <=
      tolerance,
    `Expected ${actual} to be close to ${expected}`
  );
};

const run = () => {
  /*
   * Perfect forecast.
   *
   * QLIKE ratio = 1
   *
   * 1 - log(1) - 1 = 0
   */

  const perfect =
    calculateVolatilityForecastScores({
      forecastVolatility:
        0.02,

      actualVolatility:
        0.02,

      forecastVariance:
        0.0004,

      actualVariance:
        0.0004,
    });

  assertClose(
    perfect
      .volatility
      .absoluteError,
    0
  );

  assertClose(
    perfect
      .volatility
      .squaredError,
    0
  );

  assertClose(
    perfect.qlike,
    0
  );

  /*
   * Simple known example.
   */

  const scored =
    calculateVolatilityForecastScores({
      forecastVolatility:
        0.02,

      actualVolatility:
        0.01,

      forecastVariance:
        0.0004,

      actualVariance:
        0.0001,
    });

  assertClose(
    scored
      .volatility
      .error,
    -0.01
  );

  assertClose(
    scored
      .volatility
      .absoluteError,
    0.01
  );

  assertClose(
    scored
      .volatility
      .squaredError,
    0.0001
  );

  assertClose(
    scored
      .variance
      .ratio,
    0.25
  );

  assertClose(
    scored.qlike,
    0.25 -
      Math.log(
        0.25
      ) -
      1
  );

  /*
   * Zero actual variance must not
   * generate NaN/Infinity.
   */

  const zeroActual =
    calculateVolatilityForecastScores({
      forecastVolatility:
        0.01,

      actualVolatility:
        0,

      forecastVariance:
        0.0001,

      actualVariance:
        0,
    });

  assert.ok(
    Number.isFinite(
      zeroActual.qlike
    )
  );

  assert.strictEqual(
    zeroActual
      .variance
      .floor,
    DEFAULT_VARIANCE_FLOOR
  );

  /*
   * Zero forecast variance must also
   * remain numerically defined.
   */

  const zeroForecast =
    calculateVolatilityForecastScores({
      forecastVolatility:
        0,

      actualVolatility:
        0.01,

      forecastVariance:
        0,

      actualVariance:
        0.0001,
    });

  assert.ok(
    Number.isFinite(
      zeroForecast.qlike
    )
  );

  /*
   * Invalid negative variance.
   */

  let negativeVarianceBlocked =
    false;

  try {
    calculateVolatilityForecastScores({
      forecastVolatility:
        0.01,

      actualVolatility:
        0.01,

      forecastVariance:
        -1,

      actualVariance:
        0.0001,
    });
  } catch (error) {
    negativeVarianceBlocked =
      error.message ===
      "INVALID_FORECAST_VARIANCE";
  }

  assert.strictEqual(
    negativeVarianceBlocked,
    true
  );

  console.log(
    "Volatility forecast scores test passed."
  );

  console.log({
    perfect: {
      absoluteError:
        perfect
          .volatility
          .absoluteError,

      squaredError:
        perfect
          .volatility
          .squaredError,

      qlike:
        perfect.qlike,
    },

    scored: {
      absoluteError:
        scored
          .volatility
          .absoluteError,

      squaredError:
        scored
          .volatility
          .squaredError,

      varianceRatio:
        scored
          .variance
          .ratio,

      qlike:
        scored.qlike,
    },

    zeroActualQlike:
      zeroActual.qlike,

    zeroForecastQlike:
      zeroForecast.qlike,

    negativeVarianceBlocked,
  });
};

run();