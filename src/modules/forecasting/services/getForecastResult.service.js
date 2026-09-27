const {
  getForecastRun,
} = require(
  "./getForecastRun.service"
);

const {
  getForecastRunEvaluation,
} = require(
  "./getForecastRunEvaluation.service"
);

const {
  getForecastPerformance,
} = require(
  "./getForecastPerformance.service"
);

const {
  getForecastComparisonPerformance,
} = require(
  "./getForecastComparisonPerformance.service"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "forecast-result-v1.0";

const resolveIntervalAssessment = ({
  prediction,
  actual,
}) => {
  const interval =
    prediction
      ?.interval;

  if (
    !interval ||
    !actual
  ) {
    return null;
  }

  const lower =
    Number(
      interval.lower
    );

  const upper =
    Number(
      interval.upper
    );

  const actualValue =
    Number(
      actual.value
    );

  const confidenceLevel =
    Number(
      interval
        .confidenceLevel
    );

  if (
    !Number.isFinite(
      lower
    ) ||
    !Number.isFinite(
      upper
    ) ||
    !Number.isFinite(
      actualValue
    ) ||
    lower >
      upper
  ) {
    throw new Error(
      "INVALID_FORECAST_RESULT_INTERVAL"
    );
  }

  let position =
    "INSIDE";

  if (
    actualValue <
    lower
  ) {
    position =
      "BELOW";
  } else if (
    actualValue >
    upper
  ) {
    position =
      "ABOVE";
  }

  return {
    confidenceLevel:
      Number.isFinite(
        confidenceLevel
      )
        ? confidenceLevel
        : null,

    lower,

    upper,

    width:
      upper -
      lower,

    actual:
      actualValue,

    covered:
      position ===
      "INSIDE",

    position,
  };
};

const buildCurrentForecast = (
  item
) => {
  const evaluation =
    item.evaluation ||
    null;

  return {
    position:
      item.position,

    horizon:
      item.horizon,

    horizonBars:
      item.horizonBars,

    status:
      item.status,

    forecastId:
      item.forecastId,

    targetWindowStartAt:
      item
        .targetWindowStartAt,

    targetWindowEndAt:
      item
        .targetWindowEndAt,

    prediction:
      item.prediction,

    actual:
      item.actual,

    intervalAssessment:
      resolveIntervalAssessment({
        prediction:
          item.prediction,

        actual:
          item.actual,
      }),

    evaluation:
      evaluation
        ? {
            id:
              evaluation.id,

            evaluatorId:
              evaluation
                .evaluatorId,

            evaluatorVersion:
              evaluation
                .evaluatorVersion,

            evaluatorChecksum:
              evaluation
                .evaluatorChecksum,

            metrics:
              evaluation
                .metrics,
          }
        : null,
  };
};

const buildLifecycleStatus = (
  summary
) => {
  if (
    summary
      .pendingOutcomeCount >
    0
  ) {
    return "WAITING_FOR_OUTCOMES";
  }

  if (
    summary
      .maturedUnevaluatedCount >
    0
  ) {
    return "WAITING_FOR_EVALUATION";
  }

  if (
    summary
      .forecastCount >
      0 &&
    summary
      .forecastCount ===
      summary
        .evaluatedCount
  ) {
    return "EVALUATED";
  }

  return "UNKNOWN";
};

const validateBenchmarkRunId = (
  benchmarkForecastRunId
) => {
  if (
    benchmarkForecastRunId ===
      null ||
    benchmarkForecastRunId ===
      undefined
  ) {
    return;
  }

  if (
    typeof benchmarkForecastRunId !==
      "string" ||
    benchmarkForecastRunId
      .trim()
      .length ===
      0
  ) {
    throw createAppError({
      statusCode:
        400,

      code:
        "INVALID_BENCHMARK_FORECAST_RUN_ID",

      message:
        "benchmarkForecastRunId must be a non-empty string",
    });
  }
};

const getForecastResult =
  async ({
    forecastRunId,
    benchmarkForecastRunId =
      null,
    rollingWindow =
      30,
    rollingMinObservations =
      5,
  }, options = {}) => {
    validateBenchmarkRunId(
      benchmarkForecastRunId
    );

    const [
      runResult,
      evaluationResult,
      performance,
    ] =
      await Promise.all([
        getForecastRun(
          {
            forecastRunId,
          },
          options
        ),

        getForecastRunEvaluation(
          {
            forecastRunId,
          },
          options
        ),

        getForecastPerformance(
          {
            forecastRunId,

            rollingWindow,

            rollingMinObservations,
          },
          options
        ),
      ]);

    let baselineComparison =
      null;

    if (
      benchmarkForecastRunId
    ) {
      baselineComparison =
        await getForecastComparisonPerformance(
          {
            candidateForecastRunId:
              forecastRunId,

            benchmarkForecastRunId,

            rollingWindow,
          },
          options
        );
    }

    const currentForecasts =
      evaluationResult
        .evaluations
        .map(
          buildCurrentForecast
        );

    const intervalAssessments =
      currentForecasts
        .map(
          (item) =>
            item
              .intervalAssessment
        )
        .filter(
          Boolean
        );

    const intervalCoveredCount =
      intervalAssessments
        .filter(
          (item) =>
            item.covered
        )
        .length;

    const forecastRun =
      runResult
        .forecastRun;

    return {
      engineVersion:
        ENGINE_VERSION,

      forecastRun: {
        id:
          forecastRun.id,

        runKey:
          forecastRun.runKey,

        issuedAt:
          forecastRun.issuedAt,

        inputCutoffAt:
          forecastRun
            .inputCutoffAt,

        target:
          forecastRun.target,

        modelTimeframe:
          forecastRun
            .modelTimeframe,

        horizons:
          forecastRun.horizons,

        sourceAnalysisRunId:
          forecastRun
            .sourceAnalysisRunId,
      },

      dataset: {
        id:
          forecastRun
            .datasetId,

        checksum:
          forecastRun
            .datasetChecksum,
      },

      model:
        evaluationResult
          .model,

      protocol:
        evaluationResult
          .protocol,

      lifecycle: {
        status:
          buildLifecycleStatus(
            evaluationResult
              .summary
          ),

        ...evaluationResult
          .summary,
      },

      currentForecasts,

      currentRunIntervalAssessment: {
        observationCount:
          intervalAssessments
            .length,

        coveredCount:
          intervalCoveredCount,

        coverage:
          intervalAssessments
            .length >
          0
            ? intervalCoveredCount /
              intervalAssessments
                .length
            : null,

        note:
          "CURRENT_RUN_ONLY_NOT_HISTORICAL_CALIBRATION",
      },

      performance,

      baselineComparison,

      validation: {
        historicalSeriesStatus:
          performance
            .runCount >
          1
            ? "HISTORICAL_SERIES_AVAILABLE"
            : "SINGLE_RUN_ONLY",

        runCount:
          performance
            .runCount,

        firstIssuedAt:
          performance
            .firstIssuedAt,

        lastIssuedAt:
          performance
            .lastIssuedAt,

        baselineComparisonAvailable:
          baselineComparison !==
          null,
      },
    };
  };

module.exports = {
  ENGINE_VERSION,
  getForecastResult,
};