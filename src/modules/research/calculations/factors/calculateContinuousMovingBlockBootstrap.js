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

const calculatePercentile = ({
  sorted,
  probability,
}) => {
  if (
    !Array.isArray(sorted) ||
    sorted.length === 0
  ) {
    throw new Error(
      "EMPTY_BOOTSTRAP_SAMPLE"
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
      "INVALID_BOOTSTRAP_PROBABILITY"
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

const getInterval = (
  values
) => {
  const sorted =
    [...values].sort(
      (a, b) =>
        a - b
    );

  return {
    lower:
      calculatePercentile({
        sorted,
        probability:
          0.025,
      }),

    median:
      calculatePercentile({
        sorted,
        probability:
          0.5,
      }),

    upper:
      calculatePercentile({
        sorted,
        probability:
          0.975,
      }),
  };
};

const calculateBeta = ({
  x,
  y,
}) => {
  if (
    x.length !==
      y.length ||
    x.length < 3
  ) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;

  for (
    let index = 0;
    index < x.length;
    index += 1
  ) {
    sumX +=
      x[index];

    sumY +=
      y[index];
  }

  const meanX =
    sumX /
    x.length;

  const meanY =
    sumY /
    y.length;

  let xx = 0;
  let xy = 0;

  for (
    let index = 0;
    index < x.length;
    index += 1
  ) {
    const centeredX =
      x[index] -
      meanX;

    const centeredY =
      y[index] -
      meanY;

    xx +=
      centeredX **
      2;

    xy +=
      centeredX *
      centeredY;
  }

  if (
    !Number.isFinite(xx) ||
    xx <= 0
  ) {
    return null;
  }

  const beta =
    xy /
    xx;

  return Number.isFinite(
    beta
  )
    ? beta
    : null;
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
    index < rows.length;
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
        "INVALID_CONTINUOUS_BOOTSTRAP_TIMESTAMP"
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
        Number(hasGap);
    }
  }

  const validStarts = [];

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

const calculateContinuousMovingBlockBootstrap =
  ({
    rows,
    featureField,
    targetField,
    expectedIntervalMs,
    blockSize = 168,
    iterations = 2000,
    seed = 20260930,
  }) => {
    if (
      !Array.isArray(rows) ||
      rows.length <
        blockSize
    ) {
      throw new Error(
        "INSUFFICIENT_CONTINUOUS_BOOTSTRAP_SAMPLE"
      );
    }

    if (
      typeof featureField !==
        "string" ||
      typeof targetField !==
        "string"
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_BOOTSTRAP_FIELDS"
      );
    }

    if (
      !Number.isFinite(
        expectedIntervalMs
      ) ||
      expectedIntervalMs <= 0
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_BOOTSTRAP_INTERVAL"
      );
    }

    if (
      !Number.isInteger(
        blockSize
      ) ||
      blockSize <= 1
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_BOOTSTRAP_BLOCK_SIZE"
      );
    }

    if (
      !Number.isInteger(
        iterations
      ) ||
      iterations <= 0
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_BOOTSTRAP_ITERATIONS"
      );
    }

    if (
      !Number.isInteger(
        seed
      )
    ) {
      throw new Error(
        "INVALID_CONTINUOUS_BOOTSTRAP_SEED"
      );
    }

    const sourceX =
      new Float64Array(
        rows.length
      );

    const sourceY =
      new Float64Array(
        rows.length
      );

    for (
      let index = 0;
      index < rows.length;
      index += 1
    ) {
      const feature =
        Number(
          rows[index][
            featureField
          ]
        );

      const target =
        Number(
          rows[index][
            targetField
          ]
        );

      if (
        !Number.isFinite(
          feature
        ) ||
        !Number.isFinite(
          target
        )
      ) {
        throw new Error(
          "INVALID_CONTINUOUS_BOOTSTRAP_ROW"
        );
      }

      sourceX[index] =
        feature;

      sourceY[index] =
        target;
    }

    const observedBeta =
      calculateBeta({
        x:
          sourceX,

        y:
          sourceY,
      });

    if (
      observedBeta === null
    ) {
      throw new Error(
        "INVALID_OBSERVED_CONTINUOUS_BETA"
      );
    }

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
        "NO_VALID_CONTINUOUS_BOOTSTRAP_BLOCKS"
      );
    }

    const random =
      createRandom(
        seed
      );

    const betaSamples = [];

    const maxAttempts =
      iterations *
      20;

    let attempts = 0;
    let rejectedIterations =
      0;

    while (
      betaSamples.length <
        iterations &&
      attempts <
        maxAttempts
    ) {
      attempts +=
        1;

      const sampledX =
        new Float64Array(
          rows.length
        );

      const sampledY =
        new Float64Array(
          rows.length
        );

      let sampled = 0;

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
          offset < take;
          offset += 1
        ) {
          sampledX[
            sampled +
            offset
          ] =
            sourceX[
              start +
              offset
            ];

          sampledY[
            sampled +
            offset
          ] =
            sourceY[
              start +
              offset
            ];
        }

        sampled +=
          take;
      }

      const beta =
        calculateBeta({
          x:
            sampledX,

          y:
            sampledY,
        });

      if (
        beta === null
      ) {
        rejectedIterations +=
          1;

        continue;
      }

      betaSamples.push(
        beta
      );
    }

    if (
      betaSamples.length <
      iterations
    ) {
      throw new Error(
        `INSUFFICIENT_VALID_CONTINUOUS_BOOTSTRAP_ITERATIONS: ${betaSamples.length}/${iterations}`
      );
    }

    const confidenceInterval =
      getInterval(
        betaSamples
      );

    return {
      config: {
        blockSize,
        iterations,
        seed,
        attempts,
        rejectedIterations,

        validBlockStartCount:
          validBlockStarts.length,
      },

      observed: {
        beta:
          observedBeta,
      },

      beta: {
        confidenceInterval,

        excludesZero:
          confidenceInterval
            .lower > 0 ||
          confidenceInterval
            .upper < 0,
      },
    };
  };

module.exports = {
  calculateContinuousMovingBlockBootstrap,
};