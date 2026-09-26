const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  planInstrumentResearch,
} = require(
  "../src/modules/research/planning/planInstrumentResearch.service"
);

const run = async () => {
  try {
    await sequelize.authenticate();

    const result =
      await planInstrumentResearch({
        venue:
          "BYBIT",

        instrument:
          "BTCUSDT",

        marketType:
          "LINEAR",
      });

    assert.ok(
      result
        .capabilities
        .available
        .includes(
          "CANDLES"
        )
    );

    assert.ok(
      result
        .capabilities
        .available
        .includes(
          "TIMESTAMP"
        )
    );

    assert.ok(
      result
        .acquirableData
        .includes(
          "CANDLES"
        )
    );

    assert.ok(
      result
        .acquirableData
        .includes(
          "FUNDING"
        )
    );

    assert.ok(
      result
        .acquirableData
        .includes(
          "OPEN_INTEREST"
        )
    );

    assert.strictEqual(
      result
        .plan
        .summary
        .total,
      16
    );

    assert.strictEqual(
      result
        .plan
        .summary
        .RUNNABLE,
      3
    );

    assert.deepStrictEqual(
      new Set(
        result
          .plan
          .acquisitionCapabilities
      ),
      new Set([
        "FUNDING",
        "OPEN_INTEREST",
        "MULTI_ASSET_CANDLES",
      ])
    );

    console.log(
      "Instrument research planner test passed."
    );

    console.log(
      "\n===== INSTRUMENT ====="
    );

    console.log(
      result.instrumentContext
    );

    console.log(
      "\n===== RESOLVED DATA ====="
    );

    console.log({
      available:
        result
          .capabilities
          .available,

      sourceAcquirable:
        result
          .acquirableData,

      researchReadyDatasets:
        result
          .capabilities
          .researchReadyDatasetCount,
    });

    console.log(
      "\n===== RESEARCH PLAN ====="
    );

    console.log(
      result.plan.summary
    );

    console.log(
      "\n===== REQUIRED ACQUISITION ====="
    );

    console.log(
      result
        .plan
        .acquisitionCapabilities
    );

    console.log(
      "\n===== RUNNABLE NOW ====="
    );

    console.table(
      result
        .plan
        .runnable
        .map(
          (item) => ({
            Hypothesis:
              item.hypothesisId,

            Family:
              item.family,

            Executor:
              item
                .execution
                .executor,

            Protocol:
              item
                .execution
                .protocol,
          })
        )
    );

    console.log(
      "\n===== FULL PLAN ====="
    );

    console.table(
      result
        .plan
        .items
        .map(
          (item) => ({
            Hypothesis:
              item.hypothesisId,

            Family:
              item.family,

            Plan:
              item.planStatus,

            Data:
              item.dataStatus,

            Execution:
              item.executionStatus,

            Missing:
              item
                .missingData
                .join(", "),
          })
        )
    );
  } catch (error) {
    console.error(
      "Instrument research planner test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();