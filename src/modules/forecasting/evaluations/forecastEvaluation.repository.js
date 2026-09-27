const ForecastEvaluation = require(
  "./forecastEvaluation.model"
);

const createForecastEvaluation =
  async (
    data,
    options = {}
  ) =>
    ForecastEvaluation.create(
      data,
      options
    );

const findForecastEvaluationById =
  async (
    id,
    options = {}
  ) =>
    ForecastEvaluation.findByPk(
      id,
      options
    );

const findForecastEvaluationByKey =
  async (
    evaluationKey,
    options = {}
  ) =>
    ForecastEvaluation.findOne({
      where: {
        evaluationKey,
      },

      ...options,
    });

const findForecastEvaluationsByForecastId =
  async (
    forecastId,
    options = {}
  ) =>
    ForecastEvaluation.findAll({
      where: {
        forecastId,
      },

      order: [
        [
          "created_at",
          "ASC",
        ],
      ],

      ...options,
    });

module.exports = {
  createForecastEvaluation,
  findForecastEvaluationById,
  findForecastEvaluationByKey,
  findForecastEvaluationsByForecastId,
};