const sequelize = require(
  "../../../config/database"
);

const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  timeframeToMilliseconds,
} = require(
  "../../datasets/calculations/timeframeToMilliseconds"
);

const {
  buildLogReturnSeries,
} = require(
  "../../research/series/buildLogReturnSeries"
);

const {
  MODEL_DEFINITION,
  forecastHistoricalVolatilityBaseline,
} = require(
  "../models/historicalVolatilityBaselineV1"
);

const {
  HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1,
} = require(
  "../protocols/historicalVolatilityBaselineMultiHorizonV1"
);

const {
  resolveForecastHorizon,
} = require(
  "../horizons/resolveForecastHorizon"
);

const {
  issueForecast,
} = require(
  "./issueForecast.service"
);

const {
  issueForecastRun,
} = require(
  "./issueForecastRun.service"
);

const {
  createForecastRunItem,
  findForecastRunItem,
} = require(
  "../runs/forecastRunItem.repository"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "historical-volatility-multi-horizon-forecast-v1.0";

const INCOMPLETE_POLICY =
  "DROP_INCOMPLETE";

const filterReturnsAvailableAt = ({
  series,
  issuedAtMs,
  timeframeMs,
}) =>
  series.filter(
    (row) => {
      const timestampMs =
        new Date(
          row.timestamp
        ).getTime();

      if (
        !Number.isFinite(
          timestampMs
        )
      ) {
        throw new Error(
          "INVALID_BASELINE_RETURN_TIMESTAMP"
        );
      }

      return (
        timestampMs +
          timeframeMs <=
        issuedAtMs
      );
    }
  );

const ensureRunItem =
  async ({
    forecastRunId,
    forecastId,
    horizon,
    horizonBars,
    position,
  }, options) => {
    const existing =
      await findForecastRunItem(
        {
          forecastRunId,

          forecastId,
        },
        options
      );

    if (existing) {
      return {
        created:
          false,

        item:
          existing,
      };
    }

    const item =
      await createForecastRunItem(
        {
          forecastRunId,

          forecastId,

          horizon,

          horizonBars,

          position,
        },
        options
      );

    return {
      created:
        true,

      item,
    };
  };

const runCore =
  async ({
    datasetId,
    issuedAt,
    sourceAnalysisRunId,
  }, options) => {
    const dataset =
      await findDatasetById(
        datasetId,
        options
      );

    if (!dataset) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_DATASET_NOT_FOUND",

        message:
          `Dataset ${datasetId} not found`,
      });
    }

    if (
      dataset.stage !==
      "PREPARED"
    ) {
      throw new Error(
        "BASELINE_FORECAST_REQUIRES_PREPARED_DATASET"
      );
    }

    if (
      dataset.sourceTimeframe !==
      HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1
        .modelTimeframe
    ) {
      throw new Error(
        "BASELINE_FORECAST_TIMEFRAME_MISMATCH"
      );
    }

    const timeframeMs =
      timeframeToMilliseconds(
        dataset.sourceTimeframe
      );

    const issuedAtMs =
      new Date(
        issuedAt
      ).getTime();

    if (
      !Number.isFinite(
        issuedAtMs
      )
    ) {
      throw new Error(
        "INVALID_BASELINE_FORECAST_ISSUE_TIME"
      );
    }

    if (
      issuedAtMs %
        timeframeMs !==
      0
    ) {
      throw new Error(
        "BASELINE_FORECAST_ISSUE_TIME_NOT_ALIGNED"
      );
    }

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          INCOMPLETE_POLICY,
      });

    const availableSeries =
      filterReturnsAvailableAt({
        series:
          returns.series,

        issuedAtMs,

        timeframeMs,
      });

    const lookbackBars =
      HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1
        .lookbackBars;

    if (
      availableSeries.length <
      lookbackBars
    ) {
      throw new Error(
        "INSUFFICIENT_BASELINE_FORECAST_LOOKBACK"
      );
    }

    const horizonDefinitions =
      HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1
        .supportedHorizons
        .map(
          (horizon) =>
            resolveForecastHorizon({
              modelTimeframe:
                dataset.sourceTimeframe,

              horizon,
            })
        );

    const informationSet = {
      inputReturnCount:
        returns.returnCount,

      availableReturnCount:
        availableSeries.length,

      lookbackBars,

      inputCutoffAt:
        new Date(
          issuedAtMs
        ).toISOString(),
    };

    const runConfig = {
      engineVersion:
        ENGINE_VERSION,

      lookbackBars,

      incompletePolicy:
        INCOMPLETE_POLICY,

      informationSet,

      horizonDefinitions,
    };

    const runIssuance =
      await issueForecastRun(
        {
          dataset,

          sourceAnalysisRunId,

          modelDefinition:
            MODEL_DEFINITION,

          protocolDefinition:
            HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1,

          target:
            HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1
              .target,

          modelTimeframe:
            dataset.sourceTimeframe,

          issuedAt:
            new Date(
              issuedAtMs
            ),

          inputCutoffAt:
            new Date(
              issuedAtMs
            ),

          horizons:
            horizonDefinitions.map(
              (item) =>
                item.horizon
            ),

          runConfig,
        },
        options
      );

    const forecasts =
      [];

    for (
      let position = 0;
      position <
        horizonDefinitions.length;
      position += 1
    ) {
      const {
        horizon,
        horizonBars,
        horizonMs,
      } =
        horizonDefinitions[
          position
        ];

      const modelResult =
        forecastHistoricalVolatilityBaseline({
          series:
            availableSeries,

          lookbackBars,

          horizonBars,

          expectedIntervalMs:
            timeframeMs,
        });

      const issuance =
        await issueForecast(
          {
            datasetId:
              dataset.id,

            sourceAnalysisRunId,

            modelId:
              MODEL_DEFINITION.id,

            modelVersion:
              MODEL_DEFINITION.version,

            modelDefinition:
              MODEL_DEFINITION,

            modelConfig: {
              lookbackBars,

              horizonBars,

              incompletePolicy:
                INCOMPLETE_POLICY,

              protocolId:
                HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1
                  .id,

              protocolVersion:
                HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1
                  .version,

              protocolChecksum:
                runIssuance
                  .protocolChecksum,
            },

            target:
              MODEL_DEFINITION.target,

            modelTimeframe:
              dataset.sourceTimeframe,

            horizon,

            issuedAt:
              new Date(
                issuedAtMs
              ),

            inputCutoffAt:
              new Date(
                issuedAtMs
              ),

            targetWindowStartAt:
              new Date(
                issuedAtMs
              ),

            targetWindowEndAt:
              new Date(
                issuedAtMs +
                horizonMs
              ),

            prediction:
              modelResult.prediction,
          },
          options
        );

      const runItem =
        await ensureRunItem(
          {
            forecastRunId:
              runIssuance
                .forecastRun
                .id,

            forecastId:
              issuance
                .forecast
                .id,

            horizon,

            horizonBars,

            position,
          },
          options
        );

      forecasts.push({
        horizon,

        horizonBars,

        created:
          issuance.created,

        runItemCreated:
          runItem.created,

        forecast:
          issuance.forecast,
      });
    }

    return {
      engineVersion:
        ENGINE_VERSION,

      forecastRun: {
        created:
          runIssuance.created,

        run:
          runIssuance
            .forecastRun,
      },

      dataset: {
        id:
          dataset.id,

        checksum:
          dataset.checksum,

        timeframe:
          dataset.sourceTimeframe,
      },

      model: {
        id:
          MODEL_DEFINITION.id,

        version:
          MODEL_DEFINITION.version,

        checksum:
          runIssuance
            .modelChecksum,

        protocolId:
          HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1
            .id,

        protocolVersion:
          HISTORICAL_VOLATILITY_BASELINE_MULTI_HORIZON_V1
            .version,

        protocolChecksum:
          runIssuance
            .protocolChecksum,
      },

      issuedAt:
        new Date(
          issuedAtMs
        ).toISOString(),

      informationSet,

      forecasts,
    };
  };

const runHistoricalVolatilityMultiHorizonForecast =
  async ({
    datasetId,
    issuedAt,
    sourceAnalysisRunId =
      null,
  }, options = {}) => {
    if (
      options.transaction
    ) {
      return runCore(
        {
          datasetId,

          issuedAt,

          sourceAnalysisRunId,
        },
        options
      );
    }

    return sequelize.transaction(
      async (
        transaction
      ) =>
        runCore(
          {
            datasetId,

            issuedAt,

            sourceAnalysisRunId,
          },
          {
            ...options,

            transaction,
          }
        )
    );
  };

module.exports = {
  ENGINE_VERSION,
  runHistoricalVolatilityMultiHorizonForecast,
};