const {
  calculateDescriptiveStats,
} = require(
  "../calculateDescriptiveStats"
);

const {
  calculateQuantiles,
} = require(
  "../calculateQuantiles"
);

const calculateMean = (
  values
) =>
  values.reduce(
    (sum, value) =>
      sum + value,
    0
  ) / values.length;

const calculateCorrelation = ({
  x,
  y,
}) => {
  if (
    x.length !== y.length ||
    x.length < 2
  ) {
    return null;
  }

  const meanX =
    calculateMean(x);

  const meanY =
    calculateMean(y);

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (
    let index = 0;
    index < x.length;
    index += 1
  ) {
    const dx =
      x[index] - meanX;

    const dy =
      y[index] - meanY;

    numerator +=
      dx * dy;

    denominatorX +=
      dx ** 2;

    denominatorY +=
      dy ** 2;
  }

  const denominator =
    Math.sqrt(
      denominatorX *
      denominatorY
    );

  return denominator > 0
    ? numerator / denominator
    : null;
};

const calculateCategoricalTargetProfile = ({
  rows,
  categoryField,
  targetField,
}) => {
  const groups =
    new Map();

  for (
    const row of rows
  ) {
    const category =
      row[categoryField];

    const target =
      Number(
        row[targetField]
      );

    if (
      !Number.isFinite(target)
    ) {
      continue;
    }

    if (
      !groups.has(category)
    ) {
      groups.set(
        category,
        []
      );
    }

    groups
      .get(category)
      .push(target);
  }

  const allValues =
    Array.from(
      groups.values()
    ).flat();

  const overall =
    calculateDescriptiveStats(
      allValues
    );

  const profile =
    Array.from(
      groups.entries()
    )
      .sort(
        ([a], [b]) =>
          Number(a) -
          Number(b)
      )
      .map(
        ([
          category,
          values,
        ]) => {
          const stats =
            calculateDescriptiveStats(
              values
            );

          const quantiles =
            calculateQuantiles(
              values,
              [
                0.25,
                0.5,
                0.75,
              ]
            );

          return {
            category,
            count:
              stats.count,

            mean:
              stats.mean,

            median:
              quantiles.find(
                (item) =>
                  item.probability ===
                  0.5
              ).value,

            std:
              stats.std,

            ratioToOverallMean:
              overall.mean !== 0
                ? stats.mean /
                  overall.mean
                : null,
          };
        }
      );

  return {
    overall,
    profile,
  };
};

const compareCategoricalProfiles = ({
  first,
  second,
}) => {
  const secondByCategory =
    new Map(
      second.map(
        (item) => [
          item.category,
          item,
        ]
      )
    );

  const pairs =
    first
      .map(
        (item) => ({
          first:
            item,

          second:
            secondByCategory.get(
              item.category
            ),
        })
      )
      .filter(
        (item) =>
          item.second
      );

  return {
    categoryCount:
      pairs.length,

    meanProfileCorrelation:
      calculateCorrelation({
        x:
          pairs.map(
            (item) =>
              item.first.mean
          ),

        y:
          pairs.map(
            (item) =>
              item.second.mean
          ),
      }),

    ratioProfileCorrelation:
      calculateCorrelation({
        x:
          pairs.map(
            (item) =>
              item.first
                .ratioToOverallMean
          ),

        y:
          pairs.map(
            (item) =>
              item.second
                .ratioToOverallMean
          ),
      }),
  };
};

module.exports = {
  calculateCategoricalTargetProfile,
  compareCategoricalProfiles,
};