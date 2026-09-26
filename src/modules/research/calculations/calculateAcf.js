const calculateAcf = (
  values,
  maxLag
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

  if (
    !Number.isInteger(maxLag) ||
    maxLag < 0
  ) {
    throw new Error(
      "INVALID_MAX_LAG"
    );
  }

  const mean =
    data.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / data.length;

  const denominator =
    data.reduce(
      (sum, value) =>
        sum +
        (value - mean) ** 2,
      0
    );

  if (denominator === 0) {
    return null;
  }

  const finalLag =
    Math.min(
      maxLag,
      data.length - 1
    );

  const acf = [];

  for (
    let lag = 0;
    lag <= finalLag;
    lag += 1
  ) {
    let numerator = 0;

    for (
      let index = lag;
      index < data.length;
      index += 1
    ) {
      numerator +=
        (
          data[index] -
          mean
        ) *
        (
          data[index - lag] -
          mean
        );
    }

    acf.push({
      lag,
      value:
        numerator /
        denominator,
    });
  }

  return acf;
};

module.exports = {
  calculateAcf,
};