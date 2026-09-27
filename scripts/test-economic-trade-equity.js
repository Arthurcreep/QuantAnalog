const assert = require(
  "assert"
);

const {
  calculateTradeEconomics,
} = require(
  "../src/modules/economics/calculations/calculateTradeEconomics"
);

const {
  calculateEquityCurve,
} = require(
  "../src/modules/economics/calculations/calculateEquityCurve"
);

const {
  calculateDrawdown,
} = require(
  "../src/modules/economics/calculations/calculateDrawdown"
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
  const longTrade =
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

      holdingPeriods:
        0,
    });

  almostEqual(
    longTrade
      .entryNotional,
    1000
  );

  almostEqual(
    longTrade
      .exitNotional,
    1100
  );

  almostEqual(
    longTrade
      .grossPnl,
    100
  );

  almostEqual(
    longTrade
      .costs
      .totalCost,
    1.05
  );

  almostEqual(
    longTrade
      .netPnl,
    98.95
  );

  almostEqual(
    longTrade
      .grossReturn,
    0.1
  );

  almostEqual(
    longTrade
      .netReturn,
    0.09895
  );

  almostEqual(
    longTrade
      .breakevenCostBps,
    1000
  );

  assert.strictEqual(
    longTrade
      .profitableBeforeCosts,
    true
  );

  assert.strictEqual(
    longTrade
      .profitableAfterCosts,
    true
  );

  const shortTrade =
    calculateTradeEconomics({
      costModel:
        TEST_COST_MODEL_V1,

      scenario:
        "OPTIMISTIC",

      side:
        "SHORT",

      entryPrice:
        100,

      exitPrice:
        90,

      quantity:
        5,

      holdingPeriods:
        0,
    });

  almostEqual(
    shortTrade
      .grossPnl,
    50
  );

  almostEqual(
    shortTrade
      .netPnl,
    50
  );

  const losingTrade =
    calculateTradeEconomics({
      costModel:
        TEST_COST_MODEL_V1,

      scenario:
        "OPTIMISTIC",

      side:
        "LONG",

      entryPrice:
        100,

      exitPrice:
        95,

      quantity:
        1,

      holdingPeriods:
        0,
    });

  almostEqual(
    losingTrade
      .netPnl,
    -5
  );

  assert.strictEqual(
    losingTrade
      .breakevenCostBps,
    null
  );

  const syntheticTrades = [
    {
      exitTimestamp:
        "2026-01-01T01:00:00.000Z",

      netPnl:
        10,
    },

    {
      exitTimestamp:
        "2026-01-01T02:00:00.000Z",

      netPnl:
        -5,
    },

    {
      exitTimestamp:
        "2026-01-01T03:00:00.000Z",

      netPnl:
        10,
    },
  ];

  const equityCurve =
    calculateEquityCurve({
      startingCapital:
        1000,

      trades:
        syntheticTrades,
    });

  assert.strictEqual(
    equityCurve.length,
    3
  );

  almostEqual(
    equityCurve[0]
      .equityAfter,
    1010
  );

  almostEqual(
    equityCurve[1]
      .equityAfter,
    1005
  );

  almostEqual(
    equityCurve[2]
      .equityAfter,
    1015
  );

  const drawdown =
    calculateDrawdown({
      startingCapital:
        1000,

      equityCurve,
    });

  almostEqual(
    drawdown
      .maxDrawdownAmount,
    -5
  );

  almostEqual(
    drawdown
      .maxDrawdown,
    -5 / 1010
  );

  assert.strictEqual(
    drawdown
      .troughIndex,
    1
  );

  console.log(
    "Economic trade/equity test passed."
  );

  console.log({
    longGrossPnl:
      longTrade.grossPnl,

    longCosts:
      longTrade
        .costs
        .totalCost,

    longNetPnl:
      longTrade.netPnl,

    shortNetPnl:
      shortTrade.netPnl,

    endingEquity:
      equityCurve[
        equityCurve.length -
        1
      ].equityAfter,

    maxDrawdown:
      drawdown.maxDrawdown,

    maxDrawdownAmount:
      drawdown
        .maxDrawdownAmount,
  });
};

run();