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
      "H_VOL_002"
    );

  assert.ok(
    execution
  );

  assert.strictEqual(
    isHypothesisImplemented(
      "H_VOL_002"
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
    "CURRENT_RV_FUTURE_RV_V1"
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
      "CURRENT_RV_FUTURE_RV_V1"
    ),
    true
  );

  const protocol =
    getResearchProtocol(
      "CURRENT_RV_FUTURE_RV_V1"
    );

  assert.ok(
    protocol
  );

  assert.strictEqual(
    protocol.id,
    "CURRENT_RV_FUTURE_RV"
  );

  assert.strictEqual(
    protocol.version,
    "1.0.0"
  );

  assert.strictEqual(
    protocol.modelTimeframe,
    "1h"
  );

  assert.strictEqual(
    protocol.feature.name,
    "REALIZED_VOLATILITY"
  );

  assert.strictEqual(
    protocol.feature.kind,
    "CONTINUOUS"
  );

  assert.strictEqual(
    protocol.feature.field,
    "realizedVolatility"
  );

  assert.strictEqual(
    protocol
      .feature
      .windowSizeBars,
    24
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

  const feature =
    getFeatureById(
      "REALIZED_VOLATILITY"
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
    "H_VOL_002 registration test passed."
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

    timeframe:
      execution
        .datasetBinding
        .timeframe,

    feature:
      protocol.feature.name,

    currentRvWindowBars:
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
  });
};

run();