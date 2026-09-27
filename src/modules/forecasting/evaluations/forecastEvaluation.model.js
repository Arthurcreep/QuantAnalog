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
    "FORECAST_EVALUATION_IS_IMMUTABLE"
  );
};

const ForecastEvaluation =
  sequelize.define(
    "ForecastEvaluation",
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

      outcomeId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        field:
          "outcome_id",
      },

      evaluationKey: {
        type:
          DataTypes.STRING(64),

        allowNull:
          false,

        field:
          "evaluation_key",
      },

      evaluatorId: {
        type:
          DataTypes.STRING(100),

        allowNull:
          false,

        field:
          "evaluator_id",
      },

      evaluatorVersion: {
        type:
          DataTypes.STRING(50),

        allowNull:
          false,

        field:
          "evaluator_version",
      },

      evaluatorChecksum: {
        type:
          DataTypes.STRING(64),

        allowNull:
          false,

        field:
          "evaluator_checksum",
      },

      metrics: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,
      },
    },
    {
      tableName:
        "forecast_evaluations",

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
  ForecastEvaluation;