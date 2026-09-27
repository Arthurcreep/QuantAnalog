const {
  Op,
  literal,
} = require(
  "sequelize"
);

const Forecast = require(
  "./forecast.model"
);

const createForecast = async (
  data,
  options = {}
) =>
  Forecast.create(
    data,
    options
  );

const findForecastById = async (
  id,
  options = {}
) =>
  Forecast.findByPk(
    id,
    options
  );

const findForecastByKey = async (
  forecastKey,
  options = {}
) =>
  Forecast.findOne({
    where: {
      forecastKey,
    },

    ...options,
  });

const findIncompleteMatureForecasts =
  async ({
    observedAt,
    limit = 100,
  }, options = {}) =>
    Forecast.findAll({
      where: {
        targetWindowEndAt: {
          [Op.lte]:
            observedAt,
        },

        [Op.or]: [
          literal(`
            NOT EXISTS (
              SELECT 1
              FROM forecast_outcomes AS fo
              WHERE fo.forecast_id = "Forecast"."id"
            )
          `),

          literal(`
            NOT EXISTS (
              SELECT 1
              FROM forecast_evaluations AS fe
              WHERE fe.forecast_id = "Forecast"."id"
            )
          `),
        ],
      },

      order: [
        [
          "targetWindowEndAt",
          "ASC",
        ],
        [
          "created_at",
          "ASC",
        ],
      ],

      limit,

      ...options,
    });

module.exports = {
  createForecast,
  findForecastById,
  findForecastByKey,
  findIncompleteMatureForecasts,
};