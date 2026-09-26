const assert = require(
  "assert"
);

const {
  evaluateCategoricalFactor,
} = require(
  "../src/modules/research/factors/evaluateCategoricalFactor"
);

const createRandom = (
  seed
) => {
  let state =
    seed >>> 0;

  return () => {
    state =
      (
        1664525 *
          state +
        1013904223
      ) >>> 0;

    return (
      state /
      4294967296
    );
  };
};

const buildRows = ({
  count,
  seed,
  levelShift = 0,
}) => {
  const random =
    createRandom(
      seed
    );

  const categoryEffects = [
    0.01,
    0.02,
    0.04,
  ];

  const rows = [];

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const category =
      index % 3;

    const noise =
      (
        random() -
        0.5
      ) *
      0.01;

    rows.push({
      category,

      target:
        categoryEffects[
          category
        ] +
        levelShift +
        noise,
    });
  }

  return rows;
};

const run = () => {
  const developmentRows =
    buildRows({
      count: 900,
      seed: 1001,
    });

  const validationRows =
    buildRows({
      count: 600,
      seed: 2002,
      levelShift: -0.003,
    });

  const result =
    evaluateCategoricalFactor({
      developmentRows,

      validationRows,

      feature: {
        name:
          "TEST_CATEGORY",

        field:
          "category",

        kind:
          "CATEGORICAL",

        categoryCount:
          3,
      },

      target: {
        name:
          "TEST_TARGET",

        field:
          "target",
      },

      hacLag: 6,
    });

  assert.strictEqual(
    result.feature
      .categoryCount,
    3
  );

  assert.strictEqual(
    result.development
      .profile.length,
    3
  );

  assert.strictEqual(
    result
      .retrospectiveValidation
      .profile.length,
    3
  );

  assert.strictEqual(
    result
      .frozenContrast
      .lowCategory,
    0
  );

  assert.strictEqual(
    result
      .frozenContrast
      .highCategory,
    2
  );

  assert.ok(
    result
      .stability
      .profileCorrelation >
      0.9
  );

  assert.ok(
    Number.isFinite(
      result
        .development
        .hac
        .statistic
    )
  );

  assert.ok(
    Number.isFinite(
      result
        .retrospectiveValidation
        .hac
        .statistic
    )
  );

  console.log(
    "Categorical factor evaluator test passed."
  );

  console.log({
    frozenContrast:
      result
        .frozenContrast,

    stability:
      result.stability,

    developmentHac:
      result
        .development
        .hac,

    validationHac:
      result
        .retrospectiveValidation
        .hac,
  });
};

run();