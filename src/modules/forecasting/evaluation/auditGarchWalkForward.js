const calculateMean = (
  values
) => {
  if (
    !Array.isArray(
      values
    ) ||
    values.length === 0
  ) {
    return null;
  }

  return values.reduce(
    (sum, value) =>
      sum + value,
    0
  ) /
    values.length;
};

const calculatePercentile = ({
  values,
  probability,
}) => {
  if (
    !Array.isArray(
      values
    ) ||
    values.length === 0
  ) {
    return null;
  }

  const sorted =
    [...values].sort(
      (a, b) =>
        a - b
    );

  const position =
    probability *
    (
      sorted.length - 1
    );

  const lower =
    Math.floor(
      position
    );

  const upper =
    Math.ceil(
      position
    );

  if (
    lower === upper
  ) {
    return sorted[
      lower
    ];
  }

  const weight =
    position -
    lower;

  return (
    sorted[lower] *
      (
        1 -
        weight
      ) +
    sorted[upper] *
      weight
  );
};

const summarizeDistribution = (
  values
) => {
  if (
    !Array.isArray(
      values
    ) ||
    values.length === 0
  ) {
    return {
      count:
        0,

      min:
        null,

      p25:
        null,

      median:
        null,

      p75:
        null,

      p90:
        null,

      p95:
        null,

      max:
        null,

      mean:
        null,
    };
  }

  return {
    count:
      values.length,

    min:
      Math.min(
        ...values
      ),

    p25:
      calculatePercentile({
        values,

        probability:
          0.25,
      }),

    median:
      calculatePercentile({
        values,

        probability:
          0.5,
      }),

    p75:
      calculatePercentile({
        values,

        probability:
          0.75,
      }),

    p90:
      calculatePercentile({
        values,

        probability:
          0.9,
      }),

    p95:
      calculatePercentile({
        values,

        probability:
          0.95,
      }),

    max:
      Math.max(
        ...values
      ),

    mean:
      calculateMean(
        values
      ),
  };
};

const summarizeForecastGroup = ({
  indices,
  baselineRows,
  garchRows,
}) => {
  if (
    indices.length ===
    0
  ) {
    return {
      count:
        0,

      absoluteError: {
        baselineMean:
          null,

        garchMean:
          null,

        meanDifference:
          null,
      },

      squaredError: {
        baselineMean:
          null,

        garchMean:
          null,

        meanDifference:
          null,
      },

      qlike: {
        baselineMean:
          null,

        garchMean:
          null,

        meanDifference:
          null,
      },
    };
  }

  const summarizeField = (
    field
  ) => {
    const baselineValues =
      indices.map(
        (index) =>
          Number(
            baselineRows[
              index
            ][field]
          )
      );

    const garchValues =
      indices.map(
        (index) =>
          Number(
            garchRows[
              index
            ][field]
          )
      );

    const baselineMean =
      calculateMean(
        baselineValues
      );

    const garchMean =
      calculateMean(
        garchValues
      );

    return {
      baselineMean,

      garchMean,

      meanDifference:
        baselineMean -
        garchMean,
    };
  };

  return {
    count:
      indices.length,

    absoluteError:
      summarizeField(
        "absoluteError"
      ),

    squaredError:
      summarizeField(
        "squaredError"
      ),

    qlike:
      summarizeField(
        "qlike"
      ),
  };
};

const auditGarchWalkForward =
  ({
    baselineRows,
    garchRows,
    diagnostics,
    persistenceMaximum,
    maxIterations,
  }) => {
    if (
      !Array.isArray(
        baselineRows
      ) ||
      !Array.isArray(
        garchRows
      ) ||
      baselineRows.length !==
        garchRows.length
    ) {
      throw new Error(
        "INVALID_GARCH_AUDIT_FORECAST_ROWS"
      );
    }

    if (
      !diagnostics ||
      !Array.isArray(
        diagnostics.fits
      )
    ) {
      throw new Error(
        "INVALID_GARCH_AUDIT_DIAGNOSTICS"
      );
    }

    if (
      !Number.isFinite(
        persistenceMaximum
      )
    ) {
      throw new Error(
        "INVALID_GARCH_AUDIT_PERSISTENCE_MAXIMUM"
      );
    }

    if (
      !Number.isInteger(
        maxIterations
      ) ||
      maxIterations <= 0
    ) {
      throw new Error(
        "INVALID_GARCH_AUDIT_MAX_ITERATIONS"
      );
    }

    const fits =
      diagnostics.fits;

    const persistenceValues =
      [];

    const iterationValues =
      [];

    const likelihoodImprovements =
      [];

    const convergedFitIndices =
      [];

    const nonConvergedFitIndices =
      [];

    let persistenceCeilingCount =
      0;

    let maxIterationCount =
      0;

    let convergedCount =
      0;

    let nonConvergedCount =
      0;

    const fitSummaries =
      fits.map(
        (fit) => {
          const persistence =
            Number(
              fit
                .parameters
                .persistence
            );

          const iterations =
            Number(
              fit
                .optimization
                .iterations
            );

          const improvement =
            Number(
              fit
                .optimization
                .improvement
            );

          if (
            !Number.isFinite(
              persistence
            ) ||
            !Number.isFinite(
              iterations
            ) ||
            !Number.isFinite(
              improvement
            )
          ) {
            throw new Error(
              "INVALID_GARCH_AUDIT_FIT"
            );
          }

          persistenceValues.push(
            persistence
          );

          iterationValues.push(
            iterations
          );

          likelihoodImprovements.push(
            improvement
          );

          const converged =
            fit
              .optimization
              .converged ===
            true;

          const atPersistenceCeiling =
            Math.abs(
              persistenceMaximum -
              persistence
            ) <=
            1e-9;

          const hitMaxIterations =
            iterations >=
            maxIterations;

          if (converged) {
            convergedCount +=
              1;

            convergedFitIndices.push(
              fit.fitNumber
            );
          } else {
            nonConvergedCount +=
              1;

            nonConvergedFitIndices.push(
              fit.fitNumber
            );
          }

          if (
            atPersistenceCeiling
          ) {
            persistenceCeilingCount +=
              1;
          }

          if (
            hitMaxIterations
          ) {
            maxIterationCount +=
              1;
          }

          return {
            fitNumber:
              fit.fitNumber,

            fittedAt:
              fit.fittedAt,

            forecastStartIndex:
              fit
                .forecastStartIndex,

            forecastEndIndex:
              fit
                .forecastEndIndex,

            forecastCount:
              fit
                .forecastEndIndex -
              fit
                .forecastStartIndex +
              1,

            converged,

            hitMaxIterations,

            atPersistenceCeiling,

            parameters: {
              omega:
                fit
                  .parameters
                  .omega,

              alpha:
                fit
                  .parameters
                  .alpha,

              beta:
                fit
                  .parameters
                  .beta,

              persistence,
            },

            optimization: {
              iterations,

              improvement,

              negativeLogLikelihood:
                fit
                  .optimization
                  .negativeLogLikelihood,
            },
          };
        }
      );

    const convergedForecastIndices =
      [];

    const nonConvergedForecastIndices =
      [];

    for (
      const fit of
      fitSummaries
    ) {
      for (
        let index =
          fit
            .forecastStartIndex;
        index <=
          fit
            .forecastEndIndex;
        index += 1
      ) {
        if (
          index < 0 ||
          index >=
            garchRows.length
        ) {
          throw new Error(
            "GARCH_AUDIT_FORECAST_INDEX_OUT_OF_RANGE"
          );
        }

        if (
          fit.converged
        ) {
          convergedForecastIndices.push(
            index
          );
        } else {
          nonConvergedForecastIndices.push(
            index
          );
        }
      }
    }

    const assignedForecastCount =
      convergedForecastIndices
        .length +
      nonConvergedForecastIndices
        .length;

    if (
      assignedForecastCount !==
      garchRows.length
    ) {
      throw new Error(
        `GARCH_AUDIT_FORECAST_ASSIGNMENT_MISMATCH:${assignedForecastCount}/${garchRows.length}`
      );
    }

    return {
      fitCount:
        fits.length,

      convergence: {
        convergedCount,

        nonConvergedCount,

        maxIterationCount,

        persistenceCeilingCount,
      },

      persistence:
        summarizeDistribution(
          persistenceValues
        ),

      iterations:
        summarizeDistribution(
          iterationValues
        ),

      likelihoodImprovement:
        summarizeDistribution(
          likelihoodImprovements
        ),

      forecastExposure: {
        totalForecasts:
          garchRows.length,

        fromConvergedFits:
          convergedForecastIndices
            .length,

        fromNonConvergedFits:
          nonConvergedForecastIndices
            .length,
      },

      lossByFitConvergence: {
        converged:
          summarizeForecastGroup({
            indices:
              convergedForecastIndices,

            baselineRows,

            garchRows,
          }),

        nonConverged:
          summarizeForecastGroup({
            indices:
              nonConvergedForecastIndices,

            baselineRows,

            garchRows,
          }),
      },

      fitSummaries,

      nonConvergedFitNumbers:
        nonConvergedFitIndices,

      convergedFitNumbers:
        convergedFitIndices,
    };
  };

module.exports = {
  auditGarchWalkForward,
};