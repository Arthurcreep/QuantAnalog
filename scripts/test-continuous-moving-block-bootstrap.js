const assert = require(
  "assert"
);

const {
  calculateContinuousMovingBlockBootstrap,
} = require(
  "../src/modules/research/calculations/factors/calculateContinuousMovingBlockBootstrap"
);

const buildTimestamp = (
  index
) =>
  new Date(
    Date.UTC(
      2025,
      0,
      1,
      index
    )
  ).toISOString();

const run = () => {
  const rows = [];

  for (
    let index = 0;
    index < 1000;
    index += 1
  ) {
    const x =
      Math.sin(
        index /
        20
      ) +
      (
        index %
        11
      ) *
        0.01;

    const noise =
      Math.sin(
        index /
        7
      ) *
      0.05;

    const y =
      0.75 *
        x +
      noise;

    rows.push({
      timestamp:
        buildTimestamp(
          index
        ),

      feature:
        x,

      target:
        y,
    });
  }

  const result =
    calculateContinuousMovingBlockBootstrap({
      rows,

      featureField:
        "feature",

      targetField:
        "target",

      expectedIntervalMs:
        60 *
        60 *
        1000,

      blockSize:
        48,

      iterations:
        500,

      seed:
        20260930,
    });

  assert.ok(
    result
      .observed
      .beta >
      0.7
  );

  assert.ok(
    result
      .observed
      .beta <
      0.8
  );

  assert.ok(
    result
      .beta
      .confidenceInterval
      .lower >
      0
  );

  assert.ok(
    result
      .beta
      .confidenceInterval
      .upper >
      result
        .beta
        .confidenceInterval
        .lower
  );

  assert.strictEqual(
    result
      .beta
      .excludesZero,
    true
  );

  assert.strictEqual(
    result
      .config
      .iterations,
    500
  );

  console.log(
    "Continuous moving-block bootstrap test passed."
  );

  console.log({
    observedBeta:
      result
        .observed
        .beta,

    confidenceInterval:
      result
        .beta
        .confidenceInterval,

    excludesZero:
      result
        .beta
        .excludesZero,

    attempts:
      result
        .config
        .attempts,

    rejectedIterations:
      result
        .config
        .rejectedIterations,

    validBlockStartCount:
      result
        .config
        .validBlockStartCount,
  });
};

run();