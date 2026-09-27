const {
  findForecastRunById,
  findForecastRunsBySeriesContext,
} = require(
  "../runs/forecastRun.repository"
);

const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  getForecastRunHistory,
} = require(
  "./getForecastRunHistory.service"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "forecast-series-v1.2";

const isSameInstrumentContext = ({
  sourceDataset,
  candidateDataset,
}) =>
  candidateDataset.venue ===
    sourceDataset.venue &&
  candidateDataset.instrument ===
    sourceDataset.instrument &&
  candidateDataset.marketType ===
    sourceDataset.marketType &&
  candidateDataset.datasetType ===
    sourceDataset.datasetType &&
  candidateDataset.sourceTimeframe ===
    sourceDataset.sourceTimeframe;

const getLatestEvaluation = (
  evaluations
) => {
  if (
    !Array.isArray(
      evaluations
    ) ||
    evaluations.length ===
      0
  ) {
    return null;
  }

  return [...evaluations]
    .sort(
      (
        first,
        second
      ) =>
        new Date(
          first.created_at
        ).getTime() -
        new Date(
          second.created_at
        ).getTime()
    )
    .at(-1);
};

const buildSeriesRun =
  async (
    forecastRun,
    options
  ) => {
    const historyResult =
      await getForecastRunHistory(
        {
          forecastRunId:
            forecastRun.id,
        },
        options
      );

    const horizons =
      {};

    for (
      const item of
        historyResult.history
    ) {
      horizons[
        item.horizon
      ] = {
        forecastId:
          item
            .forecast
            .id,

        horizonBars:
          item.horizonBars,

        status:
          item.status,

        targetWindowStartAt:
          item
            .forecast
            .targetWindowStartAt,

        targetWindowEndAt:
          item
            .forecast
            .targetWindowEndAt,

        prediction:
          item
            .forecast
            .prediction,

        actual:
          item.outcome
            ? item
                .outcome
                .actual
            : null,

        evaluation:
          getLatestEvaluation(
            item.evaluations
          ),
      };
    }

    return {
      forecastRunId:
        forecastRun.id,

      datasetId:
        forecastRun.datasetId,

      datasetChecksum:
        forecastRun
          .datasetChecksum,

      sourceAnalysisRunId:
        forecastRun
          .sourceAnalysisRunId,

      issuedAt:
        forecastRun
          .issuedAt,

      summary:
        historyResult.summary,

      horizons,
    };
  };

const getForecastSeries =
  async ({
    forecastRunId,
  }, options = {}) => {
    const sourceRun =
      await findForecastRunById(
        forecastRunId,
        options
      );

    if (!sourceRun) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_RUN_NOT_FOUND",

        message:
          `ForecastRun ${forecastRunId} not found`,
      });
    }

    const sourceDataset =
      await findDatasetById(
        sourceRun.datasetId,
        options
      );

    if (!sourceDataset) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_SERIES_SOURCE_DATASET_NOT_FOUND",

        message:
          `Dataset ${sourceRun.datasetId} not found`,
      });
    }

    const candidateRuns =
      await findForecastRunsBySeriesContext(
        {
          sourceAnalysisRunId:
            sourceRun
              .sourceAnalysisRunId,

          modelId:
            sourceRun.modelId,

          modelVersion:
            sourceRun.modelVersion,

          modelChecksum:
            sourceRun.modelChecksum,

          protocolId:
            sourceRun.protocolId,

          protocolVersion:
            sourceRun.protocolVersion,

          protocolChecksum:
            sourceRun.protocolChecksum,

          target:
            sourceRun.target,

          modelTimeframe:
            sourceRun
              .modelTimeframe,
        },
        options
      );

    const compatibleRuns =
      [];

    for (
      const candidateRun of
        candidateRuns
    ) {
      const candidateDataset =
        await findDatasetById(
          candidateRun.datasetId,
          options
        );

      if (
        !candidateDataset
      ) {
        continue;
      }

      if (
        !isSameInstrumentContext({
          sourceDataset,

          candidateDataset,
        })
      ) {
        continue;
      }

      compatibleRuns.push(
        candidateRun
      );
    }

    const runs =
      [];

    for (
      const forecastRun of
        compatibleRuns
    ) {
      runs.push(
        await buildSeriesRun(
          forecastRun,
          options
        )
      );
    }

    return {
      engineVersion:
        ENGINE_VERSION,

      context: {
        venue:
          sourceDataset.venue,

        instrument:
          sourceDataset.instrument,

        marketType:
          sourceDataset.marketType,

        datasetType:
          sourceDataset.datasetType,

        modelTimeframe:
          sourceRun
            .modelTimeframe,

        target:
          sourceRun.target,
      },

      lineage: {
        sourceAnalysisRunId:
          sourceRun
            .sourceAnalysisRunId,
      },

      model: {
        id:
          sourceRun.modelId,

        version:
          sourceRun.modelVersion,

        checksum:
          sourceRun
            .modelChecksum,
      },

      protocol: {
        id:
          sourceRun.protocolId,

        version:
          sourceRun
            .protocolVersion,

        checksum:
          sourceRun
            .protocolChecksum,
      },

      horizons:
        sourceRun.horizons,

      runCount:
        runs.length,

      firstIssuedAt:
        runs.length > 0
          ? runs[0]
              .issuedAt
          : null,

      lastIssuedAt:
        runs.length > 0
          ? runs[
              runs.length - 1
            ].issuedAt
          : null,

      runs,
    };
  };

module.exports = {
  ENGINE_VERSION,
  getForecastSeries,
};