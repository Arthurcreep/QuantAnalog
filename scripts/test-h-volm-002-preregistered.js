const assert = require(
  "assert"
);

const {
  VOLUME_ZSCORE_FUTURE_RETURN_V1,
} = require(
  "../src/modules/research/protocols/volumeZScoreFutureReturnV1"
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

const run = () => {
  const protocol =
    VOLUME_ZSCORE_FUTURE_RETURN_V1;

  assert.strictEqual(
    protocol.id,
    "VOLUME_ZSCORE_FUTURE_RETURN"
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
    "FUTURE_LOG_RETURN"
  );

  assert.strictEqual(
    protocol.target.field,
    "futureLogReturn"
  );

  assert.strictEqual(
    protocol.modelTimeframe,
    "1h"
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
      .statistics
      .hacLagFloor,
    24
  );

  assert.strictEqual(
    protocol
      .statistics
      .multipleTesting
      .method,
    "BENJAMINI_HOCHBERG"
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

  assert.deepStrictEqual(
    protocol.robustness.protocol,
    {
      id:
        "CONTINUOUS_FACTOR_ROBUSTNESS",

      version:
        "1.0.0",
    }
  );

  assert.strictEqual(
    protocol
      .candidateSelection
      .mode,
    "DEVELOPMENT_ONLY"
  );

  assert.strictEqual(
    protocol
      .forwardOos
      .status,
    "PENDING_FUTURE_DATA"
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

  assert.strictEqual(
    features[0].timestamp,
    series[168].timestamp
  );

  assert.ok(
    Number.isFinite(
      features[0]
        .volumeZScore
    )
  );

  assert.ok(
    features[0]
      .volumeZScore >
    0
  );

  console.log(
    "H_VOLM_002 preregistration test passed."
  );

  console.log({
    protocolId:
      protocol.id,

    version:
      protocol.version,

    status:
      protocol.status,

    feature:
      protocol.feature.name,

    target:
      protocol.target.name,

    timeframe:
      protocol.modelTimeframe,

    horizons:
      protocol.horizons.map(
        (item) =>
          item.label
      ),

    volumeWindowBars:
      protocol
        .feature
        .windowSizeBars,

    robustnessEnabled:
      protocol
        .robustness
        .enabled,

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