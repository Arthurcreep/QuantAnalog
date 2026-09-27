const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize = require(
  "../../../config/database"
);

const throwImmutableError = () => {
  throw new Error(
    "FORECAST_RUN_ITEM_IS_IMMUTABLE"
  );
};

const ForecastRunItem =
  sequelize.define(
    "ForecastRunItem",
    {
      id: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        primaryKey:
          true,

        defaultValue:
          DataTypes.UUIDV4,
      },

      forecastRunId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        field:
          "forecast_run_id",
      },

      forecastId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        field:
          "forecast_id",
      },

      horizon: {
        type:
          DataTypes.STRING(20),

        allowNull:
          false,
      },

      horizonBars: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        field:
          "horizon_bars",
      },

      position: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,
      },
    },
    {
      tableName:
        "forecast_run_items",

      timestamps:
        true,

      createdAt:
        "created_at",

      updatedAt:
        false,

      hooks: {
        beforeUpdate:
          throwImmutableError,

        beforeBulkUpdate:
          throwImmutableError,

        beforeDestroy:
          throwImmutableError,

        beforeBulkDestroy:
          throwImmutableError,
      },
    }
  );

module.exports =
  ForecastRunItem;