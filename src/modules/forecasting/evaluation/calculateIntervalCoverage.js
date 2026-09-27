const DEFAULT_HORIZONS = [
  "1h",
  "6h",
  "1d",
  "3d",
  "5d",
];

const validateFinite = ({
  value,
  field,
}) => {
  const numeric =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    throw new Error(
      `INVALID_INTERVAL_COVERAGE_${field}`
    );
  }

  return numeric;
};

const calculateIntervalCoverage =
  ({
    rows,
    horizons =
      DEFAULT_HORIZONS,
  }) => {
    if (
      !Array.isArray(
        rows
      ) ||
      rows.length === 0
    ) {
      throw new Error(
        "EMPTY_INTERVAL_COVERAGE_ROWS"
      );
    }

    const groups =
      new Map();

    for (
      const horizon of
        horizons
    ) {
      groups.set(
        horizon,
        {
          horizon,

          count:
            0,

          inside:
            0,

          below:
            0,

          above:
            0,

          intervalWidthSum:
            0,

          confidenceLevel:
            null,
        }
      );
    }

    for (
      const row of
        rows
    ) {
      const group =
        groups.get(
          row.horizon
        );

      if (!group) {
        continue;
      }

      const interval =
        row
          .prediction
          ?.interval;

      if (!interval) {
        throw new Error(
          `FORECAST_INTERVAL_MISSING:${row.horizon}`
        );
      }

      const lower =
        validateFinite({
          value:
            interval.lower,

          field:
            "LOWER",
        });

      const upper =
        validateFinite({
          value:
            interval.upper,

          field:
            "UPPER",
        });

      const actual =
        validateFinite({
          value:
            row.actual
              ?.value,

          field:
            "ACTUAL",
        });

      const confidenceLevel =
        validateFinite({
          value:
            interval
              .confidenceLevel,

          field:
            "CONFIDENCE_LEVEL",
        });

      if (
        lower >
        upper
      ) {
        throw new Error(
          "INVALID_INTERVAL_COVERAGE_BOUNDS"
        );
      }

      if (
        confidenceLevel <= 0 ||
        confidenceLevel >= 1
      ) {
        throw new Error(
          "INVALID_INTERVAL_COVERAGE_CONFIDENCE_LEVEL"
        );
      }

      if (
        group
          .confidenceLevel ===
        null
      ) {
        group
          .confidenceLevel =
          confidenceLevel;
      } else if (
        group
          .confidenceLevel !==
        confidenceLevel
      ) {
        throw new Error(
          `MIXED_INTERVAL_CONFIDENCE_LEVEL:${row.horizon}`
        );
      }

      group.count +=
        1;

      group.intervalWidthSum +=
        upper -
        lower;

      if (
        actual <
        lower
      ) {
        group.below +=
          1;
      } else if (
        actual >
        upper
      ) {
        group.above +=
          1;
      } else {
        group.inside +=
          1;
      }
    }

    const results =
      horizons.map(
        (horizon) => {
          const group =
            groups.get(
              horizon
            );

          if (
            group.count ===
            0
          ) {
            throw new Error(
              `INTERVAL_COVERAGE_HORIZON_EMPTY:${horizon}`
            );
          }

          const coverage =
            group.inside /
            group.count;

          return {
            horizon,

            observationCount:
              group.count,

            nominalCoverage:
              group
                .confidenceLevel,

            empiricalCoverage:
              coverage,

            coverageError:
              coverage -
              group
                .confidenceLevel,

            inside:
              group.inside,

            below:
              group.below,

            above:
              group.above,

            meanIntervalWidth:
              group
                .intervalWidthSum /
              group.count,
          };
        }
      );

    return {
      totalObservationCount:
        results.reduce(
          (
            sum,
            item
          ) =>
            sum +
            item
              .observationCount,
          0
        ),

      horizons:
        results,
    };
  };

module.exports = {
  DEFAULT_HORIZONS,
  calculateIntervalCoverage,
};