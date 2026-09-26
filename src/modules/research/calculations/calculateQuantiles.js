const calculateQuantiles = (
  values,
  probabilities
) => {
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    !Array.isArray(probabilities)
  ) {
    return null;
  }

  const data =
    values
      .map(Number)
      .sort(
        (left, right) =>
          left - right
      );

  if (
    data.some(
      (value) =>
        !Number.isFinite(value)
    )
  ) {
    return null;
  }

  return probabilities.map(
    (probability) => {
      if (
        probability < 0 ||
        probability > 1
      ) {
        throw new Error(
          "INVALID_QUANTILE_PROBABILITY"
        );
      }

      const position =
        (data.length - 1) *
        probability;

      const lower =
        Math.floor(position);

      const upper =
        Math.ceil(position);

      const weight =
        position - lower;

      const value =
        lower === upper
          ? data[lower]
          : data[lower] +
            (
              data[upper] -
              data[lower]
            ) *
              weight;

      return {
        probability,
        value,
      };
    }
  );
};

module.exports = {
  calculateQuantiles,
};