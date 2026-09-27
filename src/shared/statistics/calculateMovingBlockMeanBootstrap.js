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
      ) >>>
      0;

    return (
      state /
      4294967296
    );
  };
};

const calculateMean = (
  values
) =>
  values.reduce(
    (
      sum,
      value
    ) =>
      sum + value,
    0
  ) /
  values.length;

const calculatePercentile = ({
  sorted,
  probability,
}) => {
  if (
    sorted.length === 0
  ) {
    throw new Error(
      "EMPTY_MEAN_BOOTSTRAP_SAMPLE"
    );
  }

  const position =
    probability *
    (
      sorted.length -
      1
    );

  const lowerIndex =
    Math.floor(
      position
    );

  const upperIndex =
    Math.ceil(
      position
    );

  if (
    lowerIndex ===
    upperIndex
  ) {
    return sorted[
      lowerIndex
    ];
  }

  const weight =
    position -
    lowerIndex;

  return (
    sorted[
      lowerIndex
    ] *
      (
        1 -
        weight
      ) +
    sorted[
      upperIndex
    ] *
      weight
  );
};

const buildValidBlockStarts = ({
  rows,
  timestampField,
  blockSize,
  expectedIntervalMs,
}) => {
  const gapPrefix =
    new Uint32Array(
      rows.length
    );

  for (
    let index = 0;
    index <
      rows.length;
    index += 1
  ) {
    const currentTime =
      new Date(
        rows[index][
          timestampField
        ]
      ).getTime();

    if (
      !Number.isFinite(
        currentTime
      )
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_TIMESTAMP"
      );
    }

    if (
      index > 0
    ) {
      const previousTime =
        new Date(
          rows[
            index - 1
          ][timestampField]
        ).getTime();

      if (
        currentTime <=
        previousTime
      ) {
        throw new Error(
          "NON_MONOTONIC_MEAN_BOOTSTRAP_TIMESTAMPS"
        );
      }

      const hasGap =
        currentTime -
          previousTime !==
        expectedIntervalMs;

      gapPrefix[index] =
        gapPrefix[
          index - 1
        ] +
        Number(
          hasGap
        );
    }
  }

  const starts =
    [];

  const maximumStart =
    rows.length -
    blockSize;

  for (
    let start = 0;
    start <=
      maximumStart;
    start += 1
  ) {
    const end =
      start +
      blockSize -
      1;

    const gapCount =
      gapPrefix[end] -
      gapPrefix[start];

    if (
      gapCount === 0
    ) {
      starts.push(
        start
      );
    }
  }

  return starts;
};

const calculateMovingBlockMeanBootstrap =
  ({
    rows,
    valueField,
    timestampField =
      "issuedAt",
    expectedIntervalMs,
    blockSize = 7,
    iterations = 2000,
    seed = 20260927,
    confidenceLevel = 0.95,
  }) => {
    if (
      !Array.isArray(
        rows
      ) ||
      rows.length <
        blockSize
    ) {
      throw new Error(
        "INSUFFICIENT_MEAN_BOOTSTRAP_SAMPLE"
      );
    }

    if (
      typeof valueField !==
        "string" ||
      typeof timestampField !==
        "string"
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_FIELDS"
      );
    }

    if (
      !Number.isFinite(
        expectedIntervalMs
      ) ||
      expectedIntervalMs <= 0
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_INTERVAL"
      );
    }

    if (
      !Number.isInteger(
        blockSize
      ) ||
      blockSize <= 1
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_BLOCK_SIZE"
      );
    }

    if (
      !Number.isInteger(
        iterations
      ) ||
      iterations <= 0
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_ITERATIONS"
      );
    }

    if (
      !Number.isInteger(
        seed
      )
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_SEED"
      );
    }

    if (
      !Number.isFinite(
        confidenceLevel
      ) ||
      confidenceLevel <= 0 ||
      confidenceLevel >= 1
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_CONFIDENCE"
      );
    }

    const sourceValues =
      rows.map(
        (row) => {
          const value =
            Number(
              row[
                valueField
              ]
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            throw new Error(
              "INVALID_MEAN_BOOTSTRAP_VALUE"
            );
          }

          return value;
        }
      );

    const observedMean =
      calculateMean(
        sourceValues
      );

    const validBlockStarts =
      buildValidBlockStarts({
        rows,

        timestampField,

        blockSize,

        expectedIntervalMs,
      });

    if (
      validBlockStarts.length ===
      0
    ) {
      throw new Error(
        "NO_VALID_MEAN_BOOTSTRAP_BLOCKS"
      );
    }

    const random =
      createRandom(
        seed
      );

    const meanSamples =
      [];

    for (
      let iteration = 0;
      iteration <
        iterations;
      iteration += 1
    ) {
      const sampledValues =
        [];

      while (
        sampledValues.length <
        sourceValues.length
      ) {
        const start =
          validBlockStarts[
            Math.floor(
              random() *
              validBlockStarts.length
            )
          ];

        const remaining =
          sourceValues.length -
          sampledValues.length;

        const take =
          Math.min(
            blockSize,
            remaining
          );

        for (
          let offset = 0;
          offset <
            take;
          offset += 1
        ) {
          sampledValues.push(
            sourceValues[
              start +
              offset
            ]
          );
        }
      }

      meanSamples.push(
        calculateMean(
          sampledValues
        )
      );
    }

    const sorted =
      [...meanSamples].sort(
        (
          first,
          second
        ) =>
          first -
          second
      );

    const alpha =
      1 -
      confidenceLevel;

    const lower =
      calculatePercentile({
        sorted,

        probability:
          alpha /
          2,
      });

    const median =
      calculatePercentile({
        sorted,

        probability:
          0.5,
      });

    const upper =
      calculatePercentile({
        sorted,

        probability:
          1 -
          alpha /
            2,
      });

    const positiveCount =
      meanSamples.filter(
        (value) =>
          value > 0
      ).length;

    const negativeCount =
      meanSamples.filter(
        (value) =>
          value < 0
      ).length;

    return {
      config: {
        blockSize,

        iterations,

        seed,

        confidenceLevel,

        validBlockStartCount:
          validBlockStarts
            .length,
      },

      observed: {
        mean:
          observedMean,
      },

      confidenceInterval: {
        lower,

        median,

        upper,

        excludesZero:
          lower > 0 ||
          upper < 0,

        supportsCandidate:
          lower > 0,

        supportsBenchmark:
          upper < 0,
      },

      probabilityPositive:
        positiveCount /
        iterations,

      probabilityNegative:
        negativeCount /
        iterations,
    };
  };

module.exports = {
  calculateMovingBlockMeanBootstrap,
};