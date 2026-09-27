const {
  COST_MODEL_SCENARIOS,
  validateCostModel,
} = require(
  "../costModels/validateCostModel"
);

const BPS_DIVISOR =
  10000;

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

const calculateBpsAmount = ({
  notional,
  bps,
}) =>
  (
    notional *
    bps
  ) /
  BPS_DIVISOR;

const calculateTradeCosts = ({
  costModel,
  scenario,
  entryNotional,
  exitNotional,
  holdingPeriods = 0,
}) => {
  validateCostModel(
    costModel
  );

  if (
    !COST_MODEL_SCENARIOS.includes(
      scenario
    )
  ) {
    throw new Error(
      `UNSUPPORTED_COST_SCENARIO:${scenario}`
    );
  }

  if (
    !isFinitePositive(
      entryNotional
    )
  ) {
    throw new Error(
      "INVALID_ENTRY_NOTIONAL"
    );
  }

  if (
    !isFinitePositive(
      exitNotional
    )
  ) {
    throw new Error(
      "INVALID_EXIT_NOTIONAL"
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

  const assumptions =
    costModel
      .scenarios[
        scenario
      ];

  const executionNotional =
    entryNotional +
    exitNotional;

  const averageNotional =
    (
      entryNotional +
      exitNotional
    ) /
    2;

  const commission =
    calculateBpsAmount({
      notional:
        executionNotional,

      bps:
        assumptions
          .commissionBpsPerSide,
    });

  const spread =
    calculateBpsAmount({
      notional:
        executionNotional,

      bps:
        assumptions
          .halfSpreadBpsPerSide,
    });

  const slippage =
    calculateBpsAmount({
      notional:
        executionNotional,

      bps:
        assumptions
          .slippageBpsPerSide,
    });

  const marketImpact =
    calculateBpsAmount({
      notional:
        executionNotional,

      bps:
        assumptions
          .marketImpactBpsPerSide,
    });

  const funding =
    calculateBpsAmount({
      notional:
        averageNotional,

      bps:
        assumptions
          .fundingBpsPerHoldingPeriod *
        holdingPeriods,
    });

  const financingBorrow =
    calculateBpsAmount({
      notional:
        averageNotional,

      bps:
        assumptions
          .financingBorrowBpsPerHoldingPeriod *
        holdingPeriods,
    });

  const components = {
    commission,
    spread,
    slippage,
    marketImpact,
    funding,
    financingBorrow,
  };

  const totalCost =
    Object.values(
      components
    ).reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    );

  return {
    costModel: {
      id:
        costModel.id,

      version:
        costModel.version,
    },

    scenario,

    entryNotional,

    exitNotional,

    executionNotional,

    averageNotional,

    holdingPeriods,

    components,

    totalExecutionCost:
      commission +
      spread +
      slippage +
      marketImpact,

    totalHoldingCost:
      funding +
      financingBorrow,

    totalCost,

    totalCostBpsOnEntryNotional:
      (
        totalCost /
        entryNotional
      ) *
      BPS_DIVISOR,
  };
};

module.exports = {
  calculateTradeCosts,
};