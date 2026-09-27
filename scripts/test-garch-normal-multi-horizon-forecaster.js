const assert = require(
  "assert"
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
            2025,
            0,
            1
          ) +
          index *
            ONE_HOUR_MS
        ).toISOString(),

      logReturn:
        0.01 *
        Math.sin(
          index / 7
        ),
    })
  );

const run = () => {
  const trainingWindowBars =
    GARCH_NORMAL_MULTI_HORIZON_V1
      .trainingWindowBars;

  const allSeries =
    buildSeries({
      count:
        trainingWindowBars +
        2,
    });

  const forecaster =
    createGarchNormalMultiHorizonForecaster();

  const firstHistory =
    allSeries.slice(
      0,
      trainingWindowBars
    );

  const first =
    forecaster.forecast({
      series:
        firstHistory,

      modelConfig: {
        trainingWindowBars,

        refitEveryForecasts:
          GARCH_NORMAL_MULTI_HORIZON_V1
            .refitEveryForecasts,
      },

      horizonBars:
        24,

      expectedIntervalMs:
        ONE_HOUR_MS,

      anchorTimestamp:
        firstHistory[
          firstHistory.length -
          1
        ].timestamp,
    });

  assert.strictEqual(
    first.refit,
    true
  );

  assert.strictEqual(
    first.horizonBars,
    24
  );

  assert.strictEqual(
    first
      .stepVariances
      .length,
    24
  );

  assert.ok(
    first
      .oneStepVariance >
      0
  );

  assert.strictEqual(
    first
      .prediction
      .unit,
    "REALIZED_VOLATILITY"
  );

  assert.ok(
    first
      .prediction
      .varianceValue >
      first
        .oneStepVariance
  );

  const secondHistory =
    allSeries.slice(
      1,
      trainingWindowBars +
        1
    );

  const second =
    forecaster.forecast({
      series:
        secondHistory,

      modelConfig: {
        trainingWindowBars,

        refitEveryForecasts:
          GARCH_NORMAL_MULTI_HORIZON_V1
            .refitEveryForecasts,
      },

      horizonBars:
        72,

      expectedIntervalMs:
        ONE_HOUR_MS,

      anchorTimestamp:
        secondHistory[
          secondHistory.length -
          1
        ].timestamp,
    });

  assert.strictEqual(
    second.refit,
    false
  );

  assert.strictEqual(
    second.horizonBars,
    72
  );

  assert.strictEqual(
    second
      .stepVariances
      .length,
    72
  );

  assert.ok(
    second
      .prediction
      .varianceValue >
      second
        .oneStepVariance
  );

  /*
   * Longer horizon must contain
   * more cumulative expected variance.
   */

  const independentForecaster =
    createGarchNormalMultiHorizonForecaster();

  const oneHour =
    independentForecaster.forecast({
      series:
        firstHistory,

      modelConfig: {
        trainingWindowBars,

        refitEveryForecasts:
          GARCH_NORMAL_MULTI_HORIZON_V1
            .refitEveryForecasts,
      },

      horizonBars:
        1,

      expectedIntervalMs:
        ONE_HOUR_MS,

      anchorTimestamp:
        firstHistory[
          firstHistory.length -
          1
        ].timestamp,
    });

  assert.strictEqual(
    oneHour
      .stepVariances
      .length,
    1
  );

  assert.strictEqual(
    oneHour
      .prediction
      .varianceValue,
    oneHour
      .oneStepVariance
  );

  assert.throws(
    () =>
      independentForecaster.forecast({
        series:
          firstHistory,

        modelConfig: {
          trainingWindowBars,

          refitEveryForecasts:
            GARCH_NORMAL_MULTI_HORIZON_V1
              .refitEveryForecasts,
        },

        horizonBars:
          12,

        expectedIntervalMs:
          ONE_HOUR_MS,

        anchorTimestamp:
          firstHistory[
            firstHistory.length -
            1
          ].timestamp,
      }),
    /UNSUPPORTED_GARCH_MULTI_HORIZON/
  );

  const diagnostics =
    forecaster
      .getDiagnostics();

  assert.strictEqual(
    diagnostics.refitCount,
    1
  );

  assert.strictEqual(
    diagnostics.recursiveForecastCount,
    1
  );

  assert.strictEqual(
    diagnostics.totalForecasts,
    2
  );

  console.log(
    "GARCH Normal multi-horizon forecaster test passed."
  );

  console.log({
    protocol:
      `${GARCH_NORMAL_MULTI_HORIZON_V1.id}@${GARCH_NORMAL_MULTI_HORIZON_V1.version}`,

    model:
      `${GARCH_NORMAL_MULTI_HORIZON_V1.modelId}@${GARCH_NORMAL_MULTI_HORIZON_V1.modelVersion}`,

    oneDay: {
      oneStepVariance:
        first
          .oneStepVariance,

      cumulativeVariance:
        first
          .prediction
          .varianceValue,

      volatility:
        first
          .prediction
          .value,
    },

    threeDays: {
      oneStepVariance:
        second
          .oneStepVariance,

      cumulativeVariance:
        second
          .prediction
          .varianceValue,

      volatility:
        second
          .prediction
          .value,
    },

    diagnostics,
  });
};

run();