const assert = require(
  "assert"
);

const {
  listHypotheses,
} = require(
  "../src/modules/research/registry/hypothesisRegistry"
);

const {
  buildResearchPlan,
} = require(
  "../src/modules/research/planning/buildResearchPlan"
);

const findItem = (
  plan,
  hypothesisId
) =>
  plan.items.find(
    (item) =>
      item.hypothesisId ===
      hypothesisId
  );

const run = () => {
  const plan =
    buildResearchPlan({
      hypotheses:
        listHypotheses(),

      availableData: [
        "CANDLES",
        "TIMESTAMP",
      ],

      acquirableData: [
        "CANDLES",
        "FUNDING",
        "OPEN_INTEREST",
        "MULTI_ASSET_CANDLES",
      ],
    });

  const calendar =
    findItem(
      plan,
      "H_CAL_001"
    );

  const currentRv =
    findItem(
      plan,
      "H_VOL_002"
    );

  const absoluteReturn =
    findItem(
      plan,
      "H_VOL_003"
    );

  const volumeRv =
    findItem(
      plan,
      "H_VOLM_001"
    );

  const volumeReturn =
    findItem(
      plan,
      "H_VOLM_002"
    );

  assert.ok(
    calendar
  );

  assert.ok(
    currentRv
  );

  assert.ok(
    absoluteReturn
  );

  assert.ok(
    volumeRv
  );

  assert.ok(
    volumeReturn
  );

  assert.strictEqual(
    calendar
      .multipleTestingFamily,
    "CALENDAR_FUTURE_RV_V1"
  );

  assert.strictEqual(
    calendar
      .multipleTestingFamilySource,
    "EXPLICIT"
  );

  assert.strictEqual(
    currentRv
      .multipleTestingFamily,
    "VOLATILITY_STRUCTURE"
  );

  assert.strictEqual(
    currentRv
      .multipleTestingFamilySource,
    "RESEARCH_FAMILY_FALLBACK"
  );

  assert.strictEqual(
    absoluteReturn
      .multipleTestingFamily,
    "VOLATILITY_STRUCTURE"
  );

  assert.strictEqual(
    volumeRv
      .multipleTestingFamily,
    "VOLUME"
  );

  assert.strictEqual(
    volumeReturn
      .multipleTestingFamily,
    "VOLUME"
  );

  assert.strictEqual(
    volumeRv
      .multipleTestingFamilySource,
    "RESEARCH_FAMILY_FALLBACK"
  );

  assert.strictEqual(
    volumeReturn
      .multipleTestingFamilySource,
    "RESEARCH_FAMILY_FALLBACK"
  );

  console.log(
    "Multiple-testing family planning test passed."
  );

  console.table(
    plan.items.map(
      (item) => ({
        Hypothesis:
          item.hypothesisId,

        ResearchFamily:
          item.family,

        MultipleTestingFamily:
          item
            .multipleTestingFamily,

        Source:
          item
            .multipleTestingFamilySource,

        PlanStatus:
          item.planStatus,
      })
    )
  );
};

run();