const isFinitePositive = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value) &&
  value > 0;

const parseTimestamp = ({
  value,
  field,
}) => {
  const timestamp =
    new Date(
      value
    ).getTime();

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    throw new Error(
      `INVALID_RECOVERY_TIMESTAMP:${field}`
    );
  }

  return timestamp;
};

const calculateRecoveryStats = ({
  startingCapital,
  startTimestamp,
  equityCurve,
}) => {
  if (
    !isFinitePositive(
      startingCapital
    )
  ) {
    throw new Error(
      "INVALID_STARTING_CAPITAL"
    );
  }

  if (
    !Array.isArray(
      equityCurve
    )
  ) {
    throw new Error(
      "INVALID_EQUITY_CURVE"
    );
  }

  const startTimeMs =
    parseTimestamp({
      value:
        startTimestamp,

      field:
        "START",
    });

  let peakEquity =
    startingCapital;

  let peakTimestamp =
    startTimestamp;

  let activeDrawdown =
    null;

  const completedRecoveries =
    [];

  let previousTimestampMs =
    startTimeMs;

  for (
    let index = 0;
    index <
    equityCurve.length;
    index += 1
  ) {
    const point =
      equityCurve[
        index
      ];

    if (
      !isFinitePositive(
        point.equityAfter
      )
    ) {
      throw new Error(
        `INVALID_RECOVERY_EQUITY:${index}`
      );
    }

    const pointTimestamp =
      point.timestamp;

    const pointTimestampMs =
      parseTimestamp({
        value:
          pointTimestamp,

        field:
          `POINT_${index}`,
      });

    if (
      pointTimestampMs <
      previousTimestampMs
    ) {
      throw new Error(
        `NON_CHRONOLOGICAL_EQUITY_CURVE:${index}`
      );
    }

    previousTimestampMs =
      pointTimestampMs;

    if (
      point.equityAfter <
      peakEquity
    ) {
      if (
        !activeDrawdown
      ) {
        activeDrawdown = {
          peakEquity,

          startedAt:
            peakTimestamp,

          startedAtMs:
            parseTimestamp({
              value:
                peakTimestamp,

              field:
                `PEAK_${index}`,
            }),
        };
      }

      continue;
    }

    if (
      activeDrawdown
    ) {
      completedRecoveries.push({
        startedAt:
          activeDrawdown
            .startedAt,

        recoveredAt:
          pointTimestamp,

        recoveryDurationMs:
          pointTimestampMs -
          activeDrawdown
            .startedAtMs,
      });

      activeDrawdown =
        null;
    }

    peakEquity =
      point.equityAfter;

    peakTimestamp =
      pointTimestamp;
  }

  const longestCompletedRecoveryMs =
    completedRecoveries.length >
      0
      ? Math.max(
          ...completedRecoveries.map(
            (recovery) =>
              recovery
                .recoveryDurationMs
          )
        )
      : null;

  const lastPoint =
    equityCurve.length >
      0
      ? equityCurve[
          equityCurve.length -
          1
        ]
      : null;

  const currentUnderwater =
    activeDrawdown !==
    null;

  const currentUnderwaterDurationMs =
    currentUnderwater &&
    lastPoint
      ? (
          parseTimestamp({
            value:
              lastPoint.timestamp,

            field:
              "LAST_POINT",
          }) -
          activeDrawdown
            .startedAtMs
        )
      : null;

  return {
    completedRecoveryCount:
      completedRecoveries.length,

    longestCompletedRecoveryMs,

    completedRecoveries,

    currentUnderwater,

    currentUnderwaterStartedAt:
      activeDrawdown
        ?.startedAt ??
      null,

    currentUnderwaterDurationMs,
  };
};

module.exports = {
  calculateRecoveryStats,
};