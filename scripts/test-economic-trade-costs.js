const assert = require(
  "assert"
);

const {
  validateCostModel,
} = require(
  "../src/modules/economics/costModels/validateCostModel"
);

const {
  calculateTradeCosts,
} = require(
  "../src/modules/economics/calculations/calculateTradeCosts"
);

const TEST_COST_MODEL_V1 = {
  id:
    "TEST_LINEAR_COST_MODEL",

  version:
    "1.0.0",

  status:
    "FROZEN",

  unit:
    "BPS",

  scenarios: {
    OPTIMISTIC: {
      commissionBpsPerSide:
        2,

      halfSpreadBpsPerSide:
        0.5,

      slippageBpsPerSide:
        0.5,

      marketImpactBpsPerSide:
        0.25,

      fundingBpsPerHoldingPeriod:
        0.2,

      financingBorrowBpsPerHoldingPeriod:
        0,
    },

    BASE: {
      commissionBpsPerSide:
        5,

      halfSpreadBpsPerSide:
        1,

      slippageBpsPerSide:
        2,

      marketImpactBpsPerSide:
        0.5,

      fundingBpsPerHoldingPeriod:
        0.8,

      financingBorrowBpsPerHoldingPeriod:
        0.2,
    },

    STRESS: {
      commissionBpsPerSide:
        7,

      halfSpreadBpsPerSide:
        2,

      slippageBpsPerSide:
        5,

      marketImpactBpsPerSide:
        2,

      fundingBpsPerHoldingPeriod:
        2,

      financingBorrowBpsPerHoldingPeriod:
        0.5,
    },
  },
};

const almostEqual = (
  actual,
  expected,
  tolerance =
    1e-10
) => {
  assert.ok(
    Math.abs(
      actual -
      expected
    ) <=
      tolerance,
    `Expected ${expected}, got ${actual}`
  );
};

const run = () => {
  assert.strictEqual(
    validateCostModel(
      TEST_COST_MODEL_V1
    ),
    true
  );

  const result =
    calculateTradeCosts({
      costModel:
        TEST_COST_MODEL_V1,

      scenario:
        "BASE",

      entryNotional:
        10000,

      exitNotional:
        10100,

      holdingPeriods:
        3,
    });

  almostEqual(
    result
      .components
      .commission,
    10.05
  );

  almostEqual(
    result
      .components
      .spread,
    2.01
  );

  almostEqual(
    result
      .components
      .slippage,
    4.02
  );

  almostEqual(
    result
      .components
      .marketImpact,
    1.005
  );

  almostEqual(
    result
      .components
      .funding,
    2.412
  );

  almostEqual(
    result
      .components
      .financingBorrow,
    0.603
  );

  almostEqual(
    result
      .totalExecutionCost,
    17.085
  );

  almostEqual(
    result
      .totalHoldingCost,
    3.015
  );

  almostEqual(
    result
      .totalCost,
    20.1
  );

  almostEqual(
    result
      .totalCostBpsOnEntryNotional,
    20.1
  );

  const fundingCreditModel =
    JSON.parse(
      JSON.stringify(
        TEST_COST_MODEL_V1
      )
    );

  fundingCreditModel
    .scenarios
    .BASE
    .fundingBpsPerHoldingPeriod =
    -1;

  const fundingCredit =
    calculateTradeCosts({
      costModel:
        fundingCreditModel,

      scenario:
        "BASE",

      entryNotional:
        10000,

      exitNotional:
        10000,

      holdingPeriods:
        2,
    });

  assert.ok(
    fundingCredit
      .components
      .funding <
    0
  );

  console.log(
    "Economic trade-cost calculation test passed."
  );

  console.log({
    scenario:
      result.scenario,

    executionNotional:
      result.executionNotional,

    totalExecutionCost:
      result.totalExecutionCost,

    totalHoldingCost:
      result.totalHoldingCost,

    totalCost:
      result.totalCost,

    totalCostBpsOnEntryNotional:
      result
        .totalCostBpsOnEntryNotional,

    fundingCreditExample:
      fundingCredit
        .components
        .funding,
  });
};

run();