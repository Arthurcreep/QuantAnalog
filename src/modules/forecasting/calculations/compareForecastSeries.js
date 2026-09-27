const EPSILON =
  1e-15;

const mean = (
  values
) => {
  if (
    !Array.isArray(
      values
    ) ||
    values.length ===
      0
  ) {
    return null;
  }

  return values.reduce(
    (
      sum,
      value
    ) =>
      sum + value,
    0
  ) /
    values.length;
};

const toTimestamp = (
  value,
  field
) => {
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
      `INVALID_FORECAST_COMPARISON_${field}`
    );
  }

  return timestamp;
};

const areClose = (
  first,
  second
) => {
  const scale =
    Math.max(
      1,
      Math.abs(
        first
      ),
      Math.abs(
        second
      )
    );

  return (
    Math.abs(
      first -
      second
    ) <=
    1e-12 *
      scale
  );
};

const getMetricValues = (
  horizonResult
) => {
  if (
    !horizonResult ||
    !horizonResult
      .evaluation ||
    !horizonResult
      .evaluation
      .metrics
  ) {
    return null;
  }

  const metrics =
    horizonResult
      .evaluation
      .metrics;

  const actual =
    Number(
      metrics
        .volatility
        .actual
    );

  const absoluteError =
    Number(
      metrics
        .volatility
        .absoluteError
    );

  const squaredError =
    Number(
      metrics
        .volatility
        .squaredError
    );

  const qlike =
    Number(
      metrics.qlike
    );

  if (
    !Number.isFinite(
      actual
    ) ||
    !Number.isFinite(
      absoluteError
    ) ||
    !Number.isFinite(
      squaredError
    ) ||
    !Number.isFinite(
      qlike
    )
  ) {
    throw new Error(
      "INVALID_FORECAST_COMPARISON_METRICS"
    );
  }

  return {
    actual,
    absoluteError,
    squaredError,
    qlike,
  };
};

const buildRunMap = (
  series
) => {
  const map =
    new Map();

  for (
    const run of
      series.runs
  ) {
    const issuedAt =
      new Date(
        run.issuedAt
      ).toISOString();

    if (
      map.has(
        issuedAt
      )
    ) {
      throw new Error(
        `DUPLICATE_FORECAST_SERIES_ISSUE_TIME:${issuedAt}`
      );
    }

    map.set(
      issuedAt,
      run
    );
  }

  return map;
};

const compareLoss = ({
  candidateLoss,
  benchmarkLoss,
}) => {
  const advantage =
    benchmarkLoss -
    candidateLoss;

  if (
    advantage >
    EPSILON
  ) {
    return {
      advantage,

      result:
        "CANDIDATE_BETTER",
    };
  }

  if (
    advantage <
    -EPSILON
  ) {
    return {
      advantage,

      result:
        "BENCHMARK_BETTER",
    };
  }

  return {
    advantage:
      0,

    result:
      "TIE",
  };
};

const aggregateMetric =
  ({
    pairs,
    candidateField,
    benchmarkField,
    advantageField,
  }) => {
    if (
      pairs.length ===
      0
    ) {
      return {
        candidateMean:
          null,

        benchmarkMean:
          null,

        meanAdvantage:
          null,

        candidateBetterCount:
          0,

        benchmarkBetterCount:
          0,

        tieCount:
          0,

        candidateWinRate:
          null,
      };
    }

    const candidateValues =
      pairs.map(
        (pair) =>
          pair[
            candidateField
          ]
      );

    const benchmarkValues =
      pairs.map(
        (pair) =>
          pair[
            benchmarkField
          ]
      );

    const advantages =
      pairs.map(
        (pair) =>
          pair[
            advantageField
          ]
      );

    let candidateBetterCount =
      0;

    let benchmarkBetterCount =
      0;

    let tieCount =
      0;

    for (
      const advantage of
        advantages
    ) {
      if (
        advantage >
        EPSILON
      ) {
        candidateBetterCount +=
          1;
      } else if (
        advantage <
        -EPSILON
      ) {
        benchmarkBetterCount +=
          1;
      } else {
        tieCount +=
          1;
      }
    }

    return {
      candidateMean:
        mean(
          candidateValues
        ),

      benchmarkMean:
        mean(
          benchmarkValues
        ),

      meanAdvantage:
        mean(
          advantages
        ),

      candidateBetterCount,

      benchmarkBetterCount,

      tieCount,

      candidateWinRate:
        candidateBetterCount /
        pairs.length,
    };
  };

const assertComparableContext = ({
  candidate,
  benchmark,
}) => {
  const fields = [
    "venue",
    "instrument",
    "marketType",
    "datasetType",
    "modelTimeframe",
    "target",
  ];

  for (
    const field of
      fields
  ) {
    if (
      candidate
        .context[
          field
        ] !==
      benchmark
        .context[
          field
        ]
    ) {
      throw new Error(
        `FORECAST_COMPARISON_CONTEXT_MISMATCH:${field}`
      );
    }
  }
};

const assertMatchingTargetWindow = ({
  candidateHorizon,
  benchmarkHorizon,
  issuedAt,
  horizon,
}) => {
  const candidateStartMs =
    toTimestamp(
      candidateHorizon
        .targetWindowStartAt,
      "CANDIDATE_TARGET_START"
    );

  const benchmarkStartMs =
    toTimestamp(
      benchmarkHorizon
        .targetWindowStartAt,
      "BENCHMARK_TARGET_START"
    );

  const candidateEndMs =
    toTimestamp(
      candidateHorizon
        .targetWindowEndAt,
      "CANDIDATE_TARGET_END"
    );

  const benchmarkEndMs =
    toTimestamp(
      benchmarkHorizon
        .targetWindowEndAt,
      "BENCHMARK_TARGET_END"
    );

  if (
    candidateStartMs !==
      benchmarkStartMs ||
    candidateEndMs !==
      benchmarkEndMs
  ) {
    throw new Error(
      `FORECAST_COMPARISON_TARGET_WINDOW_MISMATCH:${issuedAt}:${horizon}`
    );
  }

  return {
    targetWindowStartAt:
      new Date(
        candidateStartMs
      ).toISOString(),

    targetWindowEndAt:
      new Date(
        candidateEndMs
      ).toISOString(),
  };
};

const compareForecastSeries = ({
  candidate,
  benchmark,
}) => {
  if (
    !candidate ||
    !benchmark
  ) {
    throw new Error(
      "FORECAST_COMPARISON_SERIES_REQUIRED"
    );
  }

  assertComparableContext({
    candidate,
    benchmark,
  });

  const candidateRuns =
    buildRunMap(
      candidate
    );

  const benchmarkRuns =
    buildRunMap(
      benchmark
    );

  const commonHorizons =
    candidate.horizons.filter(
      (horizon) =>
        benchmark
          .horizons
          .includes(
            horizon
          )
    );

  if (
    commonHorizons.length ===
    0
  ) {
    throw new Error(
      "FORECAST_COMPARISON_HAS_NO_COMMON_HORIZONS"
    );
  }

  const commonIssuedAt =
    [
      ...candidateRuns
        .keys(),
    ].filter(
      (issuedAt) =>
        benchmarkRuns.has(
          issuedAt
        )
    );

  commonIssuedAt.sort(
    (
      first,
      second
    ) =>
      new Date(
        first
      ).getTime() -
      new Date(
        second
      ).getTime()
  );

  const horizons =
    {};

  for (
    const horizon of
      commonHorizons
  ) {
    const pairs =
      [];

    for (
      const issuedAt of
        commonIssuedAt
    ) {
      const candidateRun =
        candidateRuns.get(
          issuedAt
        );

      const benchmarkRun =
        benchmarkRuns.get(
          issuedAt
        );

      const candidateHorizon =
        candidateRun
          .horizons[
            horizon
          ];

      const benchmarkHorizon =
        benchmarkRun
          .horizons[
            horizon
          ];

      if (
        !candidateHorizon ||
        !benchmarkHorizon
      ) {
        continue;
      }

      const candidateMetrics =
        getMetricValues(
          candidateHorizon
        );

      const benchmarkMetrics =
        getMetricValues(
          benchmarkHorizon
        );

      if (
        !candidateMetrics ||
        !benchmarkMetrics
      ) {
        continue;
      }

      const targetWindow =
        assertMatchingTargetWindow({
          candidateHorizon,

          benchmarkHorizon,

          issuedAt,

          horizon,
        });

      if (
        !areClose(
          candidateMetrics
            .actual,
          benchmarkMetrics
            .actual
        )
      ) {
        throw new Error(
          `FORECAST_COMPARISON_ACTUAL_MISMATCH:${issuedAt}:${horizon}`
        );
      }

      const candidatePrediction =
        Number(
          candidateHorizon
            .prediction
            .value
        );

      const benchmarkPrediction =
        Number(
          benchmarkHorizon
            .prediction
            .value
        );

      if (
        !Number.isFinite(
          candidatePrediction
        ) ||
        !Number.isFinite(
          benchmarkPrediction
        )
      ) {
        throw new Error(
          `INVALID_FORECAST_COMPARISON_PREDICTION:${issuedAt}:${horizon}`
        );
      }

      const absoluteErrorComparison =
        compareLoss({
          candidateLoss:
            candidateMetrics
              .absoluteError,

          benchmarkLoss:
            benchmarkMetrics
              .absoluteError,
        });

      const squaredErrorComparison =
        compareLoss({
          candidateLoss:
            candidateMetrics
              .squaredError,

          benchmarkLoss:
            benchmarkMetrics
              .squaredError,
        });

      const qlikeComparison =
        compareLoss({
          candidateLoss:
            candidateMetrics
              .qlike,

          benchmarkLoss:
            benchmarkMetrics
              .qlike,
        });

      pairs.push({
        issuedAt,

        targetWindowStartAt:
          targetWindow
            .targetWindowStartAt,

        targetWindowEndAt:
          targetWindow
            .targetWindowEndAt,

        candidateForecastRunId:
          candidateRun
            .forecastRunId,

        benchmarkForecastRunId:
          benchmarkRun
            .forecastRunId,

        candidateForecastId:
          candidateHorizon
            .forecastId,

        benchmarkForecastId:
          benchmarkHorizon
            .forecastId,

        actual:
          candidateMetrics
            .actual,

        candidatePrediction,

        benchmarkPrediction,

        candidateAbsoluteError:
          candidateMetrics
            .absoluteError,

        benchmarkAbsoluteError:
          benchmarkMetrics
            .absoluteError,

        absoluteErrorAdvantage:
          absoluteErrorComparison
            .advantage,

        absoluteErrorResult:
          absoluteErrorComparison
            .result,

        candidateSquaredError:
          candidateMetrics
            .squaredError,

        benchmarkSquaredError:
          benchmarkMetrics
            .squaredError,

        squaredErrorAdvantage:
          squaredErrorComparison
            .advantage,

        squaredErrorResult:
          squaredErrorComparison
            .result,

        candidateQlike:
          candidateMetrics
            .qlike,

        benchmarkQlike:
          benchmarkMetrics
            .qlike,

        qlikeAdvantage:
          qlikeComparison
            .advantage,

        qlikeResult:
          qlikeComparison
            .result,
      });
    }

    horizons[
      horizon
    ] = {
      horizon,

      pairedCount:
        pairs.length,

      absoluteError:
        aggregateMetric({
          pairs,

          candidateField:
            "candidateAbsoluteError",

          benchmarkField:
            "benchmarkAbsoluteError",

          advantageField:
            "absoluteErrorAdvantage",
        }),

      squaredError:
        aggregateMetric({
          pairs,

          candidateField:
            "candidateSquaredError",

          benchmarkField:
            "benchmarkSquaredError",

          advantageField:
            "squaredErrorAdvantage",
        }),

      qlike:
        aggregateMetric({
          pairs,

          candidateField:
            "candidateQlike",

          benchmarkField:
            "benchmarkQlike",

          advantageField:
            "qlikeAdvantage",
        }),

      pairs,
    };
  }

  return {
    commonIssueCount:
      commonIssuedAt.length,

    firstCommonIssuedAt:
      commonIssuedAt.length > 0
        ? commonIssuedAt[0]
        : null,

    lastCommonIssuedAt:
      commonIssuedAt.length > 0
        ? commonIssuedAt[
            commonIssuedAt.length -
            1
          ]
        : null,

    horizons,
  };
};

module.exports = {
  compareForecastSeries,
};