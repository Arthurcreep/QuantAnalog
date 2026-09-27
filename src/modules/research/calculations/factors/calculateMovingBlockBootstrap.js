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

  if (!quantiles) {
    throw new Error(
      "INVALID_BOOTSTRAP_INTERVAL_SAMPLE"
    );
  }

  const get = (
    probability
  ) => {
    const quantile =
      quantiles.find(
        (item) =>
          item.probability ===
          probability
      );

    if (!quantile) {
      throw new Error(
        "BOOTSTRAP_QUANTILE_NOT_FOUND"
      );
    }

    return quantile.value;
  };

  return {
    lower:
      get(0.025),

    median:
      get(0.5),

    upper:
      get(0.975),
  };
};

const validateCategory = ({
  category,
  categoryCount,
}) =>
  Number.isInteger(
    category
  ) &&
  category >= 0 &&
  category <
    categoryCount;

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

    if (
      !validateCategory({
        category,
        categoryCount,
      }) ||
      !Number.isFinite(
        target
      )
    ) {
      throw new Error(
        "INVALID_BOOTSTRAP_ROW"
      );
    }

    sums[category] +=
      target;

    counts[category] +=
      1;

    totalSum +=
      target;
  }

  for (
    let category = 0;
    category <
    categoryCount;
    category += 1
  ) {
    if (
      counts[category] ===
      0
    ) {
      throw new Error(
        `EMPTY_BOOTSTRAP_CATEGORY: ${category}`
      );
    }
  }

  return {
    means:
      sums.map(
        (
          sum,
          category
        ) =>
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

const hasAllCategories = ({
  counts,
}) =>
  counts.every(
    (count) =>
      count > 0
  );

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

    if (
      !Number.isInteger(
        categoryCount
      ) ||
      categoryCount < 2
    ) {
      throw new Error(
        "INVALID_BOOTSTRAP_CATEGORY_COUNT"
      );
    }

    if (
      !Number.isInteger(
        blockSize
      ) ||
      blockSize <= 0
    ) {
      throw new Error(
        "INVALID_BOOTSTRAP_BLOCK_SIZE"
      );
    }

    if (
      !Number.isInteger(
        iterations
      ) ||
      iterations <= 0
    ) {
      throw new Error(
        "INVALID_BOOTSTRAP_ITERATIONS"
      );
    }

    if (
      !Number.isInteger(
        highCategory
      ) ||
      !Number.isInteger(
        lowCategory
      ) ||
      !validateCategory({
        category:
          highCategory,

        categoryCount,
      }) ||
      !validateCategory({
        category:
          lowCategory,

        categoryCount,
      }) ||
      highCategory ===
        lowCategory
    ) {
      throw new Error(
        "INVALID_BOOTSTRAP_CONTRAST"
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

    const maxAttempts =
      iterations * 20;

    let validIterations =
      0;

    let attempts =
      0;

    let rejectedIterations =
      0;

    while (
      validIterations <
        iterations &&
      attempts <
        maxAttempts
    ) {
      attempts +=
        1;

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

          if (
            !validateCategory({
              category,
              categoryCount,
            }) ||
            !Number.isFinite(
              target
            )
          ) {
            throw new Error(
              "INVALID_BOOTSTRAP_ROW"
            );
          }

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

      if (
        !hasAllCategories({
          counts,
        })
      ) {
        rejectedIterations +=
          1;

        continue;
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

      if (
        !Number.isFinite(
          overallMean
        ) ||
        overallMean === 0
      ) {
        rejectedIterations +=
          1;

        continue;
      }

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

      const relativeDifference =
        difference /
        overallMean;

      const minimum =
        Math.min(
          ...means
        );

      const maximum =
        Math.max(
          ...means
        );

      const span =
        (
          maximum -
          minimum
        ) /
        overallMean;

      if (
        !Number.isFinite(
          difference
        ) ||
        !Number.isFinite(
          relativeDifference
        ) ||
        !Number.isFinite(
          span
        )
      ) {
        throw new Error(
          "NON_FINITE_BOOTSTRAP_RESULT"
        );
      }

      differenceSamples.push(
        difference
      );

      relativeDifferenceSamples.push(
        relativeDifference
      );

      spanSamples.push(
        span
      );

      validIterations +=
        1;
    }

    if (
      validIterations <
      iterations
    ) {
      throw new Error(
        `INSUFFICIENT_VALID_BOOTSTRAP_ITERATIONS: ${validIterations}/${iterations}`
      );
    }

    return {
      config: {
        blockSize,
        iterations,
        seed,

        attempts,

        rejectedIterations,
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