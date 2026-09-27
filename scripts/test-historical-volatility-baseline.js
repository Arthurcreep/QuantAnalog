const assert = require(
  "assert"
);

const {
  MODEL_DEFINITION,
  forecastHistoricalVolatilityBaseline,
} = require(
  "../src/modules/forecasting/models/historicalVolatilityBaselineV1"
);

const ONE_HOUR_MS =
  60 * 60 * 1000;

const buildSeries = (
  values
) =>
  values.map(
    (
      logReturn,
      index
    ) => ({
      timestamp:
        new Date(
          Date.UTC(
            2026,
            0,
            1,
            index,
            0,
            0,
            0
          )
        ).toISOString(),

      logReturn,
    })
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
  const series =
    buildSeries([
      0.01,
      -0.02,
      0.03,
      -0.04,
    ]);

  /*
   * Sum of squares:
   *
   * 0.01² +
   * 0.02² +
   * 0.03² +
   * 0.04²
   *
   * = 0.003
   *
   * Per-bar variance:
   *
   * 0.003 / 4
   * = 0.00075
   */

  const oneBar =
    forecastHistoricalVolatilityBaseline({
      series,

      lookbackBars:
        4,

      horizonBars:
        1,

      expectedIntervalMs:
        ONE_HOUR_MS,
    });

  assert.strictEqual(
    oneBar.modelId,
    "HISTORICAL_VOLATILITY_BASELINE"
  );

  assert.strictEqual(
    oneBar.modelVersion,
    "1.0.0"
  );

  assert.strictEqual(
    oneBar.target,
    "FUTURE_REALIZED_VOLATILITY"
  );

  assert.strictEqual(
    oneBar.sample.returnCount,
    4
  );

  assertClose(
    oneBar
      .historical
      .realizedVariance,
    0.003
  );

  assertClose(
    oneBar
      .historical
      .variancePerBar,
    0.00075
  );

  assertClose(
    oneBar
      .prediction
      .varianceValue,
    0.00075
  );

  assertClose(
    oneBar
      .prediction
      .value,
    Math.sqrt(
      0.00075
    )
  );

  /*
   * Four-bar forecast:
   *
   * 0.00075 * 4
   * = 0.003
   */

  const fourBar =
    forecastHistoricalVolatilityBaseline({
      series,

      lookbackBars:
        4,

      horizonBars:
        4,

      expectedIntervalMs:
        ONE_HOUR_MS,
    });

  assertClose(
    fourBar
      .prediction
      .varianceValue,
    0.003
  );

  assertClose(
    fourBar
      .prediction
      .value,
    Math.sqrt(
      0.003
    )
  );

  /*
   * Only the latest lookbackBars
   * observations may enter the model.
   */

  const longerSeries =
    buildSeries([
      100,
      100,
      0.01,
      -0.02,
      0.03,
      -0.04,
    ]);

  const latestWindow =
    forecastHistoricalVolatilityBaseline({
      series:
        longerSeries,

      lookbackBars:
        4,

      horizonBars:
        1,

      expectedIntervalMs:
        ONE_HOUR_MS,
    });

  assertClose(
    latestWindow
      .historical
      .realizedVariance,
    0.003
  );

  /*
   * Insufficient history.
   */

  let insufficientBlocked =
    false;

  try {
    forecastHistoricalVolatilityBaseline({
      series:
        series.slice(
          0,
          3
        ),

      lookbackBars:
        4,

      horizonBars:
        1,

      expectedIntervalMs:
        ONE_HOUR_MS,
    });
  } catch (error) {
    insufficientBlocked =
      error.message ===
      "INSUFFICIENT_FORECAST_LOOKBACK";
  }

  assert.strictEqual(
    insufficientBlocked,
    true
  );

  /*
   * Lookback must be contiguous.
   */

  const gapSeries =
    buildSeries([
      0.01,
      -0.02,
      0.03,
      -0.04,
    ]);

  gapSeries[3] = {
    ...gapSeries[3],

    timestamp:
      new Date(
        Date.parse(
          gapSeries[3]
            .timestamp
        ) +
        ONE_HOUR_MS
      ).toISOString(),
  };

  let gapBlocked =
    false;

  try {
    forecastHistoricalVolatilityBaseline({
      series:
        gapSeries,

      lookbackBars:
        4,

      horizonBars:
        1,

      expectedIntervalMs:
        ONE_HOUR_MS,
    });
  } catch (error) {
    gapBlocked =
      error.message ===
      "FORECAST_LOOKBACK_HAS_GAP";
  }

  assert.strictEqual(
    gapBlocked,
    true
  );

  console.log(
    "Historical volatility baseline test passed."
  );

  console.log({
    model:
      MODEL_DEFINITION,

    oneBar: {
      forecastVariance:
        oneBar
          .prediction
          .varianceValue,

      forecastVolatility:
        oneBar
          .prediction
          .value,
    },

    fourBar: {
      forecastVariance:
        fourBar
          .prediction
          .varianceValue,

      forecastVolatility:
        fourBar
          .prediction
          .value,
    },

    insufficientBlocked,

    gapBlocked,
  });
};

run();