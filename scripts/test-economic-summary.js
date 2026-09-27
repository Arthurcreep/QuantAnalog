const assert = require(
  "assert"
);

const {
  calculateTradeEconomics,
} = require(
  "../src/modules/economics/calculations/calculateTradeEconomics"
);

const {
  calculateEconomicSummary,
} = require(
  "../src/modules/economics/calculations/calculateEconomicSummary"
);

const TEST_COST_MODEL_V1 = {
  id:
    "TEST_ECONOMIC_COST_MODEL",

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

    STRESS: {
      commissionBpsPerSide:
        10,

      halfSpreadBpsPerSide:
        1,

      slippageBpsPerSide:
        2,

      marketImpactBpsPerSide:
        1,

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
  const trades = [
    calculateTradeEconomics({
      costModel:
        TEST_COST_MODEL_V1,

      scenario:
        "BASE",

      side:
        "LONG",

      entryPrice:
        100,

      exitPrice:
        110,

      quantity:
        10,
    }),

    calculateTradeEconomics({
      costModel:
        TEST_COST_MODEL_V1,

      scenario:
        "BASE",

      side:
        "LONG",

      entryPrice:
        100,

      exitPrice:
        95,

      quantity:
        10,
    }),

    calculateTradeEconomics({
      costModel:
        TEST_COST_MODEL_V1,

      scenario:
        "BASE",

      side:
        "SHORT",

      entryPrice:
        100,

      exitPrice:
        90,

      quantity:
        10,
    }),
  ];

  const summary =
    calculateEconomicSummary({
      startingCapital:
        10000,

      trades,
    });

  assert.strictEqual(
    summary.tradeCount,
    3
  );

  assert.strictEqual(
    summary.winningTrades,
    2
  );

  assert.strictEqual(
    summary.losingTrades,
    1
  );

  assert.strictEqual(
    summary.flatTrades,
    0
  );

  almostEqual(
    summary.winRate,
    2 / 3
  );

  almostEqual(
    summary.totalEntryNotional,
    3000
  );

  almostEqual(
    summary.totalExitNotional,
    2950
  );

  almostEqual(
    summary.totalExecutionNotional,
    5950
  );

  almostEqual(
    summary.turnoverOnStartingCapital,
    0.595
  );

  /*
   * Gross:
   *
   * +100
   *  -50
   * +100
   * ----
   * +150
   */
  almostEqual(
    summary.grossPnl,
    150
  );

  /*
   * Costs:
   *
   * trade 1:
   * 2100 * 5bps = 1.05
   *
   * trade 2:
   * 1950 * 5bps = 0.975
   *
   * trade 3:
   * 1900 * 5bps = 0.95
   *
   * total = 2.975
   */
  almostEqual(
    summary.totalCosts,
    2.975
  );

  almostEqual(
    summary.netPnl,
    147.025
  );

  almostEqual(
    summary.grossReturnOnStartingCapital,
    0.015
  );

  almostEqual(
    summary.netReturnOnStartingCapital,
    0.0147025
  );

  /*
   * Gross PF:
   *
   * profits = 200
   * losses  = 50
   * PF = 4
   */
  almostEqual(
    summary.grossProfitFactor,
    4
  );

  const expectedNetProfit =
    98.95 +
    99.05;

  const expectedNetLoss =
    Math.abs(
      -50.975
    );

  almostEqual(
    summary.netProfitFactor,
    expectedNetProfit /
    expectedNetLoss
  );

  almostEqual(
    summary.grossExpectancyPerTrade,
    50
  );

  almostEqual(
    summary.netExpectancyPerTrade,
    147.025 /
    3
  );

  almostEqual(
    summary.averageWin,
    expectedNetProfit /
    2
  );

  almostEqual(
    summary.averageLoss,
    -50.975
  );

  almostEqual(
    summary.averageCostPerTrade,
    2.975 /
    3
  );

  almostEqual(
    summary.averageCostBpsOnEntryNotional,
    (
      2.975 /
      3000
    ) *
    10000
  );

  almostEqual(
    summary.aggregateBreakevenCostBps,
    (
      150 /
      3000
    ) *
    10000
  );

  const empty =
    calculateEconomicSummary({
      startingCapital:
        10000,

      trades:
        [],
    });

  assert.strictEqual(
    empty.tradeCount,
    0
  );

  assert.strictEqual(
    empty.winRate,
    null
  );

  assert.strictEqual(
    empty.netProfitFactor,
    null
  );

  console.log(
    "Economic summary test passed."
  );

  console.log({
    tradeCount:
      summary.tradeCount,

    winRate:
      summary.winRate,

    turnover:
      summary
        .turnoverOnStartingCapital,

    grossPnl:
      summary.grossPnl,

    totalCosts:
      summary.totalCosts,

    netPnl:
      summary.netPnl,

    grossProfitFactor:
      summary
        .grossProfitFactor,

    netProfitFactor:
      summary
        .netProfitFactor,

    netExpectancy:
      summary
        .netExpectancyPerTrade,

    breakevenCostBps:
      summary
        .aggregateBreakevenCostBps,
  });
};

run();