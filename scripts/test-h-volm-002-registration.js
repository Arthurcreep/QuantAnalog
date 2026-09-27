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
  hasResearchProtocol,
  getResearchProtocol,
} = require(
  "../src/modules/research/registry/researchProtocolRegistry"
);

const {
  listHypotheses,
} = require(
  "../src/modules/research/registry/hypothesisRegistry"
);

const {
  buildResearchPlan,
} = require(
  "../src/modules/research/planning/buildResearchPlan"
);

const run = () => {
  const hypothesisId =
    "H_VOLM_002";

  const protocolKey =
    "VOLUME_ZSCORE_FUTURE_RETURN_V1";

  assert.strictEqual(
    isHypothesisImplemented(
      hypothesisId
    ),
    true
  );

  const execution =
    getHypothesisExecution(
      hypothesisId
    );

  assert.ok(
    execution
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
    protocolKey
  );

  assert.deepStrictEqual(
    execution.datasetBinding,
    {
      capability:
        "CANDLES",

      stage:
        "PREPARED",

      cardinality:
        "SINGLE",

      timeframe:
        "1h",
    }
  );

  assert.strictEqual(
    hasResearchProtocol(
      protocolKey
    ),
    true
  );

  const protocol =
    getResearchProtocol(
      protocolKey
    );

  assert.ok(
    protocol
  );

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
    protocol.target.name,
    "FUTURE_LOG_RETURN"
  );

  assert.strictEqual(
    protocol
      .robustness
      .evidenceEligible,
    true
  );

  /*
   * Verify registry returns a clone
   * rather than shared mutable state.
   */
  protocol.feature.windowSizeBars =
    999;

  const secondProtocol =
    getResearchProtocol(
      protocolKey
    );

  assert.strictEqual(
    secondProtocol
      .feature
      .windowSizeBars,
    168
  );

  const plan =
    buildResearchPlan({
      hypotheses:
        listHypotheses(),

      availableData: [
        "CANDLES",
        "TIMESTAMP",
      ],

      acquirableData: [
        "CANDLES",
        "FUNDING",
        "OPEN_INTEREST",
        "MULTI_ASSET_CANDLES",
      ],
    });

  const item =
    plan.items.find(
      (planItem) =>
        planItem.hypothesisId ===
        hypothesisId
    );

  assert.ok(
    item
  );

  assert.strictEqual(
    item.planStatus,
    "RUNNABLE"
  );

  assert.strictEqual(
    item.executionStatus,
    "IMPLEMENTED"
  );

  assert.strictEqual(
    item.family,
    "VOLUME"
  );

  assert.strictEqual(
    item.multipleTestingFamily,
    "VOLUME"
  );

  assert.strictEqual(
    item
      .multipleTestingFamilySource,
    "RESEARCH_FAMILY_FALLBACK"
  );

  assert.strictEqual(
    item
      .execution
      .executor,
    "CONTINUOUS_FACTOR_RESEARCH"
  );

  assert.strictEqual(
    item
      .execution
      .protocol,
    protocolKey
  );

  /*
   * H_VOLM_001 and H_VOLM_002 are
   * frozen into the same statistical
   * family before viewing H_VOLM_002.
   */
  const volumeItems =
    plan.items.filter(
      (planItem) =>
        planItem
          .multipleTestingFamily ===
        "VOLUME"
    );

  assert.deepStrictEqual(
    volumeItems
      .map(
        (planItem) =>
          planItem.hypothesisId
      )
      .sort(),
    [
      "H_VOLM_001",
      "H_VOLM_002",
    ]
  );

  assert.strictEqual(
    plan.summary.RUNNABLE,
    10
  );

  assert.strictEqual(
    plan.summary.NOT_IMPLEMENTED,
    1
  );

  console.log(
    "H_VOLM_002 registration test passed."
  );

  console.log({
    hypothesisId,
    status:
      execution.status,

    executor:
      execution.executor,

    protocolKey,

    protocolId:
      secondProtocol.id,

    feature:
      secondProtocol
        .feature
        .name,

    target:
      secondProtocol
        .target
        .name,

    multipleTestingFamily:
      item
        .multipleTestingFamily,

    familyMembers:
      volumeItems
        .map(
          (planItem) =>
            planItem.hypothesisId
        )
        .sort(),

    runnableHypotheses:
      plan.summary.RUNNABLE,

    notImplementedHypotheses:
      plan
        .summary
        .NOT_IMPLEMENTED,
  });
};

run();