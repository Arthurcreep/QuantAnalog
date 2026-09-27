const assert = require(
  "assert"
);

const {
  VOLUME_ZSCORE_FUTURE_RV_V1,
} = require(
  "../src/modules/research/protocols/volumeZScoreFutureRvV1"
);

const {
  buildContinuousFeatureSeries,
} = require(
  "../src/modules/research/factors/buildContinuousFeatureSeries"
);

const buildSeries = () => {
  const series = [];

  const start =
    Date.UTC(
      2026,
      0,
      1,
      0,
      0,
      0
    );

  for (
    let index = 0;
    index < 169;
    index += 1
  ) {
    const volume =
      index < 168
        ? (
            index % 2 ===
            0
              ? 10
              : 20
          )
        : 1000;

    series.push({
      timestamp:
        new Date(
          start +
          index *
            60 *
            60 *
            1000
        ).toISOString(),

      logReturn:
        0.001,

      volume,
    });
  }

  return series;
};

const calculateExpectedZScore =
  (
    series
  ) => {
    const baseline =
      series
        .slice(
          0,
          168
        )
        .map(
          (item) =>
            Math.log1p(
              item.volume
            )
        );

    const current =
      Math.log1p(
        series[168]
          .volume
      );

    const mean =
      baseline.reduce(
        (
          sum,
          value
        ) =>
          sum +
          value,
        0
      ) /
      baseline.length;

    const variance =
      baseline.reduce(
        (
          sum,
          value
        ) =>
          sum +
          (
            value -
            mean
          ) ** 2,
        0
      ) /
      baseline.length;

    return (
      current -
      mean
    ) /
    Math.sqrt(
      variance
    );
  };

const run = () => {
  const protocol =
    VOLUME_ZSCORE_FUTURE_RV_V1;

  assert.strictEqual(
    protocol.id,
    "VOLUME_ZSCORE_FUTURE_RV"
  );

  assert.strictEqual(
    protocol.version,
    "1.0.0"
  );

  assert.strictEqual(
    protocol.status,
    "FROZEN"
  );

  assert.strictEqual(
    protocol.feature.name,
    "VOLUME_ZSCORE"
  );

  assert.strictEqual(
    protocol.feature.kind,
    "CONTINUOUS"
  );

  assert.strictEqual(
    protocol.feature.field,
    "volumeZScore"
  );

  assert.strictEqual(
    protocol
      .feature
      .windowSizeBars,
    168
  );

  assert.strictEqual(
    protocol
      .feature
      .transform,
    "LOG1P"
  );

  assert.strictEqual(
    protocol
      .feature
      .baselineMode,
    "PREVIOUS_BARS_EXCLUDE_CURRENT"
  );

  assert.strictEqual(
    protocol
      .feature
      .standardDeviation,
    "POPULATION"
  );

  assert.strictEqual(
    protocol.target.name,
    "FUTURE_REALIZED_VOLATILITY"
  );

  assert.deepStrictEqual(
    protocol.horizons.map(
      (item) =>
        item.bars
    ),
    [
      1,
      4,
      6,
      12,
      24,
    ]
  );

  assert.strictEqual(
    protocol
      .robustness
      .enabled,
    true
  );

  assert.strictEqual(
    protocol
      .robustness
      .evidenceEligible,
    true
  );

  const series =
    buildSeries();

  const features =
    buildContinuousFeatureSeries({
      returnSeries:
        series,

      protocol,

      expectedIntervalMs:
        60 *
        60 *
        1000,
    });

  assert.strictEqual(
    features.length,
    1
  );

  const expected =
    calculateExpectedZScore(
      series
    );

  assert.ok(
    Math.abs(
      features[0]
        .volumeZScore -
      expected
    ) <
    1e-10
  );

  assert.strictEqual(
    features[0]
      .timestamp,
    series[168]
      .timestamp
  );

  assert.strictEqual(
    features[0]
      .featureStartTimestamp,
    series[0]
      .timestamp
  );

  assert.strictEqual(
    features[0]
      .featureEndTimestamp,
    series[168]
      .timestamp
  );

  console.log(
    "H_VOLM_001 preregistration test passed."
  );

  console.log({
    protocolId:
      protocol.id,

    status:
      protocol.status,

    feature:
      protocol.feature.name,

    transform:
      protocol
        .feature
        .transform,

    windowSizeBars:
      protocol
        .feature
        .windowSizeBars,

    baselineMode:
      protocol
        .feature
        .baselineMode,

    standardDeviation:
      protocol
        .feature
        .standardDeviation,

    target:
      protocol.target.name,

    horizons:
      protocol.horizons.map(
        (item) =>
          item.label
      ),

    robustnessEvidenceEligible:
      protocol
        .robustness
        .evidenceEligible,

    syntheticVolumeZScore:
      features[0]
        .volumeZScore,
  });
};

run();