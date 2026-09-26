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

const {
  bindResearchPlanDatasets,
} = require(
  "../src/modules/research/planning/bindResearchPlanDatasets"
);

const findBinding = (
  items,
  hypothesisId
) =>
  items.find(
    (item) =>
      item.hypothesisId ===
      hypothesisId
  );

const run = async () => {
  try {
    await sequelize.authenticate();

    const research =
      await planInstrumentResearch({
        venue:
          "BYBIT",

        instrument:
          "BTCUSDT",

        marketType:
          "LINEAR",
      });

    const binding =
      bindResearchPlanDatasets({
        plan:
          research.plan,

        capabilities:
          research.capabilities,
      });

    assert.strictEqual(
      binding.summary.total,
      3
    );

    assert.strictEqual(
      binding.summary.BOUND,
      3
    );

    assert.strictEqual(
      binding
        .summary
        .MISSING_DATASET,
      0
    );

    assert.strictEqual(
      binding
        .summary
        .INVALID_BINDING,
      0
    );

    assert.strictEqual(
      binding.allBound,
      true
    );

    const volatility =
      findBinding(
        binding.items,
        "H_VOL_001"
      );

    const hour =
      findBinding(
        binding.items,
        "H_CAL_001"
      );

    const weekday =
      findBinding(
        binding.items,
        "H_CAL_002"
      );

    assert.strictEqual(
      volatility
        .datasets
        .length,
      5
    );

    assert.deepStrictEqual(
      volatility
        .datasets
        .map(
          (dataset) =>
            dataset
              .sourceTimeframe
        ),
      [
        "5m",
        "15m",
        "1h",
        "4h",
        "1d",
      ]
    );

    assert.strictEqual(
      hour.datasets.length,
      1
    );

    assert.strictEqual(
      hour
        .datasets[0]
        .sourceTimeframe,
      "1h"
    );

    assert.strictEqual(
      weekday.datasets.length,
      1
    );

    assert.strictEqual(
      weekday
        .datasets[0]
        .sourceTimeframe,
      "1h"
    );

    assert.strictEqual(
      hour.datasets[0].id,
      weekday.datasets[0].id
    );

    console.log(
      "Research dataset binding test passed."
    );

    console.log(
      "\n===== BINDING SUMMARY ====="
    );

    console.log(
      binding.summary
    );

    console.log(
      "\n===== DATASET BINDINGS ====="
    );

    for (
      const item of
      binding.items
    ) {
      console.log(
        `\n${item.hypothesisId}`
      );

      console.log({
        executor:
          item.executor,

        protocol:
          item.protocol,

        status:
          item.bindingStatus,

        datasets:
          item.datasets.map(
            (dataset) => ({
              id:
                dataset.id,

              timeframe:
                dataset
                  .sourceTimeframe,

              stage:
                dataset.stage,

              qualityStatus:
                dataset
                  .qualityStatus,

              rowCount:
                dataset
                  .rowCount,
            })
          ),
      });
    }

    console.log(
      "\n===== EXECUTION VIEW ====="
    );

    console.table(
      binding.items.flatMap(
        (item) =>
          item.datasets.map(
            (dataset) => ({
              Hypothesis:
                item.hypothesisId,

              Executor:
                item.executor,

              Timeframe:
                dataset
                  .sourceTimeframe,

              DatasetId:
                dataset.id,

              Status:
                item.bindingStatus,
            })
          )
      )
    );
  } catch (error) {
    console.error(
      "Research dataset binding test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();