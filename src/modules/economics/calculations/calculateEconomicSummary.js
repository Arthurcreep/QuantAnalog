const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const sum = (
  values
) =>
  values.reduce(
    (
      total,
      value
    ) =>
      total +
      value,
    0
  );

const calculateProfitFactor = ({
  profits,
  losses,
}) => {
  const grossProfit =
    sum(
      profits
    );

  const grossLoss =
    Math.abs(
      sum(
        losses
      )
    );

  if (
    grossLoss ===
    0
  ) {
    return grossProfit > 0
      ? null
      : 0;
  }

  return (
    grossProfit /
    grossLoss
  );
};

const calculateEconomicSummary = ({
  startingCapital,
  trades,
}) => {
  if (
    !isFiniteNumber(
      startingCapital
    ) ||
    startingCapital <=
      0
  ) {
    throw new Error(
      "INVALID_STARTING_CAPITAL"
    );
  }

  if (
    !Array.isArray(
      trades
    )
  ) {
    throw new Error(
      "INVALID_ECONOMIC_TRADES"
    );
  }

  if (
    trades.length ===
    0
  ) {
    return {
      tradeCount:
        0,

      winningTrades:
        0,

      losingTrades:
        0,

      flatTrades:
        0,

      winRate:
        null,

      totalEntryNotional:
        0,

      totalExitNotional:
        0,

      totalExecutionNotional:
        0,

      turnoverOnStartingCapital:
        0,

      grossPnl:
        0,

      netPnl:
        0,

      totalCosts:
        0,

      grossReturnOnStartingCapital:
        0,

      netReturnOnStartingCapital:
        0,

      grossProfitFactor:
        null,

      netProfitFactor:
        null,

      grossExpectancyPerTrade:
        null,

      netExpectancyPerTrade:
        null,

      averageWin:
        null,

      averageLoss:
        null,

      averageCostPerTrade:
        null,

      averageCostBpsOnEntryNotional:
        null,

      aggregateBreakevenCostBps:
        null,
    };
  }

  const normalizedTrades =
    trades.map(
      (
        trade,
        index
      ) => {
        const requiredFields = [
          "entryNotional",
          "exitNotional",
          "grossPnl",
          "netPnl",
        ];

        for (
          const field of
          requiredFields
        ) {
          if (
            !isFiniteNumber(
              trade[field]
            )
          ) {
            throw new Error(
              `INVALID_ECONOMIC_TRADE_FIELD:${index}:${field}`
            );
          }
        }

        const totalCost =
          trade
            .costs
            ?.totalCost;

        if (
          !isFiniteNumber(
            totalCost
          )
        ) {
          throw new Error(
            `INVALID_ECONOMIC_TRADE_COST:${index}`
          );
        }

        return {
          ...trade,

          totalCost,
        };
      }
    );

  const tradeCount =
    normalizedTrades.length;

  const winningTrades =
    normalizedTrades.filter(
      (trade) =>
        trade.netPnl >
        0
    );

  const losingTrades =
    normalizedTrades.filter(
      (trade) =>
        trade.netPnl <
        0
    );

  const flatTrades =
    normalizedTrades.filter(
      (trade) =>
        trade.netPnl ===
        0
    );

  const grossProfits =
    normalizedTrades
      .filter(
        (trade) =>
          trade.grossPnl >
          0
      )
      .map(
        (trade) =>
          trade.grossPnl
      );

  const grossLosses =
    normalizedTrades
      .filter(
        (trade) =>
          trade.grossPnl <
          0
      )
      .map(
        (trade) =>
          trade.grossPnl
      );

  const netProfits =
    winningTrades.map(
      (trade) =>
        trade.netPnl
    );

  const netLosses =
    losingTrades.map(
      (trade) =>
        trade.netPnl
    );

  const totalEntryNotional =
    sum(
      normalizedTrades.map(
        (trade) =>
          trade.entryNotional
      )
    );

  const totalExitNotional =
    sum(
      normalizedTrades.map(
        (trade) =>
          trade.exitNotional
      )
    );

  const totalExecutionNotional =
    totalEntryNotional +
    totalExitNotional;

  const grossPnl =
    sum(
      normalizedTrades.map(
        (trade) =>
          trade.grossPnl
      )
    );

  const netPnl =
    sum(
      normalizedTrades.map(
        (trade) =>
          trade.netPnl
      )
    );

  const totalCosts =
    sum(
      normalizedTrades.map(
        (trade) =>
          trade.totalCost
      )
    );

  const winRate =
    winningTrades.length /
    tradeCount;

  const averageWin =
    winningTrades.length >
      0
      ? (
          sum(
            netProfits
          ) /
          winningTrades.length
        )
      : null;

  const averageLoss =
    losingTrades.length >
      0
      ? (
          sum(
            netLosses
          ) /
          losingTrades.length
        )
      : null;

  const averageCostPerTrade =
    totalCosts /
    tradeCount;

  const averageCostBpsOnEntryNotional =
    totalEntryNotional >
      0
      ? (
          totalCosts /
          totalEntryNotional
        ) *
        10000
      : null;

  const aggregateBreakevenCostBps =
    grossPnl >
      0 &&
    totalEntryNotional >
      0
      ? (
          grossPnl /
          totalEntryNotional
        ) *
        10000
      : null;

  return {
    tradeCount,

    winningTrades:
      winningTrades.length,

    losingTrades:
      losingTrades.length,

    flatTrades:
      flatTrades.length,

    winRate,

    totalEntryNotional,

    totalExitNotional,

    totalExecutionNotional,

    turnoverOnStartingCapital:
      totalExecutionNotional /
      startingCapital,

    grossPnl,

    netPnl,

    totalCosts,

    grossReturnOnStartingCapital:
      grossPnl /
      startingCapital,

    netReturnOnStartingCapital:
      netPnl /
      startingCapital,

    grossProfitFactor:
      calculateProfitFactor({
        profits:
          grossProfits,

        losses:
          grossLosses,
      }),

    netProfitFactor:
      calculateProfitFactor({
        profits:
          netProfits,

        losses:
          netLosses,
      }),

    grossExpectancyPerTrade:
      grossPnl /
      tradeCount,

    netExpectancyPerTrade:
      netPnl /
      tradeCount,

    averageWin,

    averageLoss,

    averageCostPerTrade,

    averageCostBpsOnEntryNotional,

    aggregateBreakevenCostBps,
  };
};

module.exports = {
  calculateEconomicSummary,
};