const ForecastRunItem = require(
  "./forecastRunItem.model"
);

const createForecastRunItem =
  async (
    data,
    options = {}
  ) =>
    ForecastRunItem.create(
      data,
      options
    );

const findForecastRunItems =
  async (
    forecastRunId,
    options = {}
  ) =>
    ForecastRunItem.findAll({
      where: {
        forecastRunId,
      },

      order: [
        [
          "position",
          "ASC",
        ],
      ],

      ...options,
    });

const findForecastRunItem = async ({
  forecastRunId,
  forecastId,
}, options = {}) =>
  ForecastRunItem.findOne({
    where: {
      forecastRunId,

      forecastId,
    },

    ...options,
  });

module.exports = {
  createForecastRunItem,
  findForecastRunItems,
  findForecastRunItem,
};