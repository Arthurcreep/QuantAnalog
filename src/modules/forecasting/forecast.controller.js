const { listForecastRuns } = require("./services/listForecastRuns.service");

const {
  runForecast,
} = require(
  "./services/runForecast.service"
);

const {
  getForecastRun,
} = require(
  "./services/getForecastRun.service"
);

const {
  getForecastRunHistory,
} = require(
  "./services/getForecastRunHistory.service"
);

const {
  getForecastRunEvaluation,
} = require(
  "./services/getForecastRunEvaluation.service"
);

const {
  getForecastResult,
} = require(
  "./services/getForecastResult.service"
);

const parseOptionalPositiveInteger = ({
  value,
  field,
}) => {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return undefined;
  }

  const parsed =
    Number(
      value
    );

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed <= 0
  ) {
    const error =
      new Error(
        `${field} must be a positive integer`
      );

    error.statusCode =
      400;

    error.code =
      `INVALID_${field}`;

    throw error;
  }

  return parsed;
};

const createForecast =
  async (
    req,
    res
  ) => {
    const result =
      await runForecast(
        req.body ||
        {}
      );

    const statusCode =
      result
        .forecastRun
        .created
        ? 201
        : 200;

    res
      .status(
        statusCode
      )
      .json({
        status:
          "ok",

        data:
          result,
      });
  };

const getForecast =
  async (
    req,
    res
  ) => {
    const result =
      await getForecastRun({
        forecastRunId:
          req.params.id,
      });

    res.json({
      status:
        "ok",

      data:
        result,
    });
  };

const getForecastHistory =
  async (
    req,
    res
  ) => {
    const result =
      await getForecastRunHistory({
        forecastRunId:
          req.params.id,
      });

    res.json({
      status:
        "ok",

      data:
        result,
    });
  };

const getForecastEvaluation =
  async (
    req,
    res
  ) => {
    const result =
      await getForecastRunEvaluation({
        forecastRunId:
          req.params.id,
      });

    res.json({
      status:
        "ok",

      data:
        result,
    });
  };

const getForecastResultController =
  async (
    req,
    res
  ) => {
    const rollingWindow =
      parseOptionalPositiveInteger({
        value:
          req.query
            .rollingWindow,

        field:
          "ROLLING_WINDOW",
      });

    const rollingMinObservations =
      parseOptionalPositiveInteger({
        value:
          req.query
            .rollingMinObservations,

        field:
          "ROLLING_MIN_OBSERVATIONS",
      });

    const result =
      await getForecastResult({
        forecastRunId:
          req.params.id,

        benchmarkForecastRunId:
          req.query
            .benchmarkForecastRunId ||
          null,

        rollingWindow,

        rollingMinObservations,
      });

    res.json({
      status:
        "ok",

      data:
        result,
    });
  };

const listForecastRunsController = async (req, res) => {
  res.json({ status: "ok", data: await listForecastRuns() });
};

module.exports = {
  listForecastRunsController,
  createForecast,
  getForecast,
  getForecastHistory,
  getForecastEvaluation,
  getForecastResultController,
};