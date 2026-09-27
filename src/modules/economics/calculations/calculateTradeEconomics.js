const {
  calculateTradeCosts,
} = require(
  "./calculateTradeCosts"
);

const SIDES = [
  "LONG",
  "SHORT",
];

const isFinitePositive = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value) &&
  value > 0;

const isFiniteNonNegative = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value) &&
  value >= 0;

const calculateTradeEconomics = ({
  costModel,
  scenario,
  side,
  entryPrice,
  exitPrice,
  quantity,
  holdingPeriods = 0,
}) => {
  if (
    !SIDES.includes(
      side
    )
  ) {
    throw new Error(
      `UNSUPPORTED_TRADE_SIDE:${side}`
    );
  }

  if (
    !isFinitePositive(
      entryPrice
    )
  ) {
    throw new Error(
      "INVALID_ENTRY_PRICE"
    );
  }

  if (
    !isFinitePositive(
      exitPrice
    )
  ) {
    throw new Error(
      "INVALID_EXIT_PRICE"
    );
  }

  if (
    !isFinitePositive(
      quantity
    )
  ) {
    throw new Error(
      "INVALID_TRADE_QUANTITY"
    );
  }

  if (
    !isFiniteNonNegative(
      holdingPeriods
    )
  ) {
    throw new Error(
      "INVALID_HOLDING_PERIODS"
    );
  }

  const entryNotional =
    entryPrice *
    quantity;

  const exitNotional =
    exitPrice *
    quantity;

  const grossPnl =
    side ===
      "LONG"
      ? (
          exitPrice -
          entryPrice
        ) *
        quantity
      : (
          entryPrice -
          exitPrice
        ) *
        quantity;

  const costs =
    calculateTradeCosts({
      costModel,

      scenario,

      entryNotional,

      exitNotional,

      holdingPeriods,
    });

  const netPnl =
    grossPnl -
    costs.totalCost;

  const grossReturn =
    grossPnl /
    entryNotional;

  const netReturn =
    netPnl /
    entryNotional;

  const breakevenCostBps =
    grossPnl > 0
      ? (
          grossPnl /
          entryNotional
        ) *
        10000
      : null;

  return {
    side,

    entryPrice,

    exitPrice,

    quantity,

    entryNotional,

    exitNotional,

    holdingPeriods,

    grossPnl,

    netPnl,

    grossReturn,

    netReturn,

    grossReturnBps:
      grossReturn *
      10000,

    netReturnBps:
      netReturn *
      10000,

    profitableBeforeCosts:
      grossPnl > 0,

    profitableAfterCosts:
      netPnl > 0,

    breakevenCostBps,

    costs,
  };
};

module.exports = {
  calculateTradeEconomics,
};