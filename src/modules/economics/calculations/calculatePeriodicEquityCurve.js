const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const calculatePeriodicEquityCurve = ({
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
    )
  ) {
    throw new Error(
      "INVALID_PERIODIC_ECONOMIC_SERIES"
    );
  }

  let equity =
    startingCapital;

  let previousTimestampMs =
    null;

  return periods.map(
    (
      period,
      index
    ) => {
      if (
        !period ||
        typeof period !==
          "object"
      ) {
        throw new Error(
          `INVALID_PERIODIC_ECONOMIC_POINT:${index}`
        );
      }

      if (
        !isFiniteNumber(
          period.netReturn
        ) ||
        period.netReturn <
          -1
      ) {
        throw new Error(
          `INVALID_PERIODIC_NET_RETURN:${index}`
        );
      }

      const timestampMs =
        new Date(
          period.timestamp
        ).getTime();

      if (
        !Number.isFinite(
          timestampMs
        )
      ) {
        throw new Error(
          `INVALID_PERIODIC_TIMESTAMP:${index}`
        );
      }

      if (
        previousTimestampMs !==
          null &&
        timestampMs <=
          previousTimestampMs
      ) {
        throw new Error(
          `NON_CHRONOLOGICAL_PERIODIC_SERIES:${index}`
        );
      }

      const equityBefore =
        equity;

      equity *=
        1 +
        period.netReturn;

      const pnl =
        equity -
        equityBefore;

      previousTimestampMs =
        timestampMs;

      return {
        index,

        timestamp:
          period.timestamp,

        netReturn:
          period.netReturn,

        equityBefore,

        pnl,

        equityAfter:
          equity,
      };
    }
  );
};

module.exports = {
  calculatePeriodicEquityCurve,
};