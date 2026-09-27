const assert = require(
  "assert"
);

const {
  calculateYearlyContinuousFactorRobustness,
} = require(
  "../src/modules/research/calculations/factors/calculateYearlyContinuousFactorRobustness"
);

const buildRowsForYear = ({
  year,
  count,
}) => {
  const rows = [];

  const start =
    Date.UTC(
      year,
      0,
      10,
      0,
      0,
      0
    );

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const timestamp =
      new Date(
        start +
        index *
          60 *
          60 *
          1000
      ).toISOString();

    const feature =
      Math.sin(
        index /
        25
      ) +
      (
        index %
        13
      ) *
        0.01;

    const noise =
      Math.sin(
        index /
        9
      ) *
      0.04;

    const target =
      0.5 *
        feature +
      noise;

    rows.push({
      timestamp,

      featureStartTimestamp:
        timestamp,

      targetEndTimestamp:
        timestamp,

      feature,

      target,
    });
  }

  return rows;
};

const run = () => {
  const rows = [
    ...buildRowsForYear({
      year:
        2020,

      count:
        1200,
    }),

    ...buildRowsForYear({
      year:
        2021,

      count:
        1200,
    }),

    ...buildRowsForYear({
      year:
        2022,

      count:
        1200,
    }),

    ...buildRowsForYear({
      year:
        2023,

      count:
        1200,
    }),

    ...buildRowsForYear({
      year:
        2024,

      count:
        1200,
    }),
  ];

  const result =
    calculateYearlyContinuousFactorRobustness({
      rows,

      featureField:
        "feature",

      targetField:
        "target",

      referenceBeta:
        0.5,

      hacLag:
        24,

      minimumSampleSize:
        1000,

      minimumValidYears:
        3,

      minimumDirectionAgreementRatio:
        0.75,
    });

  assert.strictEqual(
    result
      .summary
      .validYears,
    5
  );

  assert.strictEqual(
    result
      .summary
      .directionAgreementCount,
    5
  );

  assert.strictEqual(
    result
      .summary
      .directionAgreementRatio,
    1
  );

  assert.strictEqual(
    result
      .summary
      .directionStable,
    true
  );

  assert.ok(
    result
      .summary
      .medianBeta >
      0.45
  );

  assert.ok(
    result
      .summary
      .medianBeta <
      0.55
  );

  for (
    const item of
    result.yearly
  ) {
    assert.strictEqual(
      item.status,
      "VALID"
    );

    assert.strictEqual(
      item
        .directionAgreement,
      true
    );

    assert.ok(
      item.beta >
      0.45
    );

    assert.ok(
      item.beta <
      0.55
    );
  }

  console.log(
    "Yearly continuous factor robustness test passed."
  );

  console.log({
    validYears:
      result
        .summary
        .validYears,

    directionAgreementCount:
      result
        .summary
        .directionAgreementCount,

    directionAgreementRatio:
      result
        .summary
        .directionAgreementRatio,

    directionStable:
      result
        .summary
        .directionStable,

    medianBeta:
      result
        .summary
        .medianBeta,

    excludedBoundaryRows:
      result
        .summary
        .excludedBoundaryRows,
  });

  console.table(
    result
      .yearly
      .map(
        (item) => ({
          Year:
            item.year,

          Status:
            item.status,

          N:
            item.sampleSize,

          Beta:
            item.beta,

          PValue:
            item.pValue,

          R2:
            item.rSquared,

          DirectionAgreement:
            item
              .directionAgreement,
        })
      )
  );
};

run();