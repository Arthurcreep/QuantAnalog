const calculateDescriptiveStats = (
  values
) => {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return null;
  }

  const data =
    values.map(Number);

  if (
    data.some(
      (value) =>
        !Number.isFinite(value)
    )
  ) {
    return null;
  }

  const count =
    data.length;

  const mean =
    data.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / count;

  const squaredSum =
    data.reduce(
      (sum, value) =>
        sum +
        (value - mean) ** 2,
      0
    );

  const variance =
    count > 1
      ? squaredSum /
        (count - 1)
      : 0;

  const std =
    Math.sqrt(
      variance
    );

  const min =
    Math.min(...data);

  const max =
    Math.max(...data);

  return {
    count,
    mean,
    variance,
    std,
    min,
    max,
  };
};

module.exports = {
  calculateDescriptiveStats,
};