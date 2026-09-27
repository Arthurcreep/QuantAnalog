const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const calculateEquityCurve = ({
  startingCapital,
  trades,
}) => {
  if (
    !isFiniteNumber(
      startingCapital
    ) ||
    startingCapital <= 0
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

  let equity =
    startingCapital;

  let cumulativeNetPnl =
    0;

  let peakEquity =
    startingCapital;

  return trades.map(
    (
      trade,
      index
    ) => {
      if (
        !isFiniteNumber(
          trade.netPnl
        )
      ) {
        throw new Error(
          `INVALID_TRADE_NET_PNL:${index}`
        );
      }

      const equityBefore =
        equity;

      cumulativeNetPnl +=
        trade.netPnl;

      equity =
        startingCapital +
        cumulativeNetPnl;

      peakEquity =
        Math.max(
          peakEquity,
          equity
        );

      const drawdownAmount =
        equity -
        peakEquity;

      const drawdown =
        peakEquity > 0
          ? drawdownAmount /
            peakEquity
          : null;

      return {
        index,

        timestamp:
          trade.exitTimestamp ||
          trade.timestamp ||
          null,

        equityBefore,

        netPnl:
          trade.netPnl,

        cumulativeNetPnl,

        equityAfter:
          equity,

        peakEquity,

        drawdownAmount,

        drawdown,
      };
    }
  );
};

module.exports = {
  calculateEquityCurve,
};