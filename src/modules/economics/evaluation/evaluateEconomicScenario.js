const {
  calculateTradeEconomics,
} = require(
  "../calculations/calculateTradeEconomics"
);

const {
  calculateEconomicSummary,
} = require(
  "../calculations/calculateEconomicSummary"
);

const {
  buildScenarioPeriodicPnlSeries,
} = require(
  "../calculations/buildScenarioPeriodicPnlSeries"
);

const {
  buildPeriodicReturnsFromPnl,
} = require(
  "../calculations/buildPeriodicReturnsFromPnl"
);

const {
  calculatePeriodicEquityCurve,
} = require(
  "../calculations/calculatePeriodicEquityCurve"
);

const {
  calculateDrawdown,
} = require(
  "../calculations/calculateDrawdown"
);

const {
  calculatePeriodicPerformanceMetrics,
} = require(
  "../calculations/calculatePeriodicPerformanceMetrics"
);

const {
  calculateCalmarRatio,
} = require(
  "../calculations/calculateCalmarRatio"
);

const {
  calculateRecoveryStats,
} = require(
  "../calculations/calculateRecoveryStats"
);

const ENGINE_VERSION =
  "economic-scenario-v1.1";

const isFinitePositive = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value) &&
  value > 0;

const evaluateTrades = ({
  trades,
  costModel,
  scenario,
}) => {
  if (
    !Array.isArray(
      trades
    )
  ) {
    throw new Error(
      "INVALID_ECONOMIC_TRADES"
    );
  }

  return trades.map(
    (
      trade,
      index
    ) => {
      const economics =
        calculateTradeEconomics({
          costModel,

          scenario,

          side:
            trade.side,

          entryPrice:
            trade.entryPrice,

          exitPrice:
            trade.exitPrice,

          quantity:
            trade.quantity,

          holdingPeriods:
            trade.holdingPeriods ??
            0,
        });

      return {
        ...economics,

        tradeId:
          trade.tradeId ??
          `${scenario}_${index}`,

        entryTimestamp:
          trade.entryTimestamp ??
          null,

        exitTimestamp:
          trade.exitTimestamp ??
          null,
      };
    }
  );
};

const evaluateEconomicScenario = ({
  costModel,
  scenario,
  startingCapital,
  startTimestamp,
  periodsPerYear,
  trades,
  grossPnlSeries,
  riskFreeRatePerPeriod = 0,
  minimumAcceptableReturnPerPeriod = 0,
}) => {
  if (
    !isFinitePositive(
      startingCapital
    )
  ) {
    throw new Error(
      "INVALID_STARTING_CAPITAL"
    );
  }

  const evaluatedTrades =
    evaluateTrades({
      trades,

      costModel,

      scenario,
    });

  const tradeSummary =
    calculateEconomicSummary({
      startingCapital,

      trades:
        evaluatedTrades,
    });

  const periodicPnl =
    buildScenarioPeriodicPnlSeries({
      grossPnlSeries,

      evaluatedTrades,
    });

  if (
    !periodicPnl
      .reconciliation
      .passed
  ) {
    throw new Error(
      "ECONOMIC_RECONCILIATION_FAILED"
    );
  }

  const periodicSeries =
    buildPeriodicReturnsFromPnl({
      startingCapital,

      periods:
        periodicPnl
          .periods,
    });

  const periodicEquityCurve =
    calculatePeriodicEquityCurve({
      startingCapital,

      periods:
        periodicSeries.map(
          (period) => ({
            timestamp:
              period.timestamp,

            netReturn:
              period.netReturn,
          })
        ),
    });

  const drawdown =
    calculateDrawdown({
      startingCapital,

      equityCurve:
        periodicEquityCurve,
    });

  const periodicPerformance =
    calculatePeriodicPerformanceMetrics({
      returns:
        periodicSeries.map(
          (period) =>
            period.netReturn
        ),

      periodsPerYear,

      riskFreeRatePerPeriod,

      minimumAcceptableReturnPerPeriod,
    });

  const calmarRatio =
    calculateCalmarRatio({
      annualizedReturn:
        periodicPerformance
          .annualizedReturn,

      maxDrawdown:
        drawdown
          .maxDrawdown,
    });

  const recovery =
    calculateRecoveryStats({
      startingCapital,

      startTimestamp,

      equityCurve:
        periodicEquityCurve,
    });

  const endingEquity =
    periodicEquityCurve[
      periodicEquityCurve.length -
      1
    ].equityAfter;

  const expectedEndingEquity =
    startingCapital +
    tradeSummary.netPnl;

  const reconciliation =
    periodicPnl
      .reconciliation;

  reconciliation
    .endingEquityMatches =
    Math.abs(
      endingEquity -
      expectedEndingEquity
    ) <=
    1e-8 *
    Math.max(
      1,
      Math.abs(
        endingEquity
      ),
      Math.abs(
        expectedEndingEquity
      )
    );

  reconciliation.passed =
    reconciliation.passed &&
    reconciliation
      .endingEquityMatches;

  if (
    !reconciliation.passed
  ) {
    throw new Error(
      "ECONOMIC_ENDING_EQUITY_RECONCILIATION_FAILED"
    );
  }

  return {
    engineVersion:
      ENGINE_VERSION,

    scenario,

    costModel: {
      id:
        costModel.id,

      version:
        costModel.version,
    },

    accounting: {
      costBookingPolicy:
        periodicPnl
          .costBookingPolicy,

      reconciliation,
    },

    capital: {
      startingCapital,

      endingEquity,

      expectedEndingEquity,

      netChange:
        endingEquity -
        startingCapital,

      netReturn:
        (
          endingEquity /
          startingCapital
        ) -
        1,
    },

    trades: {
      results:
        evaluatedTrades,

      summary:
        tradeSummary,
    },

    periodic: {
      observationCount:
        periodicSeries
          .length,

      periodsPerYear,

      series:
        periodicSeries,

      performance:
        periodicPerformance,

      drawdown: {
        ...drawdown,

        calmarRatio,
      },

      recovery,

      equityCurve:
        periodicEquityCurve,
    },
  };
};

module.exports = {
  ENGINE_VERSION,
  evaluateEconomicScenario,
};