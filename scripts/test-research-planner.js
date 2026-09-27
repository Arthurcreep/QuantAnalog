const assert = require(
  "assert"
);

const {
  SYSTEM_HYPOTHESES,
} = require(
  "../src/modules/research/registry/hypothesisRegistry"
);

const {
  buildResearchPlan,
} = require(
  "../src/modules/research/planning/buildResearchPlan"
);

const findPlan = (
  items,
  hypothesisId
) =>
  items.find(
    (item) =>
      item.hypothesisId ===
      hypothesisId
  );

const run = () => {
  const plan =
    buildResearchPlan({
      hypotheses:
        SYSTEM_HYPOTHESES,

      availableData: [
        "CANDLES",
      ],

      acquirableData: [
        "FUNDING",
        "OPEN_INTEREST",
        "MULTI_ASSET_CANDLES",
      ],
    });

  const hour =
    findPlan(
      plan.items,
      "H_CAL_001"
    );

  const weekday =
    findPlan(
      plan.items,
      "H_CAL_002"
    );

  const weekend =
    findPlan(
      plan.items,
      "H_CAL_003"
    );

  const funding =
    findPlan(
      plan.items,
      "H_FUND_001"
    );

  const volume =
    findPlan(
      plan.items,
      "H_VOLM_001"
    );

  const lunar =
    findPlan(
      plan.items,
      "H_EXP_001"
    );

  assert.strictEqual(
    hour.planStatus,
    "RUNNABLE"
  );

  assert.strictEqual(
    weekday.planStatus,
    "RUNNABLE"
  );

  assert.strictEqual(
    weekend.planStatus,
    "RUNNABLE"
  );

  assert.strictEqual(
    funding.dataStatus,
    "NEED_ACQUISITION"
  );

  assert.strictEqual(
    funding.executionStatus,
    "PLANNED"
  );

  assert.strictEqual(
    funding.planStatus,
    "NEED_ACQUISITION_AND_IMPLEMENTATION"
  );

  assert.strictEqual(
    volume.dataStatus,
    "READY"
  );

  assert.strictEqual(
    volume.planStatus,
    "RUNNABLE"
  );

  assert.strictEqual(
    lunar.dataStatus,
    "READY"
  );

  assert.strictEqual(
    lunar.planStatus,
    "NOT_IMPLEMENTED"
  );

  assert.deepStrictEqual(
    new Set(
      plan.acquisitionCapabilities
    ),
    new Set([
      "FUNDING",
      "OPEN_INTEREST",
      "MULTI_ASSET_CANDLES",
    ])
  );

  assert.strictEqual(
    plan.runnable.length,
    10
  );

  assert.strictEqual(
    plan.acquisitionRequired.length,
    5
  );

  console.log(
    "Research planner test passed."
  );

  console.log(
    "\n===== PLAN SUMMARY ====="
  );

  console.log(
    plan.summary
  );

  console.log(
    "\n===== REQUIRED DATA ACQUISITION ====="
  );

  console.log(
    plan.acquisitionCapabilities
  );

  console.log(
    "\n===== RESEARCH PLAN ====="
  );

  console.table(
    plan.items.map(
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

        Executor:
          item.execution.executor ||
          "",

        Missing:
          item.missingData.join(
            ", "
          ),

        Reason:
          item.execution.reason ||
          "",
      })
    )
  );
};

run();