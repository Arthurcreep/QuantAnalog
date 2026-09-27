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
    "FORECAST_OUTCOME_IS_IMMUTABLE"
  );
};

const ForecastOutcome =
  sequelize.define(
    "ForecastOutcome",
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

      forecastId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        field:
          "forecast_id",
      },

      actualDatasetId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        field:
          "actual_dataset_id",
      },

      actualDatasetChecksum: {
        type:
          DataTypes.STRING(128),

        allowNull:
          false,

        field:
          "actual_dataset_checksum",
      },

      actual: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,
      },

      observedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,

        field:
          "observed_at",
      },
    },
    {
      tableName:
        "forecast_outcomes",

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
  ForecastOutcome;