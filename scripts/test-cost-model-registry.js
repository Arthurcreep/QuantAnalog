const assert = require(
  "assert"
);

const {
  validateCostModel,
} = require(
  "../src/modules/economics/costModels/validateCostModel"
);

const {
  COST_MODEL_REGISTRY,
  getCostModel,
  isCostModelImplemented,
} = require(
  "../src/modules/economics/costModels/costModelRegistry"
);

const MODEL_ID =
  "BYBIT_BTCUSDT_LINEAR_VIP0_RESEARCH";

const MODEL_VERSION =
  "1.0.0";

const run = () => {
  assert.strictEqual(
    COST_MODEL_REGISTRY.length,
    1
  );

  assert.strictEqual(
    isCostModelImplemented({
      id:
        MODEL_ID,

      version:
        MODEL_VERSION,
    }),
    true
  );

  const costModel =
    getCostModel({
      id:
        MODEL_ID,

      version:
        MODEL_VERSION,
    });

  assert.ok(
    costModel,
    "REGISTERED_COST_MODEL_NOT_FOUND"
  );

  assert.strictEqual(
    validateCostModel(
      costModel
    ),
    true
  );

  assert.strictEqual(
    costModel.venue,
    "BYBIT"
  );

  assert.strictEqual(
    costModel.instrument,
    "BTCUSDT"
  );

  assert.strictEqual(
    costModel.marketType,
    "LINEAR"
  );

  assert.strictEqual(
    costModel.productType,
    "PERPETUAL"
  );

  assert.strictEqual(
    costModel.feeTier,
    "VIP_0"
  );

  assert.strictEqual(
    costModel
      .provenance
      .makerCommissionBpsPerSide,
    2
  );

  assert.strictEqual(
    costModel
      .provenance
      .takerCommissionBpsPerSide,
    5.5
  );

  assert.strictEqual(
    costModel
      .scenarios
      .OPTIMISTIC
      .commissionBpsPerSide,
    2
  );

  assert.strictEqual(
    costModel
      .scenarios
      .BASE
      .commissionBpsPerSide,
    5.5
  );

  assert.strictEqual(
    costModel
      .scenarios
      .STRESS
      .commissionBpsPerSide,
    5.5
  );

  assert.strictEqual(
    costModel
      .evidenceEligible,
    false
  );

  assert.strictEqual(
    costModel
      .provenance
      .fundingMode,
    "ZERO_PLACEHOLDER_UNTIL_HISTORICAL_FUNDING_PIPELINE"
  );

  assert.strictEqual(
    Object.isFrozen(
      costModel
    ),
    true
  );

  assert.strictEqual(
    Object.isFrozen(
      costModel.scenarios
    ),
    true
  );

  assert.strictEqual(
    Object.isFrozen(
      costModel
        .scenarios
        .BASE
    ),
    true
  );

  assert.strictEqual(
    getCostModel({
      id:
        MODEL_ID,

      version:
        "999.0.0",
    }),
    null
  );

  console.log(
    "CostModel registry test passed."
  );

  console.log({
    id:
      costModel.id,

    version:
      costModel.version,

    venue:
      costModel.venue,

    instrument:
      costModel.instrument,

    marketType:
      costModel.marketType,

    feeTier:
      costModel.feeTier,

    makerBps:
      costModel
        .provenance
        .makerCommissionBpsPerSide,

    takerBps:
      costModel
        .provenance
        .takerCommissionBpsPerSide,

    optimisticCommissionBps:
      costModel
        .scenarios
        .OPTIMISTIC
        .commissionBpsPerSide,

    baseCommissionBps:
      costModel
        .scenarios
        .BASE
        .commissionBpsPerSide,

    stressCommissionBps:
      costModel
        .scenarios
        .STRESS
        .commissionBpsPerSide,

    evidenceEligible:
      costModel
        .evidenceEligible,

    evidenceIneligibleReason:
      costModel
        .evidenceIneligibleReason,
  });
};

run();