const assert = require(
  "assert"
);

const {
  fitArchNormalV1,
  forecastNextArchVariance,
} = require(
  "../src/modules/forecasting/models/archNormalV1"
);

const buildSeries = () => {
  const rows =
    [];

  const startMs =
    Date.parse(
      "2026-01-01T00:00:00.000Z"
    );

  const HOUR_MS =
    60 *
    60 *
    1000;

  for (
    let index = 0;
    index < 500;
    index += 1
  ) {
    const wave =
      Math.sin(
        index /
        9
      ) *
      0.0025;

    const secondary =
      Math.cos(
        index /
        17
      ) *
      0.0015;

    const shock =
      index % 73 === 0
        ? 0.015
        : 0;

    const sign =
      index %
        2 ===
      0
        ? 1
        : -1;

    rows.push({
      timestamp:
        new Date(
          startMs +
          index *
            HOUR_MS
        ).toISOString(),

      logReturn:
        wave +
        secondary +
        sign *
          shock,
    });
  }

  return rows;
};

const run = () => {
  const series =
    buildSeries();

  const result =
    fitArchNormalV1({
      series,
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

  assert.ok(
    result
      .parameters
      .omega >
      0
  );

  assert.ok(
    result
      .parameters
      .alpha >=
      0
  );

  assert.ok(
    result
      .parameters
      .alpha <
      0.999
  );

  assert.ok(
    Number.isFinite(
      result
        .prediction
        .varianceValue
    )
  );

  assert.ok(
    result
      .prediction
      .varianceValue >
      0
  );

  const next =
    forecastNextArchVariance({
      observedReturn:
        0.01,

      parameters:
        result.parameters,
    });

  const expectedVariance =
    result
      .parameters
      .omega +
    result
      .parameters
      .alpha *
      0.01 ** 2;

  assert.ok(
    Math.abs(
      next
        .varianceValue -
      expectedVariance
    ) <
      1e-15
  );

  console.log(
    "ARCH Normal V1 test passed."
  );

  console.log({
    model:
      `${result.modelId}@${result.modelVersion}`,

    parameters:
      result.parameters,

    optimization:
      result.optimization,

    prediction:
      result.prediction,

    nextAfterOnePercentReturn:
      next,
  });
};

run();