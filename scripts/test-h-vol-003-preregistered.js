const assert = require(
  "assert"
);

const {
  ABSOLUTE_RETURN_FUTURE_RV_V1,
} = require(
  "../src/modules/research/protocols/absoluteReturnFutureRvV1"
);

const {
  buildContinuousFeatureSeries,
} = require(
  "../src/modules/research/factors/buildContinuousFeatureSeries"
);

const run = () => {
  const protocol =
    ABSOLUTE_RETURN_FUTURE_RV_V1;

  assert.strictEqual(
    protocol.id,
    "ABSOLUTE_RETURN_FUTURE_RV"
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
    "ABS_RETURN"
  );

  assert.strictEqual(
    protocol.feature.kind,
    "CONTINUOUS"
  );

  assert.strictEqual(
    protocol.feature.field,
    "absoluteReturn"
  );

  assert.strictEqual(
    protocol.target.name,
    "FUTURE_REALIZED_VOLATILITY"
  );

  assert.strictEqual(
    protocol.target.field,
    "futureRealizedVolatility"
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

  assert.strictEqual(
    protocol
      .robustness
      .protocol
      .id,
    "CONTINUOUS_FACTOR_ROBUSTNESS"
  );

  assert.strictEqual(
    protocol
      .robustness
      .protocol
      .version,
    "1.0.0"
  );

  const featureSeries =
    buildContinuousFeatureSeries({
      returnSeries: [
        {
          timestamp:
            "2026-01-01T00:00:00.000Z",

          logReturn:
            -0.025,
        },

        {
          timestamp:
            "2026-01-01T01:00:00.000Z",

          logReturn:
            0.01,
        },
      ],

      protocol,

      expectedIntervalMs:
        60 *
        60 *
        1000,
    });

  assert.deepStrictEqual(
    featureSeries,
    [
      {
        timestamp:
          "2026-01-01T00:00:00.000Z",

        absoluteReturn:
          0.025,
      },

      {
        timestamp:
          "2026-01-01T01:00:00.000Z",

        absoluteReturn:
          0.01,
      },
    ]
  );

  console.log(
    "H_VOL_003 preregistration test passed."
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

    robustnessEnabled:
      protocol
        .robustness
        .enabled,

    robustnessEvidenceEligible:
      protocol
        .robustness
        .evidenceEligible,
  });
};

run();