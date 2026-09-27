const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const mean = (
  values
) =>
  values.reduce(
    (
      total,
      value
    ) =>
      total +
      value,
    0
  ) /
  values.length;

const calculateSampleStandardDeviation = (
  values,
  average
) => {
  if (
    values.length <
    2
  ) {
    return null;
  }

  const sumSquaredDeviations =
    values.reduce(
      (
        total,
        value
      ) =>
        total +
        (
          value -
          average
        ) ** 2,
      0
    );

  return Math.sqrt(
    sumSquaredDeviations /
    (
      values.length -
      1
    )
  );
};

const calculateDownsideDeviation = ({
  returns,
  minimumAcceptableReturnPerPeriod,
}) => {
  const sumSquaredDownside =
    returns.reduce(
      (
        total,
        value
      ) => {
        const downside =
          Math.min(
            value -
              minimumAcceptableReturnPerPeriod,
            0
          );

        return (
          total +
          downside ** 2
        );
      },
      0
    );

  return Math.sqrt(
    sumSquaredDownside /
    returns.length
  );
};

const calculatePeriodicPerformanceMetrics = ({
  returns,
  periodsPerYear,
  riskFreeRatePerPeriod = 0,
  minimumAcceptableReturnPerPeriod = 0,
}) => {
  if (
    !Array.isArray(
      returns
    )
  ) {
    throw new Error(
      "INVALID_PERIODIC_RETURNS"
    );
  }

  if (
    returns.length ===
    0
  ) {
    throw new Error(
      "EMPTY_PERIODIC_RETURNS"
    );
  }

  if (
    !isFiniteNumber(
      periodsPerYear
    ) ||
    periodsPerYear <=
      0
  ) {
    throw new Error(
      "INVALID_PERIODS_PER_YEAR"
    );
  }

  if (
    !isFiniteNumber(
      riskFreeRatePerPeriod
    )
  ) {
    throw new Error(
      "INVALID_RISK_FREE_RATE"
    );
  }

  if (
    !isFiniteNumber(
      minimumAcceptableReturnPerPeriod
    )
  ) {
    throw new Error(
      "INVALID_MINIMUM_ACCEPTABLE_RETURN"
    );
  }

  for (
    let index = 0;
    index <
    returns.length;
    index += 1
  ) {
    const value =
      returns[index];

    if (
      !isFiniteNumber(
        value
      ) ||
      value <
        -1
    ) {
      throw new Error(
        `INVALID_PERIODIC_RETURN:${index}`
      );
    }
  }

  const averageReturn =
    mean(
      returns
    );

  const standardDeviation =
    calculateSampleStandardDeviation(
      returns,
      averageReturn
    );

  const downsideDeviation =
    calculateDownsideDeviation({
      returns,

      minimumAcceptableReturnPerPeriod,
    });

  const excessAverageReturn =
    averageReturn -
    riskFreeRatePerPeriod;

  const annualizationFactor =
    Math.sqrt(
      periodsPerYear
    );

  const sharpeRatio =
    standardDeviation &&
    standardDeviation >
      0
      ? (
          excessAverageReturn /
          standardDeviation
        ) *
        annualizationFactor
      : null;

  const sortinoRatio =
    downsideDeviation >
      0
      ? (
          (
            averageReturn -
            minimumAcceptableReturnPerPeriod
          ) /
          downsideDeviation
        ) *
        annualizationFactor
      : null;

  const compoundedGrowth =
    returns.reduce(
      (
        growth,
        value
      ) =>
        growth *
        (
          1 +
          value
        ),
      1
    );

  const cumulativeReturn =
    compoundedGrowth -
    1;

  const annualizedReturn =
    compoundedGrowth ===
      0
      ? -1
      : (
          compoundedGrowth **
          (
            periodsPerYear /
            returns.length
          )
        ) -
        1;

  return {
    observationCount:
      returns.length,

    periodsPerYear,

    averageReturn,

    standardDeviation,

    downsideDeviation,

    cumulativeReturn,

    annualizedReturn,

    sharpeRatio,

    sortinoRatio,

    riskFreeRatePerPeriod,

    minimumAcceptableReturnPerPeriod,
  };
};

module.exports = {
  calculatePeriodicPerformanceMetrics,
};