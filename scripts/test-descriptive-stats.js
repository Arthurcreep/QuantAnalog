const {
  calculateDescriptiveStats,
} = require(
  "../src/modules/research/calculations/calculateDescriptiveStats"
);

const closeEnough = (
  actual,
  expected
) =>
  Math.abs(
    actual - expected
  ) < 1e-12;

const run = () => {
  const values = [
    -0.02,
    0.01,
    0.03,
    -0.01,
    0.04,
  ];

  const result =
    calculateDescriptiveStats(
      values
    );

  console.dir(
    result,
    {
      depth: null,
    }
  );

  if (
    result.count !== 5
  ) {
    throw new Error(
      "Incorrect count"
    );
  }

  if (
    !closeEnough(
      result.mean,
      0.01
    )
  ) {
    throw new Error(
      "Incorrect mean"
    );
  }

  if (
    !closeEnough(
      result.variance,
      0.00065
    )
  ) {
    throw new Error(
      "Incorrect variance"
    );
  }

  if (
    !closeEnough(
      result.std,
      Math.sqrt(0.00065)
    )
  ) {
    throw new Error(
      "Incorrect standard deviation"
    );
  }

  if (
    result.min !== -0.02
  ) {
    throw new Error(
      "Incorrect minimum"
    );
  }

  if (
    result.max !== 0.04
  ) {
    throw new Error(
      "Incorrect maximum"
    );
  }

  console.log(
    "Descriptive statistics test passed"
  );
};

run();