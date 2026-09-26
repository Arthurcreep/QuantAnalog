const {
  calculateLogReturn,
} = require(
  "../src/modules/research/calculations/calculateLogReturn"
);

const run = () => {
  const result =
    calculateLogReturn(
      100,
      105
    );

  const expected =
    Math.log(1.05);

  console.log({
    result,
    expected,
  });

  if (
    Math.abs(
      result - expected
    ) > 1e-12
  ) {
    throw new Error(
      "Incorrect log return"
    );
  }

  if (
    calculateLogReturn(
      0,
      105
    ) !== null
  ) {
    throw new Error(
      "Zero previous price must be rejected"
    );
  }

  if (
    calculateLogReturn(
      100,
      -5
    ) !== null
  ) {
    throw new Error(
      "Negative price must be rejected"
    );
  }

  if (
    calculateLogReturn(
      "abc",
      105
    ) !== null
  ) {
    throw new Error(
      "Invalid price must be rejected"
    );
  }

  console.log(
    "Log return test passed"
  );
};

run();