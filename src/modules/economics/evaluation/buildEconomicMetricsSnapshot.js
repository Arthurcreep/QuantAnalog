const buildRecoverySummary = (
  recovery
) => ({
  completedRecoveryCount:
    recovery
      .completedRecoveryCount,

  longestCompletedRecoveryMs:
    recovery
      .longestCompletedRecoveryMs,

  currentUnderwater:
    recovery
      .currentUnderwater,

  currentUnderwaterStartedAt:
    recovery
      .currentUnderwaterStartedAt,

  currentUnderwaterDurationMs:
    recovery
      .currentUnderwaterDurationMs,
});

const buildScenarioSnapshot = (
  scenario
) => ({
  engineVersion:
    scenario.engineVersion,

  scenario:
    scenario.scenario,

  accounting:
    scenario.accounting,

  capital:
    scenario.capital,

  trades: {
    summary:
      scenario
        .trades
        .summary,
  },

  periodic: {
    observationCount:
      scenario
        .periodic
        .observationCount,

    periodsPerYear:
      scenario
        .periodic
        .periodsPerYear,

    performance:
      scenario
        .periodic
        .performance,

    drawdown:
      scenario
        .periodic
        .drawdown,

    recovery:
      buildRecoverySummary(
        scenario
          .periodic
          .recovery
      ),
  },
});

const buildEconomicMetricsSnapshot = (
  economicRun
) => ({
  engineVersion:
    economicRun.engineVersion,

  comparison:
    economicRun.comparison,

  scenarios: {
    OPTIMISTIC:
      buildScenarioSnapshot(
        economicRun
          .scenarios
          .OPTIMISTIC
      ),

    BASE:
      buildScenarioSnapshot(
        economicRun
          .scenarios
          .BASE
      ),

    STRESS:
      buildScenarioSnapshot(
        economicRun
          .scenarios
          .STRESS
      ),
  },
});

module.exports = {
  buildEconomicMetricsSnapshot,
};