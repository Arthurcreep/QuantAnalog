const { jStat } = require("jstat");

const {
  calculateAcf,
} = require("./calculateAcf");

const calculateLjungBox = ({
  values,
  lags,
}) => {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("EMPTY_SERIES");
  }

  if (!Number.isInteger(lags) || lags <= 0) {
    throw new Error("INVALID_LJUNG_BOX_LAGS");
  }

  if (values.length <= lags) {
    throw new Error("INSUFFICIENT_LJUNG_BOX_SAMPLE");
  }

  const n = values.length;

  const acf = calculateAcf(
    values,
    lags
  );

  let sum = 0;

  for (let lag = 1; lag <= lags; lag += 1) {
    const rho = acf[lag].value;

    sum +=
      (rho ** 2) /
      (n - lag);
  }

  const statistic =
    n *
    (n + 2) *
    sum;

  const pValue =
    1 -
    jStat.chisquare.cdf(
      statistic,
      lags
    );

  return {
    sampleSize: n,
    lags,
    statistic,
    degreesOfFreedom: lags,
    pValue,
  };
};

module.exports = {
  calculateLjungBox,
};