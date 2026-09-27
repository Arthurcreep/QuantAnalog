const assert = require(
  "assert"
);

const {
  createArchNormalMultiHorizonForecaster,
} = require(
  "../src/modules/forecasting/models/createArchNormalMultiHorizonForecaster"
);

const HOUR_MS =
  60 *
  60 *
  1000;

const buildSeries = ({
  count,
  startAt,
}) => {
  const startMs =
    Date.parse(
      startAt
    );

  const rows =
    [];

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    rows.push({
      timestamp:
        new Date(
          startMs +
          index *
            HOUR_MS
        ).toISOString(),

      logReturn:
        Math.sin(
          index /
          13
        ) *
          0.003 +
        Math.cos(
          index /
          29
        ) *
          0.0015 +
        (
          index % 113 === 0
            ? 0.012
            : 0
        ),
    });
  }

  return rows;
};

const run = () => {
  const trainingWindowBars =
    500;

  const series =
    buildSeries({
      count:
        trainingWindowBars,

      startAt:
        "2026-01-01T00:00:00.000Z",
    });

  const forecaster =
    createArchNormalMultiHorizonForecaster();

  const result =
    forecaster.forecastMany({
      series,

      modelConfig: {
        trainingWindowBars,

        refitEveryForecasts:
          24,
      },

      horizonBarsList: [
        1,
        6,
        24,
        72,
        120,
      ],

      expectedIntervalMs:
        HOUR_MS,

      anchorTimestamp:
        series[
          series.length - 1
        ].timestamp,
    });

  assert.strictEqual(
    result.modelId,
    "ARCH_NORMAL"
  );

  assert.strictEqual(
    result.modelVersion,
    "1.0.0"
  );

  assert.strictEqual(
    result.parameters.beta,
    0
  );

  assert.strictEqual(
    result.refit,
    true
  );

  for (
    const horizonBars of [
      1,
      6,
      24,
      72,
      120,
    ]
  ) {
    const prediction =
      result
        .predictions[
          String(
            horizonBars
          )
        ]
        .prediction;

    assert.ok(
      prediction.value >
        0
    );

    assert.ok(
      prediction
        .varianceValue >
        0
    );

    assert.ok(
      prediction
        .interval
        .lower >= 0
    );

    assert.ok(
      prediction
        .interval
        .upper >
        prediction
          .interval
          .lower
    );

    assert.strictEqual(
      prediction
        .interval
        .confidenceLevel,
      0.95
    );
  }

  console.log(
    "ARCH Normal multi-horizon forecaster test passed."
  );

  console.log({
    model:
      `${result.modelId}@${result.modelVersion}`,

    parameters:
      result.parameters,

    refit:
      result.refit,

    predictions:
      Object.fromEntries(
        Object.entries(
          result.predictions
        ).map(
          ([
            horizonBars,
            item,
          ]) => [
            horizonBars,

            {
              value:
                item
                  .prediction
                  .value,

              lower:
                item
                  .prediction
                  .interval
                  .lower,

              upper:
                item
                  .prediction
                  .interval
                  .upper,
            },
          ]
        )
      ),
  });
};

run();