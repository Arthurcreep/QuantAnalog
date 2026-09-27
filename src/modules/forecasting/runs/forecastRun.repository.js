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

module.exports = {
  createForecastRun,
  findForecastRunById,
  findForecastRunByKey,
  findForecastRunsBySeriesContext,
};