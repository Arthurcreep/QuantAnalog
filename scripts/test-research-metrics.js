const {
  calculateHigherMoments,
} = require(
  "../src/modules/research/calculations/calculateHigherMoments"
);

const {
  calculateQuantiles,
} = require(
  "../src/modules/research/calculations/calculateQuantiles"
);

const {
  calculateAcf,
} = require(
  "../src/modules/research/calculations/calculateAcf"
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
    -2,
    -1,
    0,
    1,
    2,
  ];

  const moments =
    calculateHigherMoments(
      values
    );

  const quantiles =
    calculateQuantiles(
      values,
      [
        0.25,
        0.5,
        0.75,
      ]
    );

  const acf =
    calculateAcf(
      values,
      2
    );

  console.dir(
    {
      moments,
      quantiles,
      acf,
    },
    {
      depth: null,
    }
  );

  if (
    !closeEnough(
      moments.skewness,
      0
    )
  ) {
    throw new Error(
      "Incorrect skewness"
    );
  }

  if (
    !closeEnough(
      moments.excessKurtosis,
      -1.2
    )
  ) {
    throw new Error(
      "Incorrect excess kurtosis"
    );
  }

  if (
    quantiles[0].value !== -1 ||
    quantiles[1].value !== 0 ||
    quantiles[2].value !== 1
  ) {
    throw new Error(
      "Incorrect quantiles"
    );
  }

  if (
    !closeEnough(
      acf[0].value,
      1
    )
  ) {
    throw new Error(
      "Incorrect ACF lag 0"
    );
  }

  if (
    !closeEnough(
      acf[1].value,
      0.4
    )
  ) {
    throw new Error(
      "Incorrect ACF lag 1"
    );
  }

  if (
    !closeEnough(
      acf[2].value,
      -0.1
    )
  ) {
    throw new Error(
      "Incorrect ACF lag 2"
    );
  }

  console.log(
    "Research metrics test passed"
  );
};

run();