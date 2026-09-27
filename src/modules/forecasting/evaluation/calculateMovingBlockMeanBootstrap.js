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

    return state /
      4294967296;
  };
};

const calculatePercentile = ({
  sorted,
  probability,
}) => {
  if (
    !Array.isArray(
      sorted
    ) ||
    sorted.length === 0
  ) {
    throw new Error(
      "EMPTY_MEAN_BOOTSTRAP_SAMPLE"
    );
  }

  if (
    !Number.isFinite(
      probability
    ) ||
    probability < 0 ||
    probability > 1
  ) {
    throw new Error(
      "INVALID_MEAN_BOOTSTRAP_PROBABILITY"
    );
  }

  if (
    sorted.length === 1
  ) {
    return sorted[0];
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
      Date.parse(
        rows[index]
          .timestamp
      );

    if (
      !Number.isFinite(
        currentTime
      )
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_TIMESTAMP"
      );
    }

    if (index > 0) {
      const previousTime =
        Date.parse(
          rows[
            index - 1
          ].timestamp
        );

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

  const validStarts =
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
      validStarts.push(
        start
      );
    }
  }

  return validStarts;
};

const calculateMovingBlockMeanBootstrap =
  ({
    rows,
    valueField,
    expectedIntervalMs,
    blockSize = 168,
    iterations = 2000,
    seed = 20261002,
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
      "string"
    ) {
      throw new Error(
        "INVALID_MEAN_BOOTSTRAP_FIELD"
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

    const source =
      new Float64Array(
        rows.length
      );

    let observedTotal =
      0;

    for (
      let index = 0;
      index <
        rows.length;
      index += 1
    ) {
      const value =
        Number(
          rows[index][
            valueField
          ]
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        throw new Error(
          "INVALID_MEAN_BOOTSTRAP_ROW"
        );
      }

      source[index] =
        value;

      observedTotal +=
        value;
    }

    const observedMean =
      observedTotal /
      rows.length;

    const validBlockStarts =
      buildValidBlockStarts({
        rows,
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

    const samples =
      new Array(
        iterations
      );

    for (
      let iteration = 0;
      iteration <
        iterations;
      iteration += 1
    ) {
      let sampled =
        0;

      let total =
        0;

      while (
        sampled <
        rows.length
      ) {
        const start =
          validBlockStarts[
            Math.floor(
              random() *
              validBlockStarts.length
            )
          ];

        const take =
          Math.min(
            blockSize,
            rows.length -
              sampled
          );

        for (
          let offset = 0;
          offset <
            take;
          offset += 1
        ) {
          total +=
            source[
              start +
              offset
            ];
        }

        sampled +=
          take;
      }

      samples[
        iteration
      ] =
        total /
        rows.length;
    }

    samples.sort(
      (a, b) =>
        a - b
    );

    const alpha =
      1 -
      confidenceLevel;

    const lower =
      calculatePercentile({
        sorted:
          samples,

        probability:
          alpha / 2,
      });

    const median =
      calculatePercentile({
        sorted:
          samples,

        probability:
          0.5,
      });

    const upper =
      calculatePercentile({
        sorted:
          samples,

        probability:
          1 -
          alpha / 2,
      });

    let positiveCount =
      0;

    for (
      const value of
      samples
    ) {
      if (
        value > 0
      ) {
        positiveCount +=
          1;
      }
    }

    return {
      config: {
        blockSize,

        iterations,

        seed,

        confidenceLevel,

        validBlockStartCount:
          validBlockStarts.length,
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
      },

      probabilityPositive:
        positiveCount /
        iterations,
    };
  };

module.exports = {
  calculateMovingBlockMeanBootstrap,
};