const {
  calculateQuantiles,
} = require(
  "../calculateQuantiles"
);

const createRandom = (
  seed
) => {
  let state =
    seed >>> 0;

  return () => {
    state =
      (
        1664525 *
          state +
        1013904223
      ) >>> 0;

    return (
      state /
      4294967296
    );
  };
};

const getInterval = (
  values
) => {
  const quantiles =
    calculateQuantiles(
      values,
      [
        0.025,
        0.5,
        0.975,
      ]
    );

  const get = (
    probability
  ) =>
    quantiles.find(
      (item) =>
        item.probability ===
        probability
    ).value;

  return {
    lower:
      get(0.025),

    median:
      get(0.5),

    upper:
      get(0.975),
  };
};

const calculateObserved = ({
  rows,
  categoryField,
  targetField,
  categoryCount,
}) => {
  const sums =
    Array(
      categoryCount
    ).fill(0);

  const counts =
    Array(
      categoryCount
    ).fill(0);

  let totalSum = 0;

  for (
    const row of rows
  ) {
    const category =
      Number(
        row[
          categoryField
        ]
      );

    const target =
      Number(
        row[
          targetField
        ]
      );

    sums[category] +=
      target;

    counts[category] +=
      1;

    totalSum +=
      target;
  }

  return {
    means:
      sums.map(
        (sum, category) =>
          sum /
          counts[
            category
          ]
      ),

    overallMean:
      totalSum /
      rows.length,
  };
};

const calculateMovingBlockBootstrap =
  ({
    rows,
    categoryField,
    targetField,
    highCategory,
    lowCategory,
    categoryCount = 24,
    blockSize = 168,
    iterations = 2000,
    seed = 20260921,
  }) => {
    if (
      !Array.isArray(rows) ||
      rows.length <
        blockSize
    ) {
      throw new Error(
        "INSUFFICIENT_BOOTSTRAP_SAMPLE"
      );
    }

    const random =
      createRandom(
        seed
      );

    const observed =
      calculateObserved({
        rows,
        categoryField,
        targetField,
        categoryCount,
      });

    const categorySamples =
      Array.from(
        {
          length:
            categoryCount,
        },
        () => []
      );

    const differenceSamples =
      [];

    const relativeDifferenceSamples =
      [];

    const spanSamples =
      [];

    const maxStart =
      rows.length -
      blockSize;

    for (
      let iteration = 0;
      iteration <
      iterations;
      iteration += 1
    ) {
      const sums =
        Array(
          categoryCount
        ).fill(0);

      const counts =
        Array(
          categoryCount
        ).fill(0);

      let totalSum = 0;
      let sampled = 0;

      while (
        sampled <
        rows.length
      ) {
        const start =
          Math.floor(
            random() *
            (
              maxStart +
              1
            )
          );

        const take =
          Math.min(
            blockSize,
            rows.length -
              sampled
          );

        for (
          let offset = 0;
          offset < take;
          offset += 1
        ) {
          const row =
            rows[
              start +
              offset
            ];

          const category =
            Number(
              row[
                categoryField
              ]
            );

          const target =
            Number(
              row[
                targetField
              ]
            );

          sums[category] +=
            target;

          counts[category] +=
            1;

          totalSum +=
            target;
        }

        sampled +=
          take;
      }

      const means =
        sums.map(
          (
            sum,
            category
          ) =>
            sum /
            counts[
              category
            ]
        );

      const overallMean =
        totalSum /
        rows.length;

      for (
        let category = 0;
        category <
        categoryCount;
        category += 1
      ) {
        categorySamples[
          category
        ].push(
          means[
            category
          ]
        );
      }

      const difference =
        means[
          highCategory
        ] -
        means[
          lowCategory
        ];

      differenceSamples.push(
        difference
      );

      relativeDifferenceSamples.push(
        difference /
        overallMean
      );

      const minimum =
        Math.min(
          ...means
        );

      const maximum =
        Math.max(
          ...means
        );

      spanSamples.push(
        (
          maximum -
          minimum
        ) /
        overallMean
      );
    }

    return {
      config: {
        blockSize,
        iterations,
        seed,
      },

      observed: {
        highCategory,
        lowCategory,

        highMean:
          observed.means[
            highCategory
          ],

        lowMean:
          observed.means[
            lowCategory
          ],

        difference:
          observed.means[
            highCategory
          ] -
          observed.means[
            lowCategory
          ],

        relativeDifference:
          (
            observed.means[
              highCategory
            ] -
            observed.means[
              lowCategory
            ]
          ) /
          observed.overallMean,
      },

      fixedContrast: {
        difference:
          getInterval(
            differenceSamples
          ),

        relativeDifference:
          getInterval(
            relativeDifferenceSamples
          ),
      },

      descriptiveSpan:
        getInterval(
          spanSamples
        ),

      profile:
        categorySamples.map(
          (
            samples,
            category
          ) => ({
            category,

            observedMean:
              observed.means[
                category
              ],

            confidenceInterval:
              getInterval(
                samples
              ),
          })
        ),
    };
  };

module.exports = {
  calculateMovingBlockBootstrap,
};