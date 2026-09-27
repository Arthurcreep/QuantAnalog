const assert = require(
  "assert"
);

const {
  evaluateEconomicRun,
} = require(
  "../src/modules/economics/evaluation/evaluateEconomicRun"
);

const TEST_DECISION_RULE_V1 = {
  id:
    "TEST_DIRECTIONAL_RULE",

  version:
    "1.0.0",

  status:
    "FROZEN",

  inputMode:
    "PRECOMPUTED_EXECUTION_SERIES",

  positionMode:
    "LONG_ONLY",
};

const TEST_COST_MODEL_V1 = {
  id:
    "TEST_MULTI_SCENARIO_COST_MODEL",

  version:
    "1.0.0",

  status:
    "FROZEN",

  unit:
    "BPS",

  scenarios: {
    OPTIMISTIC: {
      commissionBpsPerSide:
        0,

      halfSpreadBpsPerSide:
        0,

      slippageBpsPerSide:
        0,

      marketImpactBpsPerSide:
        0,

      fundingBpsPerHoldingPeriod:
        0,

      financingBorrowBpsPerHoldingPeriod:
        0,
    },

    BASE: {
      commissionBpsPerSide:
        5,

      halfSpreadBpsPerSide:
        1,

      slippageBpsPerSide:
        1,

      marketImpactBpsPerSide:
        0.5,

      fundingBpsPerHoldingPeriod:
        0,

      financingBorrowBpsPerHoldingPeriod:
        0,
    },

    STRESS: {
      commissionBpsPerSide:
        10,

      halfSpreadBpsPerSide:
        2,

      slippageBpsPerSide:
        4,

      marketImpactBpsPerSide:
        2,

      fundingBpsPerHoldingPeriod:
        0,

      financingBorrowBpsPerHoldingPeriod:
        0,
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
  const result =
    evaluateEconomicRun({
      costModel:
        TEST_COST_MODEL_V1,

      decisionRule:
        TEST_DECISION_RULE_V1,

      startingCapital:
        10000,

      startTimestamp:
        "2026-01-01T00:00:00.000Z",

      periodsPerYear:
        4,

      trades: [
        {
          tradeId:
            "T1",

          side:
            "LONG",

          entryPrice:
            100,

          exitPrice:
            105,

          quantity:
            10,

          holdingPeriods:
            2,

          entryTimestamp:
            "2026-01-01T00:00:00.000Z",

          exitTimestamp:
            "2026-01-01T02:00:00.000Z",
        },

        {
          tradeId:
            "T2",

          side:
            "LONG",

          entryPrice:
            105,

          exitPrice:
            103,

          quantity:
            10,

          holdingPeriods:
            2,

          entryTimestamp:
            "2026-01-01T02:00:00.000Z",

          exitTimestamp:
            "2026-01-01T04:00:00.000Z",
        },
      ],

      grossPnlSeries: [
        {
          timestamp:
            "2026-01-01T01:00:00.000Z",

          grossPnl:
            20,
        },

        {
          timestamp:
            "2026-01-01T02:00:00.000Z",

          grossPnl:
            30,
        },

        {
          timestamp:
            "2026-01-01T03:00:00.000Z",

          grossPnl:
            -15,
        },

        {
          timestamp:
            "2026-01-01T04:00:00.000Z",

          grossPnl:
            -5,
        },
      ],
    });

  assert.strictEqual(
    result.engineVersion,
    "economic-run-v1.0"
  );

  assert.strictEqual(
    result
      .decisionRule
      .id,
    "TEST_DIRECTIONAL_RULE"
  );

  assert.strictEqual(
    result
      .decisionRule
      .version,
    "1.0.0"
  );

  assert.strictEqual(
    result
      .decisionRule
      .checksum
      .length,
    64
  );

  assert.strictEqual(
    result
      .costModel
      .checksum
      .length,
    64
  );

  assert.deepStrictEqual(
    Object.keys(
      result.scenarios
    ),
    [
      "OPTIMISTIC",
      "BASE",
      "STRESS",
    ]
  );

  const optimistic =
    result
      .scenarios
      .OPTIMISTIC;

  const base =
    result
      .scenarios
      .BASE;

  const stress =
    result
      .scenarios
      .STRESS;

  almostEqual(
    optimistic
      .trades
      .summary
      .grossPnl,
    30
  );

  almostEqual(
    base
      .trades
      .summary
      .grossPnl,
    30
  );

  almostEqual(
    stress
      .trades
      .summary
      .grossPnl,
    30
  );

  almostEqual(
    optimistic
      .trades
      .summary
      .totalCosts,
    0
  );

  almostEqual(
    base
      .trades
      .summary
      .totalCosts,
    3.0975
  );

  almostEqual(
    stress
      .trades
      .summary
      .totalCosts,
    7.434
  );

  almostEqual(
    optimistic
      .trades
      .summary
      .netPnl,
    30
  );

  almostEqual(
    base
      .trades
      .summary
      .netPnl,
    26.9025
  );

  almostEqual(
    stress
      .trades
      .summary
      .netPnl,
    22.566
  );

  assert.strictEqual(
    optimistic
      .accounting
      .reconciliation
      .passed,
    true
  );

  assert.strictEqual(
    base
      .accounting
      .reconciliation
      .passed,
    true
  );

  assert.strictEqual(
    stress
      .accounting
      .reconciliation
      .passed,
    true
  );

  assert.ok(
    optimistic
      .trades
      .summary
      .totalCosts <
    base
      .trades
      .summary
      .totalCosts
  );

  assert.ok(
    base
      .trades
      .summary
      .totalCosts <
    stress
      .trades
      .summary
      .totalCosts
  );

  assert.ok(
    optimistic
      .trades
      .summary
      .netPnl >
    base
      .trades
      .summary
      .netPnl
  );

  assert.ok(
    base
      .trades
      .summary
      .netPnl >
    stress
      .trades
      .summary
      .netPnl
  );

  assert.strictEqual(
    result
      .comparison
      .survivesBaseCosts,
    true
  );

  assert.strictEqual(
    result
      .comparison
      .survivesStressCosts,
    true
  );

  console.log(
    "Economic multi-scenario run test passed."
  );

  console.log({
    decisionRule:
      result
        .decisionRule,

    costModel:
      result
        .costModel,

    optimistic: {
      costs:
        optimistic
          .trades
          .summary
          .totalCosts,

      netPnl:
        optimistic
          .trades
          .summary
          .netPnl,
    },

    base: {
      costs:
        base
          .trades
          .summary
          .totalCosts,

      netPnl:
        base
          .trades
          .summary
          .netPnl,
    },

    stress: {
      costs:
        stress
          .trades
          .summary
          .totalCosts,

      netPnl:
        stress
          .trades
          .summary
          .netPnl,
    },

    survivesBaseCosts:
      result
        .comparison
        .survivesBaseCosts,

    survivesStressCosts:
      result
        .comparison
        .survivesStressCosts,
  });
};

run();