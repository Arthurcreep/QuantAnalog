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
  createArchNormalMultiHorizonForecaster,
} = require(
  "../models/createArchNormalMultiHorizonForecaster"
);

const {
  ARCH_NORMAL_MODEL_V1_0,
} = require(
  "../models/archNormalModelDefinitionV1_0"
);

const {
  ARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../protocols/archNormalMultiHorizonV1"
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
  "arch-normal-multi-horizon-forecast-v1.0";

const INCOMPLETE_POLICY =
  "DROP_INCOMPLETE";

const filterReturnsAvailableAt = ({
  series,
  inputCutoffAt,
  timeframeMs,
}) => {
  const cutoffMs =
    new Date(
      inputCutoffAt
    ).getTime();

  if (
    !Number.isFinite(
      cutoffMs
    )
  ) {
    throw new Error(
      "INVALID_ARCH_FORECAST_INPUT_CUTOFF"
    );
  }

  return series.filter(
    (row) => {
      const candleStartMs =
        new Date(
          row.timestamp
        ).getTime();

      if (
        !Number.isFinite(
          candleStartMs
        )
      ) {
        throw new Error(
          "INVALID_ARCH_FORECAST_RETURN_TIMESTAMP"
        );
      }

      return (
        candleStartMs +
          timeframeMs <=
        cutoffMs
      );
    }
  );
};

const buildHorizonDefinitions = ({
  modelTimeframe,
}) =>
  ARCH_NORMAL_MULTI_HORIZON_V1
    .supportedHorizons
    .map(
      (horizon) =>
        resolveForecastHorizon({
          modelTimeframe,
          horizon,
        })
    );

const resolveRunItem =
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
      if (
        existing.horizon !==
          horizon ||
        existing.horizonBars !==
          horizonBars ||
        existing.position !==
          position
      ) {
        throw new Error(
          "FORECAST_RUN_ITEM_CONFLICT"
        );
      }

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
        "ARCH_FORECAST_REQUIRES_PREPARED_DATASET"
      );
    }

    if (
      dataset.sourceTimeframe !==
      ARCH_NORMAL_MULTI_HORIZON_V1
        .modelTimeframe
    ) {
      throw new Error(
        "ARCH_FORECAST_MODEL_TIMEFRAME_MISMATCH"
      );
    }

    const timeframeMs =
      timeframeToMilliseconds(
        dataset.sourceTimeframe
      );

    if (
      !Number.isFinite(
        timeframeMs
      ) ||
      timeframeMs <= 0
    ) {
      throw new Error(
        "UNSUPPORTED_ARCH_FORECAST_TIMEFRAME"
      );
    }

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
        "INVALID_ARCH_FORECAST_ISSUE_TIME"
      );
    }

    if (
      issuedAtMs %
        timeframeMs !==
      0
    ) {
      throw new Error(
        "ARCH_FORECAST_ISSUE_TIME_NOT_ALIGNED"
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

        inputCutoffAt:
          issuedAt,

        timeframeMs,
      });

    const trainingWindowBars =
      ARCH_NORMAL_MULTI_HORIZON_V1
        .trainingWindowBars;

    if (
      availableSeries.length <
      trainingWindowBars
    ) {
      throw new Error(
        "INSUFFICIENT_ARCH_FORECAST_LOOKBACK"
      );
    }

    const trainingSeries =
      availableSeries.slice(
        -trainingWindowBars
      );

    const anchor =
      trainingSeries[
        trainingSeries.length -
        1
      ];

    const anchorAvailableAtMs =
      new Date(
        anchor.timestamp
      ).getTime() +
      timeframeMs;

    if (
      anchorAvailableAtMs >
      issuedAtMs
    ) {
      throw new Error(
        "ARCH_FORECAST_LOOKAHEAD_DETECTED"
      );
    }

    const horizonDefinitions =
      buildHorizonDefinitions({
        modelTimeframe:
          dataset.sourceTimeframe,
      });

    const horizonBarsList =
      horizonDefinitions.map(
        (item) =>
          item.horizonBars
      );

    const forecaster =
      createArchNormalMultiHorizonForecaster();

    const modelConfig = {
      trainingWindowBars,

      refitEveryForecasts:
        ARCH_NORMAL_MULTI_HORIZON_V1
          .refitEveryForecasts,

      meanModel:
        ARCH_NORMAL_MULTI_HORIZON_V1
          .meanModel,

      distribution:
        ARCH_NORMAL_MULTI_HORIZON_V1
          .distribution,

      incompletePolicy:
        INCOMPLETE_POLICY,

      informationAvailability:
        ARCH_NORMAL_MULTI_HORIZON_V1
          .informationAvailability,

      issuePolicy:
        ARCH_NORMAL_MULTI_HORIZON_V1
          .issuePolicy,
    };

    const modelResult =
      forecaster.forecastMany({
        series:
          trainingSeries,

        modelConfig,

        horizonBarsList,

        expectedIntervalMs:
          timeframeMs,

        anchorTimestamp:
          anchor.timestamp,
      });

    const informationSet = {
      inputReturnCount:
        returns.returnCount,

      availableReturnCount:
        availableSeries.length,

      trainingWindowBars,

      firstUsedReturnTimestamp:
        trainingSeries[0]
          .timestamp,

      lastUsedReturnTimestamp:
        anchor.timestamp,

      lastUsedReturnAvailableAt:
        new Date(
          anchorAvailableAtMs
        ).toISOString(),

      inputCutoffAt:
        new Date(
          issuedAtMs
        ).toISOString(),
    };

    const runConfig = {
      engineVersion:
        ENGINE_VERSION,

      incompletePolicy:
        INCOMPLETE_POLICY,

      modelConfig,

      informationSet,

      fit: {
        refit:
          modelResult.refit,

        parameters:
          modelResult.parameters,

        optimization:
          modelResult.optimization,

        oneStepVariance:
          modelResult
            .oneStepVariance,
      },

      horizonDefinitions:
        horizonDefinitions.map(
          (item) => ({
            horizon:
              item.horizon,

            horizonBars:
              item.horizonBars,

            horizonMs:
              item.horizonMs,
          })
        ),
    };

    const runIssuance =
      await issueForecastRun(
        {
          dataset,

          sourceAnalysisRunId,

          modelDefinition:
            ARCH_NORMAL_MODEL_V1_0,

          protocolDefinition:
            ARCH_NORMAL_MULTI_HORIZON_V1,

          target:
            ARCH_NORMAL_MULTI_HORIZON_V1
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
      const horizonDefinition =
        horizonDefinitions[
          position
        ];

      const {
        horizon,
        horizonMs,
        horizonBars,
      } =
        horizonDefinition;

      const horizonResult =
        modelResult
          .predictions[
            String(
              horizonBars
            )
          ];

      if (
        !horizonResult ||
        !horizonResult
          .prediction
      ) {
        throw new Error(
          `ARCH_FORECAST_PREDICTION_MISSING:${horizon}`
        );
      }

      const targetWindowStartAt =
        new Date(
          issuedAtMs
        );

      const targetWindowEndAt =
        new Date(
          issuedAtMs +
          horizonMs
        );

      const issuance =
        await issueForecast(
          {
            datasetId:
              dataset.id,

            sourceAnalysisRunId,

            modelId:
              ARCH_NORMAL_MODEL_V1_0
                .id,

            modelVersion:
              ARCH_NORMAL_MODEL_V1_0
                .version,

            modelDefinition:
              ARCH_NORMAL_MODEL_V1_0,

            modelConfig: {
              ...modelConfig,

              horizonBars,

              protocolId:
                ARCH_NORMAL_MULTI_HORIZON_V1
                  .id,

              protocolVersion:
                ARCH_NORMAL_MULTI_HORIZON_V1
                  .version,

              protocolChecksum:
                runIssuance
                  .protocolChecksum,
            },

            target:
              ARCH_NORMAL_MULTI_HORIZON_V1
                .target,

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

            targetWindowStartAt,

            targetWindowEndAt,

            prediction:
              horizonResult
                .prediction,
          },
          options
        );

      const runItem =
        await resolveRunItem(
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

        runItem:
          runItem.item,
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
          ARCH_NORMAL_MODEL_V1_0
            .id,

        version:
          ARCH_NORMAL_MODEL_V1_0
            .version,

        checksum:
          runIssuance
            .modelChecksum,

        protocolId:
          ARCH_NORMAL_MULTI_HORIZON_V1
            .id,

        protocolVersion:
          ARCH_NORMAL_MULTI_HORIZON_V1
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

      modelResult: {
        refit:
          modelResult.refit,

        parameters:
          modelResult.parameters,

        optimization:
          modelResult.optimization,

        oneStepVariance:
          modelResult
            .oneStepVariance,
      },

      forecasts,
    };
  };

const runArchNormalMultiHorizonForecast =
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
  runArchNormalMultiHorizonForecast,
};