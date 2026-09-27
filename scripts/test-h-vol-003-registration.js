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
      "H_VOL_003"
    );

  assert.ok(
    execution
  );

  assert.strictEqual(
    isHypothesisImplemented(
      "H_VOL_003"
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
    "ABSOLUTE_RETURN_FUTURE_RV_V1"
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
      "ABSOLUTE_RETURN_FUTURE_RV_V1"
    ),
    true
  );

  const protocol =
    getResearchProtocol(
      "ABSOLUTE_RETURN_FUTURE_RV_V1"
    );

  assert.ok(
    protocol
  );

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

  const feature =
    getFeatureById(
      "ABS_RETURN"
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
    "H_VOL_003 registration test passed."
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

    target:
      protocol.target.name,

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