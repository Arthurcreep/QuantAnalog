const calculateHigherMoments = (
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

  const n = data.length;

  const mean =
    data.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / n;

  const m2 =
    data.reduce(
      (sum, value) =>
        sum +
        (value - mean) ** 2,
      0
    ) / n;

  if (m2 === 0) {
    return {
      skewness: null,
      excessKurtosis: null,
    };
  }

  const m3 =
    data.reduce(
      (sum, value) =>
        sum +
        (value - mean) ** 3,
      0
    ) / n;

  const m4 =
    data.reduce(
      (sum, value) =>
        sum +
        (value - mean) ** 4,
      0
    ) / n;

  const rawSkewness =
    m3 / m2 ** 1.5;

  const skewness =
    n >= 3
      ? (
          Math.sqrt(
            n * (n - 1)
          ) /
          (n - 2)
        ) * rawSkewness
      : null;

  const rawExcessKurtosis =
    m4 / m2 ** 2 - 3;

  const excessKurtosis =
    n >= 4
      ? (
          (n - 1) /
          (
            (n - 2) *
            (n - 3)
          )
        ) *
        (
          (n + 1) *
            rawExcessKurtosis +
          6
        )
      : null;

  return {
    skewness,
    excessKurtosis,
  };
};

module.exports = {
  calculateHigherMoments,
};