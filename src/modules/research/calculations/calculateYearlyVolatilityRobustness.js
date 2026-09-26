const {
  calculateAcf,
} = require(
  "./calculateAcf"
);

const {
  calculateArchLm,
} = require(
  "./calculateArchLm"
);

const groupByYear = (
  series
) => {
  const groups =
    new Map();

  for (
    const item of series
  ) {
    const year =
      new Date(
        item.timestamp
      ).getUTCFullYear();

    if (
      !groups.has(year)
    ) {
      groups.set(
        year,
        []
      );
    }

    groups
      .get(year)
      .push(item);
  }

  return groups;
};

const calculateYearlyVolatilityRobustness =
  ({
    series,
    acfLag = 1,
    archLmLags = 10,
    minimumSampleSize = 100,
  }) => {
    const groups =
      groupByYear(
        series
      );

    const results = [];

    for (
      const [
        year,
        items,
      ] of groups
    ) {
      if (
        items.length <
        minimumSampleSize
      ) {
        results.push({
          year,
          sampleSize:
            items.length,

          status:
            "INSUFFICIENT_SAMPLE",
        });

        continue;
      }

      const returns =
        items.map(
          (item) =>
            item.logReturn
        );

      const absoluteReturns =
        returns.map(
          (value) =>
            Math.abs(value)
        );

      const squaredReturns =
        returns.map(
          (value) =>
            value ** 2
        );

      const absoluteAcf =
        calculateAcf(
          absoluteReturns,
          acfLag
        );

      const squaredAcf =
        calculateAcf(
          squaredReturns,
          acfLag
        );

      const archLm =
        calculateArchLm({
          returns,
          lags:
            archLmLags,
        });

      results.push({
        year,

        status:
          "VALID",

        sampleSize:
          returns.length,

        startTimestamp:
          items[0]
            .timestamp,

        endTimestamp:
          items[
            items.length - 1
          ].timestamp,

        absoluteReturnAcf:
          absoluteAcf[
            acfLag
          ].value,

        squaredReturnAcf:
          squaredAcf[
            acfLag
          ].value,

        archLm: {
          lags:
            archLmLags,

          statistic:
            archLm.statistic,

          rSquared:
            archLm.rSquared,

          pValue:
            archLm.pValue,
        },
      });
    }

    return results.sort(
      (a, b) =>
        a.year - b.year
    );
  };

module.exports = {
  calculateYearlyVolatilityRobustness,
};