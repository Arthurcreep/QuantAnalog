const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const buildPeriodicReturnsFromPnl = ({
  startingCapital,
  periods,
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
      periods
    ) ||
    periods.length ===
      0
  ) {
    throw new Error(
      "EMPTY_PERIODIC_PNL_SERIES"
    );
  }

  let equity =
    startingCapital;

  return periods.map(
    (
      period,
      index
    ) => {
      if (
        !isFiniteNumber(
          period.netPnl
        )
      ) {
        throw new Error(
          `INVALID_PERIODIC_NET_PNL:${index}`
        );
      }

      if (
        equity <=
        0
      ) {
        throw new Error(
          `ECONOMIC_CAPITAL_DEPLETED:${index}`
        );
      }

      const equityBefore =
        equity;

      const netReturn =
        period.netPnl /
        equityBefore;

      equity =
        equityBefore +
        period.netPnl;

      if (
        equity <=
        0
      ) {
        throw new Error(
          `ECONOMIC_CAPITAL_DEPLETED:${index}`
        );
      }

      return {
        timestamp:
          period.timestamp,

        grossPnl:
          period.grossPnl,

        costs:
          period.costs,

        netPnl:
          period.netPnl,

        equityBefore,

        netReturn,

        equityAfter:
          equity,
      };
    }
  );
};

module.exports = {
  buildPeriodicReturnsFromPnl,
};