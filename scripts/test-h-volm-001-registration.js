const assert = require(
  "assert"
);

const {
  getHypothesisExecution,
  isHypothesisImplemented,
} = require(
  "../src/modules/research/registry/hypothesisExecutionRegistry"
);

const {
  getResearchProtocol,
  hasResearchProtocol,
} = require(
  "../src/modules/research/registry/researchProtocolRegistry"
);

const {
  getFeatureById,
} = require(
  "../src/modules/research/registry/featureRegistry"
);

const {
  getTargetById,
} = require(
  "../src/modules/research/registry/targetRegistry"
);

const run = () => {
  const execution =
    getHypothesisExecution(
      "H_VOLM_001"
    );

  assert.ok(
    execution
  );

  assert.strictEqual(
    isHypothesisImplemented(
      "H_VOLM_001"
    ),
    true
  );

  assert.strictEqual(
    execution.status,
    "IMPLEMENTED"
  );

  assert.strictEqual(
    execution.executor,
    "CONTINUOUS_FACTOR_RESEARCH"
  );

  assert.strictEqual(
    execution.protocol,
    "VOLUME_ZSCORE_FUTURE_RV_V1"
  );

  assert.strictEqual(
    execution
      .datasetBinding
      .capability,
    "CANDLES"
  );

  assert.strictEqual(
    execution
      .datasetBinding
      .stage,
    "PREPARED"
  );

  assert.strictEqual(
    execution
      .datasetBinding
      .cardinality,
    "SINGLE"
  );

  assert.strictEqual(
    execution
      .datasetBinding
      .timeframe,
    "1h"
  );

  assert.strictEqual(
    hasResearchProtocol(
      "VOLUME_ZSCORE_FUTURE_RV_V1"
    ),
    true
  );

  const protocol =
    getResearchProtocol(
      "VOLUME_ZSCORE_FUTURE_RV_V1"
    );

  assert.ok(
    protocol
  );

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

  const feature =
    getFeatureById(
      "VOLUME_ZSCORE"
    );

  assert.ok(
    feature
  );

  assert.strictEqual(
    feature.status,
    "IMPLEMENTED"
  );

  const target =
    getTargetById(
      "FUTURE_REALIZED_VOLATILITY"
    );

  assert.ok(
    target
  );

  assert.strictEqual(
    target.status,
    "IMPLEMENTED"
  );

  console.log(
    "H_VOLM_001 registration test passed."
  );

  console.log({
    hypothesisId:
      execution.hypothesisId,

    status:
      execution.status,

    executor:
      execution.executor,

    protocol:
      execution.protocol,

    protocolStatus:
      protocol.status,

    timeframe:
      execution
        .datasetBinding
        .timeframe,

    feature:
      protocol.feature.name,

    volumeWindowBars:
      protocol
        .feature
        .windowSizeBars,

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
  });
};

run();