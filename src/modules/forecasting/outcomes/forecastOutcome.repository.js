const ForecastOutcome = require(
  "./forecastOutcome.model"
);

const createForecastOutcome =
  async (
    data,
    options = {}
  ) =>
    ForecastOutcome.create(
      data,
      options
    );

const findForecastOutcomeById =
  async (
    id,
    options = {}
  ) =>
    ForecastOutcome.findByPk(
      id,
      options
    );

const findForecastOutcomeByForecastId =
  async (
    forecastId,
    options = {}
  ) =>
    ForecastOutcome.findOne({
      where: {
        forecastId,
      },

      ...options,
    });

module.exports = {
  createForecastOutcome,
  findForecastOutcomeById,
  findForecastOutcomeByForecastId,
};