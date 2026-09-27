const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const RECONCILIATION_TOLERANCE =
  1e-8;

const almostEqual = (
  left,
  right
) => {
  const scale =
    Math.max(
      1,
      Math.abs(left),
      Math.abs(right)
    );

  return (
    Math.abs(
      left -
      right
    ) <=
    RECONCILIATION_TOLERANCE *
    scale
  );
};

const parseTimestamp = ({
  value,
  field,
}) => {
  const timestampMs =
    new Date(
      value
    ).getTime();

  if (
    !Number.isFinite(
      timestampMs
    )
  ) {
    throw new Error(
      `INVALID_PERIODIC_TIMESTAMP:${field}`
    );
  }

  return timestampMs;
};

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

const buildScenarioPeriodicPnlSeries = ({
  grossPnlSeries,
  evaluatedTrades,
}) => {
  if (
    !Array.isArray(
      grossPnlSeries
    ) ||
    grossPnlSeries.length ===
      0
  ) {
    throw new Error(
      "EMPTY_PERIODIC_GROSS_PNL_SERIES"
    );
  }

  if (
    !Array.isArray(
      evaluatedTrades
    )
  ) {
    throw new Error(
      "INVALID_EVALUATED_TRADES"
    );
  }

  let previousTimestampMs =
    null;

  const periods =
    grossPnlSeries.map(
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
            `INVALID_PERIODIC_GROSS_PNL_POINT:${index}`
          );
        }

        if (
          !isFiniteNumber(
            period.grossPnl
          )
        ) {
          throw new Error(
            `INVALID_PERIODIC_GROSS_PNL:${index}`
          );
        }

        const timestampMs =
          parseTimestamp({
            value:
              period.timestamp,

            field:
              index,
          });

        if (
          previousTimestampMs !==
            null &&
          timestampMs <=
            previousTimestampMs
        ) {
          throw new Error(
            `NON_CHRONOLOGICAL_PERIODIC_GROSS_PNL:${index}`
          );
        }

        previousTimestampMs =
          timestampMs;

        return {
          timestamp:
            period.timestamp,

          timestampMs,

          grossPnl:
            period.grossPnl,

          costs:
            0,

          netPnl:
            period.grossPnl,
        };
      }
    );

  const periodByTimestamp =
    new Map(
      periods.map(
        (period) => [
          period.timestampMs,
          period,
        ]
      )
    );

  for (
    let index = 0;
    index <
    evaluatedTrades.length;
    index += 1
  ) {
    const trade =
      evaluatedTrades[
        index
      ];

    if (
      !isFiniteNumber(
        trade.grossPnl
      )
    ) {
      throw new Error(
        `INVALID_EVALUATED_TRADE_GROSS_PNL:${index}`
      );
    }

    if (
      !isFiniteNumber(
        trade
          .costs
          ?.totalCost
      )
    ) {
      throw new Error(
        `INVALID_EVALUATED_TRADE_COST:${index}`
      );
    }

    const exitTimestampMs =
      parseTimestamp({
        value:
          trade.exitTimestamp,

        field:
          `TRADE_EXIT_${index}`,
      });

    const exitPeriod =
      periodByTimestamp.get(
        exitTimestampMs
      );

    if (!exitPeriod) {
      throw new Error(
        `TRADE_EXIT_OUTSIDE_PERIODIC_SERIES:${index}`
      );
    }

    exitPeriod.costs +=
      trade
        .costs
        .totalCost;

    exitPeriod.netPnl =
      exitPeriod.grossPnl -
      exitPeriod.costs;
  }

  const periodicGrossPnl =
    sum(
      periods.map(
        (period) =>
          period.grossPnl
      )
    );

  const periodicCosts =
    sum(
      periods.map(
        (period) =>
          period.costs
      )
    );

  const periodicNetPnl =
    sum(
      periods.map(
        (period) =>
          period.netPnl
      )
    );

  const tradeGrossPnl =
    sum(
      evaluatedTrades.map(
        (trade) =>
          trade.grossPnl
      )
    );

  const tradeCosts =
    sum(
      evaluatedTrades.map(
        (trade) =>
          trade
            .costs
            .totalCost
      )
    );

  const tradeNetPnl =
    sum(
      evaluatedTrades.map(
        (trade) =>
          trade.netPnl
      )
    );

  const reconciliation = {
    periodicGrossPnl,

    tradeGrossPnl,

    periodicCosts,

    tradeCosts,

    periodicNetPnl,

    tradeNetPnl,

    grossPnlMatches:
      almostEqual(
        periodicGrossPnl,
        tradeGrossPnl
      ),

    costsMatch:
      almostEqual(
        periodicCosts,
        tradeCosts
      ),

    netPnlMatches:
      almostEqual(
        periodicNetPnl,
        tradeNetPnl
      ),
  };

  reconciliation.passed =
    reconciliation
      .grossPnlMatches &&
    reconciliation
      .costsMatch &&
    reconciliation
      .netPnlMatches;

  return {
    costBookingPolicy:
      "ALL_TRADE_COSTS_AT_EXIT",

    periods:
      periods.map(
        (period) => ({
          timestamp:
            period.timestamp,

          grossPnl:
            period.grossPnl,

          costs:
            period.costs,

          netPnl:
            period.netPnl,
        })
      ),

    reconciliation,
  };
};

module.exports = {
  buildScenarioPeriodicPnlSeries,
};