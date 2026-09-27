const ForecastRun = require(
  "./forecastRun.model"
);

const createForecastRun = async (
  data,
  options = {}
) =>
  ForecastRun.create(
    data,
    options
  );

const findForecastRunById = async (
  id,
  options = {}
) =>
  ForecastRun.findByPk(
    id,
    options
  );

const findForecastRunByKey = async (
  runKey,
  options = {}
) =>
  ForecastRun.findOne({
    where: {
      runKey,
    },

    ...options,
  });

const findForecastRunsBySeriesContext =
  async ({
    sourceAnalysisRunId,
    modelId,
    modelVersion,
    modelChecksum,
    protocolId,
    protocolVersion,
    protocolChecksum,
    target,
    modelTimeframe,
  }, options = {}) =>
    ForecastRun.findAll({
      where: {
        sourceAnalysisRunId,

        modelId,

        modelVersion,

        modelChecksum,

        protocolId,

        protocolVersion,

        protocolChecksum,

        target,

        modelTimeframe,
      },

      order: [
        [
          "issuedAt",
          "ASC",
        ],
        [
          "created_at",
          "ASC",
        ],
      ],

      ...options,
    });

const findRecentForecastRuns = async () =>
  ForecastRun.findAll({
    attributes: ["id", "datasetId", "modelId", "modelVersion", "target", "modelTimeframe", "issuedAt"],
    order: [["issuedAt", "DESC"], ["id", "DESC"]],
    limit: 50,
    raw: true,
  });

module.exports = {
  findRecentForecastRuns,
  createForecastRun,
  findForecastRunById,
  findForecastRunByKey,
  findForecastRunsBySeriesContext,
};