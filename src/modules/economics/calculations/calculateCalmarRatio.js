const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const calculateCalmarRatio = ({
  annualizedReturn,
  maxDrawdown,
}) => {
  if (
    !isFiniteNumber(
      annualizedReturn
    )
  ) {
    throw new Error(
      "INVALID_ANNUALIZED_RETURN"
    );
  }

  if (
    !isFiniteNumber(
      maxDrawdown
    ) ||
    maxDrawdown >
      0
  ) {
    throw new Error(
      "INVALID_MAX_DRAWDOWN"
    );
  }

  if (
    maxDrawdown ===
      0
  ) {
    return null;
  }

  return (
    annualizedReturn /
    Math.abs(
      maxDrawdown
    )
  );
};

module.exports = {
  calculateCalmarRatio,
};