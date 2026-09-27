const {
  findForecastRunById,
} = require(
  "../runs/forecastRun.repository"
);

const {
  findForecastRunItems,
} = require(
  "../runs/forecastRunItem.repository"
);

const {
  findForecastById,
} = require(
  "../forecasts/forecast.repository"
);

const {
  findForecastOutcomeByForecastId,
} = require(
  "../outcomes/forecastOutcome.repository"
);

const {
  findForecastEvaluationsByForecastId,
} = require(
  "../evaluations/forecastEvaluation.repository"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "forecast-run-history-v1.0";

const serializeModel = (
  model
) =>
  model
    ? model.get({
        plain:
          true,
      })
    : null;

const resolveStatus = ({
  outcome,
  evaluations,
}) => {
  if (!outcome) {
    return "PENDING_OUTCOME";
  }

  if (
    !Array.isArray(
      evaluations
    ) ||
    evaluations.length ===
      0
  ) {
    return "MATURED_UNEVALUATED";
  }

  return "EVALUATED";
};

const buildHistoryItem =
  async (
    runItem,
    options
  ) => {
    const forecast =
      await findForecastById(
        runItem.forecastId,
        options
      );

    if (!forecast) {
      throw new Error(
        "FORECAST_RUN_ITEM_FORECAST_NOT_FOUND"
      );
    }

    const [
      outcome,
      evaluations,
    ] =
      await Promise.all([
        findForecastOutcomeByForecastId(
          forecast.id,
          options
        ),

        findForecastEvaluationsByForecastId(
          forecast.id,
          options
        ),
      ]);

    const status =
      resolveStatus({
        outcome,

        evaluations,
      });

    return {
      position:
        runItem.position,

      horizon:
        runItem.horizon,

      horizonBars:
        runItem.horizonBars,

      status,

      forecast:
        serializeModel(
          forecast
        ),

      outcome:
        serializeModel(
          outcome
        ),

      evaluations:
        evaluations.map(
          serializeModel
        ),
    };
  };

const getForecastRunHistory =
  async ({
    forecastRunId,
  }, options = {}) => {
    const forecastRun =
      await findForecastRunById(
        forecastRunId,
        options
      );

    if (!forecastRun) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_RUN_NOT_FOUND",

        message:
          `ForecastRun ${forecastRunId} not found`,
      });
    }

    const runItems =
      await findForecastRunItems(
        forecastRun.id,
        options
      );

    const history =
      [];

    for (
      const runItem of
        runItems
    ) {
      history.push(
        await buildHistoryItem(
          runItem,
          options
        )
      );
    }

    const statusCounts =
      history.reduce(
        (
          result,
          item
        ) => {
          result[
            item.status
          ] =
            (
              result[
                item.status
              ] ||
              0
            ) +
            1;

          return result;
        },
        {}
      );

    return {
      engineVersion:
        ENGINE_VERSION,

      forecastRun:
        serializeModel(
          forecastRun
        ),

      summary: {
        forecastCount:
          history.length,

        pendingOutcomeCount:
          statusCounts
            .PENDING_OUTCOME ||
          0,

        maturedUnevaluatedCount:
          statusCounts
            .MATURED_UNEVALUATED ||
          0,

        evaluatedCount:
          statusCounts
            .EVALUATED ||
          0,
      },

      history,
    };
  };

module.exports = {
  ENGINE_VERSION,
  getForecastRunHistory,
};