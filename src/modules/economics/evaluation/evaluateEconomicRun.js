const crypto = require(
  "crypto"
);

const {
  COST_MODEL_SCENARIOS,
  validateCostModel,
} = require(
  "../costModels/validateCostModel"
);

const {
  validateDecisionRule,
} = require(
  "../rules/validateDecisionRule"
);

const {
  evaluateEconomicScenario,
} = require(
  "./evaluateEconomicScenario"
);

const ENGINE_VERSION =
  "economic-run-v1.0";

const hashObject = (
  value
) =>
  crypto
    .createHash(
      "sha256"
    )
    .update(
      JSON.stringify(
        value
      )
    )
    .digest(
      "hex"
    );

const isFinitePositive = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value) &&
  value > 0;

const evaluateEconomicRun = ({
  costModel,
  decisionRule,
  startingCapital,
  startTimestamp,
  periodsPerYear,
  trades,
  grossPnlSeries,
  riskFreeRatePerPeriod = 0,
  minimumAcceptableReturnPerPeriod = 0,
}) => {
  validateCostModel(
    costModel
  );

  validateDecisionRule(
    decisionRule
  );

  if (
    !isFinitePositive(
      startingCapital
    )
  ) {
    throw new Error(
      "INVALID_STARTING_CAPITAL"
    );
  }

  const costModelChecksum =
    hashObject(
      costModel
    );

  const decisionRuleChecksum =
    hashObject(
      decisionRule
    );

  const scenarios = {};

  for (
    const scenario of
    COST_MODEL_SCENARIOS
  ) {
    scenarios[
      scenario
    ] =
      evaluateEconomicScenario({
        costModel,

        scenario,

        startingCapital,

        startTimestamp,

        periodsPerYear,

        trades,

        grossPnlSeries,

        riskFreeRatePerPeriod,

        minimumAcceptableReturnPerPeriod,
      });
  }

  const optimistic =
    scenarios.OPTIMISTIC;

  const base =
    scenarios.BASE;

  const stress =
    scenarios.STRESS;

  return {
    engineVersion:
      ENGINE_VERSION,

    decisionRule: {
      id:
        decisionRule.id,

      version:
        decisionRule.version,

      checksum:
        decisionRuleChecksum,

      inputMode:
        decisionRule.inputMode,

      positionMode:
        decisionRule.positionMode,
    },

    costModel: {
      id:
        costModel.id,

      version:
        costModel.version,

      checksum:
        costModelChecksum,
    },

    capital: {
      startingCapital,
    },

    time: {
      startTimestamp,

      periodsPerYear,
    },

    scenarios,

    comparison: {
      optimisticNetPnl:
        optimistic
          .trades
          .summary
          .netPnl,

      baseNetPnl:
        base
          .trades
          .summary
          .netPnl,

      stressNetPnl:
        stress
          .trades
          .summary
          .netPnl,

      optimisticTotalCosts:
        optimistic
          .trades
          .summary
          .totalCosts,

      baseTotalCosts:
        base
          .trades
          .summary
          .totalCosts,

      stressTotalCosts:
        stress
          .trades
          .summary
          .totalCosts,

      profitableAfterCosts: {
        OPTIMISTIC:
          optimistic
            .trades
            .summary
            .netPnl >
          0,

        BASE:
          base
            .trades
            .summary
            .netPnl >
          0,

        STRESS:
          stress
            .trades
            .summary
            .netPnl >
          0,
      },

      survivesBaseCosts:
        base
          .trades
          .summary
          .netPnl >
        0,

      survivesStressCosts:
        stress
          .trades
          .summary
          .netPnl >
        0,
    },
  };
};

module.exports = {
  ENGINE_VERSION,
  evaluateEconomicRun,
};