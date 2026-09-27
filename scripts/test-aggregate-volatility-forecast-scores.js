const assert = require(
  "assert"
);

const {
  calculateVolatilityForecastScores,
} = require(
  "../src/modules/forecasting/evaluation/calculateVolatilityForecastScores"
);

const {
  aggregateVolatilityForecastScores,
} = require(
  "../src/modules/forecasting/evaluation/aggregateVolatilityForecastScores"
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
    `Expected ${actual} to be close to ${expected}`
  );
};

const run = () => {
  const scores = [
    calculateVolatilityForecastScores({
      forecastVolatility:
        0.02,

      actualVolatility:
        0.01,

      forecastVariance:
        0.0004,

      actualVariance:
        0.0001,
    }),

    calculateVolatilityForecastScores({
      forecastVolatility:
        0.02,

      actualVolatility:
        0.03,

      forecastVariance:
        0.0004,

      actualVariance:
        0.0009,
    }),

    calculateVolatilityForecastScores({
      forecastVolatility:
        0.02,

      actualVolatility:
        0.02,

      forecastVariance:
        0.0004,

      actualVariance:
        0.0004,
    }),
  ];

  const aggregate =
    aggregateVolatilityForecastScores(
      scores
    );

  assert.strictEqual(
    aggregate.count,
    3
  );

  assertClose(
    aggregate
      .volatility
      .mae,
    (
      0.01 +
      0.01 +
      0
    ) / 3
  );

  assertClose(
    aggregate
      .volatility
      .rmse,
    Math.sqrt(
      (
        0.0001 +
        0.0001 +
        0
      ) / 3
    )
  );

  assertClose(
    aggregate
      .volatility
      .medianAbsoluteError,
    0.01
  );

  assertClose(
    aggregate
      .volatility
      .bias,
    0
  );

  assert.ok(
    Number.isFinite(
      aggregate
        .qlike
        .mean
    )
  );

  const empty =
    aggregateVolatilityForecastScores(
      []
    );

  assert.strictEqual(
    empty.count,
    0
  );

  assert.strictEqual(
    empty
      .volatility
      .mae,
    null
  );

  console.log(
    "Aggregate volatility forecast scores test passed."
  );

  console.log(
    aggregate
  );
};

run();