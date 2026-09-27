const assert = require(
  "assert"
);

const {
  evaluateVolatilityForecastModel,
} = require(
  "../src/modules/forecasting/walkForward/evaluateVolatilityForecastModel"
);

const {
  evaluateGarchNormalMultiHorizonV1,
  MODEL_DEFINITION,
} = require(
  "../src/modules/forecasting/walkForward/evaluateGarchNormalMultiHorizonV1"
);

const {
  createGarchNormalMultiHorizonForecaster,
} = require(
  "../src/modules/forecasting/models/createGarchNormalMultiHorizonForecaster"
);

const {
  GARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../src/modules/forecasting/protocols/garchNormalMultiHorizonV1"
);

const ONE_HOUR_MS =
  60 * 60 * 1000;

const HORIZONS = [
  1,
  24,
  120,
];

const buildSeries = ({
  count,
}) =>
  Array.from(
    {
      length:
        count,
    },
    (
      _,
      index
    ) => ({
      timestamp:
        new Date(
          Date.UTC(
            2024,
            0,
            1
          ) +
          index *
            ONE_HOUR_MS
        ).toISOString(),

      logReturn:
        0.005 *
          Math.sin(
            index /
              11
          ) +
        0.002 *
          Math.cos(
            index /
              37
          ),
    })
  );

const assertClose = (
  actual,
  expected,
  tolerance = 1e-14
) => {
  assert.ok(
    Math.abs(
      actual -
      expected
    ) <= tolerance,
    `${actual} not close to ${expected}`
  );
};

const buildIndependentEvaluation = ({
  series,
  horizonBars,
  evaluationStartAt,
  evaluationEndAt,
}) => {
  const forecaster =
    createGarchNormalMultiHorizonForecaster();

  return evaluateVolatilityForecastModel({
    series,

    modelDefinition:
      MODEL_DEFINITION,

    modelConfig: {
      trainingWindowBars:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .trainingWindowBars,

      refitEveryForecasts:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .refitEveryForecasts,

      distribution:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .distribution,

      meanModel:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .meanModel,
    },

    historyWindowBars:
      GARCH_NORMAL_MULTI_HORIZON_V1
        .trainingWindowBars,

    horizonBars,

    expectedIntervalMs:
      ONE_HOUR_MS,

    evaluationStartAt,

    evaluationEndAt,

    forecastModel:
      forecaster.forecast,
  });
};

const compareRows = ({
  independent,
  singlePass,
  horizonBars,
}) => {
  assert.strictEqual(
    singlePass.rows.length,
    independent.rows.length,
    `ROW_COUNT_MISMATCH_H${horizonBars}`
  );

  for (
    let index = 0;
    index <
      independent.rows.length;
    index += 1
  ) {
    const expected =
      independent.rows[index];

    const actual =
      singlePass.rows[index];

    assert.strictEqual(
      actual.issuedAt,
      expected.issuedAt
    );

    assert.strictEqual(
      actual
        .targetStartTimestamp,
      expected
        .targetStartTimestamp
    );

    assert.strictEqual(
      actual
        .targetEndTimestamp,
      expected
        .targetEndTimestamp
    );

    assertClose(
      actual
        .forecastVariance,
      expected
        .forecastVariance
    );

    assertClose(
      actual
        .forecastVolatility,
      expected
        .forecastVolatility
    );

    assertClose(
      actual
        .actualVariance,
      expected
        .actualVariance
    );

    assertClose(
      actual.qlike,
      expected.qlike
    );
  }
};

const run = () => {
  const series =
    buildSeries({
      count:
        3000,
    });

  const evaluationStartAt =
    new Date(
      Date.UTC(
        2024,
        0,
        1
      ) +
      2300 *
        ONE_HOUR_MS
    ).toISOString();

  const evaluationEndAt =
    new Date(
      Date.UTC(
        2024,
        0,
        1
      ) +
      2600 *
        ONE_HOUR_MS
    ).toISOString();

  /*
   * New architecture:
   * ONE chronological GARCH stream,
   * multiple horizons.
   */

  const singlePass =
    evaluateGarchNormalMultiHorizonV1({
      series,

      horizonBarsList:
        HORIZONS,

      expectedIntervalMs:
        ONE_HOUR_MS,

      evaluationStartAt,

      evaluationEndAt,
    });

  /*
   * Regression reference:
   * old architecture —
   * one independent state stream
   * per horizon.
   *
   * Forecast values must be identical
   * because horizon does not alter
   * GARCH state recursion.
   */

  for (
    const horizonBars of
      HORIZONS
  ) {
    const independent =
      buildIndependentEvaluation({
        series,

        horizonBars,

        evaluationStartAt,

        evaluationEndAt,
      });

    const horizonResult =
      singlePass
        .horizons[
          String(
            horizonBars
          )
        ];

    compareRows({
      independent,

      singlePass:
        horizonResult,

      horizonBars,
    });

    assertClose(
      horizonResult
        .aggregate
        .qlike
        .mean,
      independent
        .aggregate
        .qlike
        .mean
    );
  }

  /*
   * Most important architecture assertion:
   *
   * 3 horizons must NOT create
   * 3x state updates.
   */

  assert.strictEqual(
    singlePass
      .diagnostics
      .totalForecasts,
    singlePass
      .sample
      .modelCalls
  );

  const oneHour =
    singlePass
      .horizons["1"];

  const oneDay =
    singlePass
      .horizons["24"];

  const fiveDays =
    singlePass
      .horizons["120"];

  assert.ok(
    singlePass
      .sample
      .modelCalls <
      oneHour.rows.length *
        HORIZONS.length
  );

  assert.strictEqual(
    oneHour.rows[0]
      .issuedAt,
    oneDay.rows[0]
      .issuedAt
  );

  assert.strictEqual(
    oneHour.rows[0]
      .issuedAt,
    fiveDays.rows[0]
      .issuedAt
  );

  const oneDayTargetSpan =
    Date.parse(
      oneDay.rows[0]
        .targetEndTimestamp
    ) -
    Date.parse(
      oneDay.rows[0]
        .targetStartTimestamp
    );

  const fiveDayTargetSpan =
    Date.parse(
      fiveDays.rows[0]
        .targetEndTimestamp
    ) -
    Date.parse(
      fiveDays.rows[0]
        .targetStartTimestamp
    );

  assert.strictEqual(
    oneDayTargetSpan,
    23 *
      ONE_HOUR_MS
  );

  assert.strictEqual(
    fiveDayTargetSpan,
    119 *
      ONE_HOUR_MS
  );

  console.log(
    "GARCH Normal single-pass multi-horizon walk-forward test passed."
  );

  console.log({
    modelCalls:
      singlePass
        .sample
        .modelCalls,

    diagnostics:
      singlePass
        .diagnostics,

    horizons: {
      oneHour: {
        forecasts:
          oneHour
            .sample
            .evaluatedForecasts,

        meanQLIKE:
          oneHour
            .aggregate
            .qlike
            .mean,
      },

      oneDay: {
        forecasts:
          oneDay
            .sample
            .evaluatedForecasts,

        meanQLIKE:
          oneDay
            .aggregate
            .qlike
            .mean,
      },

      fiveDays: {
        forecasts:
          fiveDays
            .sample
            .evaluatedForecasts,

        meanQLIKE:
          fiveDays
            .aggregate
            .qlike
            .mean,
      },
    },
  });
};

run();