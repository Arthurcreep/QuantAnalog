const assert = require(
  "assert"
);

const {
  SYSTEM_HYPOTHESES,
  getHypothesisById,
  listHypothesesByFamily,
} = require(
  "../src/modules/research/registry/hypothesisRegistry"
);

const {
  listResearchFamilies,
} = require(
  "../src/modules/research/registry/researchFamilyRegistry"
);

const {
  validateHypothesisRegistry,
} = require(
  "../src/modules/research/registry/validateHypothesisRegistry"
);

const run = () => {
  const result =
    validateHypothesisRegistry(
      SYSTEM_HYPOTHESES
    );

  assert.strictEqual(
    result.valid,
    true
  );

  assert.ok(
    result.count > 0
  );

  const hour =
    getHypothesisById(
      "H_CAL_001"
    );

  assert.strictEqual(
    hour.family,
    "CALENDAR"
  );

  assert.strictEqual(
    hour.status,
    "FROZEN"
  );

  const calendar =
    listHypothesesByFamily(
      "CALENDAR"
    );

  assert.ok(
    calendar.length >= 4
  );

  console.log(
    "Hypothesis registry validation passed."
  );

  console.log({
    researchFamilies:
      listResearchFamilies()
        .length,

    hypotheses:
      result.count,

    activeFamilies:
      result.families.length,

    calendarHypotheses:
      calendar.map(
        (hypothesis) => ({
          id:
            hypothesis.id,

          title:
            hypothesis.title,

          status:
            hypothesis.status,
        })
      ),
  });
};

run();