const calculateRealizedVolatility = (
  returns
) => {
  if (
    !Array.isArray(returns) ||
    returns.length === 0
  ) {
    return null;
  }

  const values =
    returns.map(Number);

  if (
    values.some(
      (value) =>
        !Number.isFinite(value)
    )
  ) {
    return null;
  }

  const realizedVariance =
    values.reduce(
      (sum, value) =>
        sum + value ** 2,
      0
    );

  return {
    count:
      values.length,

    realizedVariance,

    realizedVolatility:
      Math.sqrt(
        realizedVariance
      ),
  };
};

module.exports = {
  calculateRealizedVolatility,
};