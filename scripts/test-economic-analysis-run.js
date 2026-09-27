const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  findAnalysisRunById,
} = require(
  "../src/modules/research/runs/analysisRun.repository"
);

const {
  runEconomicEvaluation,
} = require(
  "../src/modules/economics/services/runEconomicEvaluation.service"
);

const TEST_DECISION_RULE_V1 = {
  id:
    "TEST_PERSISTED_DIRECTIONAL_RULE",

  version:
    "1.0.0",

  status:
    "FROZEN",

  inputMode:
    "PRECOMPUTED_EXECUTION_SERIES",

  positionMode:
    "LONG_ONLY",
};

const TEST_COST_MODEL_V1 = {
  id:
    "TEST_PERSISTED_COST_MODEL",

  version:
    "1.0.0",

  status:
    "FROZEN",

  unit:
    "BPS",

  scenarios: {
    OPTIMISTIC: {
      commissionBpsPerSide:
        0,

      halfSpreadBpsPerSide:
        0,

      slippageBpsPerSide:
        0,

      marketImpactBpsPerSide:
        0,

      fundingBpsPerHoldingPeriod:
        0,

      financingBorrowBpsPerHoldingPeriod:
        0,
    },

    BASE: {
      commissionBpsPerSide:
        5,

      halfSpreadBpsPerSide:
        1,

      slippageBpsPerSide:
        1,

      marketImpactBpsPerSide:
        0.5,

      fundingBpsPerHoldingPeriod:
        0,

      financingBorrowBpsPerHoldingPeriod:
        0,
    },

    STRESS: {
      commissionBpsPerSide:
        10,

      halfSpreadBpsPerSide:
        2,

      slippageBpsPerSide:
        4,

      marketImpactBpsPerSide:
        2,

      fundingBpsPerHoldingPeriod:
        0,

      financingBorrowBpsPerHoldingPeriod:
        0,
    },
  },
};

const run = async () => {
  const sourceAnalysisRunId =
    process.argv[2];

  if (!sourceAnalysisRunId) {
    throw new Error(
      "SOURCE_ANALYSIS_RUN_ID_REQUIRED"
    );
  }

  let transaction;

  try {
    await sequelize.authenticate();

    transaction =
      await sequelize.transaction();

    const result =
      await runEconomicEvaluation(
        {
          sourceAnalysisRunId,

          costModel:
            TEST_COST_MODEL_V1,

          decisionRule:
            TEST_DECISION_RULE_V1,

          startingCapital:
            10000,

          startTimestamp:
            "2026-01-01T00:00:00.000Z",

          periodsPerYear:
            4,

          trades: [
            {
              tradeId:
                "T1",

              side:
                "LONG",

              entryPrice:
                100,

              exitPrice:
                105,

              quantity:
                10,

              holdingPeriods:
                2,

              entryTimestamp:
                "2026-01-01T00:00:00.000Z",

              exitTimestamp:
                "2026-01-01T02:00:00.000Z",
            },

            {
              tradeId:
                "T2",

              side:
                "LONG",

              entryPrice:
                105,

              exitPrice:
                103,

              quantity:
                10,

              holdingPeriods:
                2,

              entryTimestamp:
                "2026-01-01T02:00:00.000Z",

              exitTimestamp:
                "2026-01-01T04:00:00.000Z",
            },
          ],

          grossPnlSeries: [
            {
              timestamp:
                "2026-01-01T01:00:00.000Z",

              grossPnl:
                20,
            },

            {
              timestamp:
                "2026-01-01T02:00:00.000Z",

              grossPnl:
                30,
            },

            {
              timestamp:
                "2026-01-01T03:00:00.000Z",

              grossPnl:
                -15,
            },

            {
              timestamp:
                "2026-01-01T04:00:00.000Z",

              grossPnl:
                -5,
            },
          ],
        },
        {
          transaction,
        }
      );

    const stored =
      await findAnalysisRunById(
        result.analysisRunId,
        {
          transaction,
        }
      );

    assert.ok(
      stored,
      "ECONOMIC_ANALYSIS_RUN_NOT_STORED"
    );

    assert.strictEqual(
      stored.runType,
      "ECONOMIC_EVALUATION"
    );

    assert.strictEqual(
      stored.engineVersion,
      "economic-run-v1.0"
    );

    assert.strictEqual(
      stored
        .config
        .sourceAnalysisRun
        .id,
      sourceAnalysisRunId
    );

    assert.strictEqual(
      stored
        .config
        .decisionRuleChecksum
        .length,
      64
    );

    assert.strictEqual(
      stored
        .config
        .costModelChecksum
        .length,
      64
    );

    assert.strictEqual(
      stored
        .config
        .executionInput
        .checksum
        .length,
      64
    );

    assert.strictEqual(
      stored
        .config
        .executionInput
        .persistence,
      "INLINE_JSONB_V1"
    );

    assert.strictEqual(
      stored
        .config
        .executionInput
        .payload
        .trades
        .length,
      2
    );

    assert.strictEqual(
      stored
        .metrics
        .scenarios
        .BASE
        .accounting
        .reconciliation
        .passed,
      true
    );

    assert.strictEqual(
      stored
        .metrics
        .scenarios
        .STRESS
        .accounting
        .reconciliation
        .passed,
      true
    );

    assert.strictEqual(
      stored
        .metrics
        .comparison
        .survivesBaseCosts,
      true
    );

    assert.strictEqual(
      stored
        .metrics
        .comparison
        .survivesStressCosts,
      true
    );

    assert.strictEqual(
      stored
        .metrics
        .scenarios
        .BASE
        .periodic
        .equityCurve,
      undefined
    );

    assert.strictEqual(
      stored
        .metrics
        .scenarios
        .BASE
        .trades
        .results,
      undefined
    );

    console.log(
      "Economic AnalysisRun persistence test passed."
    );

    console.log({
      analysisRunId:
        result.analysisRunId,

      sourceAnalysisRunId:
        result.sourceAnalysisRunId,

      datasetId:
        result.datasetId,

      runType:
        result.runType,

      engineVersion:
        result.engineVersion,

      decisionRuleChecksum:
        result
          .decisionRuleChecksum,

      costModelChecksum:
        result
          .costModelChecksum,

      executionInputChecksum:
        result
          .executionInputChecksum,

      baseNetPnl:
        result
          .metrics
          .scenarios
          .BASE
          .trades
          .summary
          .netPnl,

      stressNetPnl:
        result
          .metrics
          .scenarios
          .STRESS
          .trades
          .summary
          .netPnl,

      persistence:
        stored
          .config
          .executionInput
          .persistence,
    });
  } catch (error) {
    console.error(
      "Economic AnalysisRun persistence test failed:",
      error
    );

    process.exitCode =
      1;
  } finally {
    if (transaction) {
      await transaction.rollback();
    }

    await sequelize.close();
  }
};

run();