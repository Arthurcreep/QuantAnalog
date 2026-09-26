const {
  calculateAcf,
} = require("./calculateAcf");

const calculateVolatilityAcf = ({
  returns,
  maxLag,
}) => {
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

  return {
    returns:
      calculateAcf(
        values,
        maxLag
      ),

    absoluteReturns:
      calculateAcf(
        values.map(
          (value) =>
            Math.abs(value)
        ),
        maxLag
      ),

    squaredReturns:
      calculateAcf(
        values.map(
          (value) =>
            value ** 2
        ),
        maxLag
      ),
  };
};

module.exports = {
  calculateVolatilityAcf,
};