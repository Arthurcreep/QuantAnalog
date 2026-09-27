const assert = require(
  "assert"
);

const {
  evaluateEconomicScenario,
} = require(
  "../src/modules/economics/evaluation/evaluateEconomicScenario"
);

const TEST_COST_MODEL_V1 = {
  id:
    "TEST_SCENARIO_COST_MODEL",

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
    evaluateEconomicScenario({
      costModel:
        TEST_COST_MODEL_V1,

      scenario:
        "BASE",

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
    "economic-scenario-v1.1"
  );

  assert.strictEqual(
    result.scenario,
    "BASE"
  );

  assert.strictEqual(
    result.trades.results.length,
    2
  );

  assert.strictEqual(
    result.trades.summary.tradeCount,
    2
  );

  assert.strictEqual(
    result.periodic.observationCount,
    4
  );

  assert.strictEqual(
    result
      .accounting
      .costBookingPolicy,
    "ALL_TRADE_COSTS_AT_EXIT"
  );

  assert.strictEqual(
    result
      .accounting
      .reconciliation
      .passed,
    true
  );

  assert.strictEqual(
    result
      .accounting
      .reconciliation
      .grossPnlMatches,
    true
  );

  assert.strictEqual(
    result
      .accounting
      .reconciliation
      .costsMatch,
    true
  );

  assert.strictEqual(
    result
      .accounting
      .reconciliation
      .netPnlMatches,
    true
  );

  assert.strictEqual(
    result
      .accounting
      .reconciliation
      .endingEquityMatches,
    true
  );

  almostEqual(
    result
      .trades
      .summary
      .grossPnl,
    30
  );

  almostEqual(
    result
      .trades
      .summary
      .totalCosts,
    3.0975
  );

  almostEqual(
    result
      .trades
      .summary
      .netPnl,
    26.9025
  );

  almostEqual(
    result
      .capital
      .endingEquity,
    10026.9025
  );

  almostEqual(
    result
      .capital
      .expectedEndingEquity,
    10026.9025
  );

  almostEqual(
    result
      .capital
      .netChange,
    26.9025
  );

  almostEqual(
    result
      .accounting
      .reconciliation
      .periodicNetPnl,
    26.9025
  );

  assert.ok(
    result
      .periodic
      .performance
      .sharpeRatio !==
      null
  );

  assert.ok(
    result
      .periodic
      .performance
      .sortinoRatio !==
      null
  );

  assert.ok(
    result
      .periodic
      .drawdown
      .maxDrawdown <
      0
  );

  assert.ok(
    result
      .periodic
      .drawdown
      .calmarRatio !==
      null
  );

  console.log(
    "Economic scenario reconciliation test passed."
  );

  console.log({
    scenario:
      result.scenario,

    grossTradePnl:
      result
        .trades
        .summary
        .grossPnl,

    costs:
      result
        .trades
        .summary
        .totalCosts,

    netTradePnl:
      result
        .trades
        .summary
        .netPnl,

    periodicNetPnl:
      result
        .accounting
        .reconciliation
        .periodicNetPnl,

    endingEquity:
      result
        .capital
        .endingEquity,

    expectedEndingEquity:
      result
        .capital
        .expectedEndingEquity,

    reconciliation:
      result
        .accounting
        .reconciliation
        .passed,

    maxDrawdown:
      result
        .periodic
        .drawdown
        .maxDrawdown,

    sharpe:
      result
        .periodic
        .performance
        .sharpeRatio,

    sortino:
      result
        .periodic
        .performance
        .sortinoRatio,

    calmar:
      result
        .periodic
        .drawdown
        .calmarRatio,
  });
};

run();