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
  getTargetById,
} = require(
  "../src/modules/research/registry/targetRegistry"
);

const run = () => {
  const execution =
    getHypothesisExecution(
      "H_RET_001"
    );

  assert.ok(
    execution
  );

  assert.strictEqual(
    isHypothesisImplemented(
      "H_RET_001"
    ),
    true
  );

  assert.strictEqual(
    execution.executor,
    "CONTINUOUS_FACTOR_RESEARCH"
  );

  assert.strictEqual(
    execution.protocol,
    "LAGGED_RETURN_FUTURE_RETURN_V1"
  );

  assert.strictEqual(
    execution.datasetBinding
      .timeframe,
    "1h"
  );

  assert.strictEqual(
    hasResearchProtocol(
      "LAGGED_RETURN_FUTURE_RETURN_V1"
    ),
    true
  );

  const protocol =
    getResearchProtocol(
      "LAGGED_RETURN_FUTURE_RETURN_V1"
    );

  assert.strictEqual(
    protocol.feature.name,
    "LOG_RETURN"
  );

  assert.strictEqual(
    protocol.feature.kind,
    "CONTINUOUS"
  );

  assert.strictEqual(
    protocol.target.name,
    "FUTURE_LOG_RETURN"
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

  const target =
    getTargetById(
      "FUTURE_LOG_RETURN"
    );

  assert.ok(
    target
  );

  assert.strictEqual(
    target.status,
    "IMPLEMENTED"
  );

  console.log(
    "H_RET_001 registration test passed."
  );

  console.log({
    hypothesisId:
      execution.hypothesisId,

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