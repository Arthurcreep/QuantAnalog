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
    "FORECAST_IS_IMMUTABLE"
  );
};

const Forecast =
  sequelize.define(
    "Forecast",
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

      datasetId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        field:
          "dataset_id",
      },

      sourceAnalysisRunId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,

        field:
          "source_analysis_run_id",
      },

      forecastKey: {
        type:
          DataTypes.STRING(64),

        allowNull:
          false,

        field:
          "forecast_key",
      },

      modelId: {
        type:
          DataTypes.STRING(100),

        allowNull:
          false,

        field:
          "model_id",
      },

      modelVersion: {
        type:
          DataTypes.STRING(50),

        allowNull:
          false,

        field:
          "model_version",
      },

      modelChecksum: {
        type:
          DataTypes.STRING(64),

        allowNull:
          false,

        field:
          "model_checksum",
      },

      datasetChecksum: {
        type:
          DataTypes.STRING(128),

        allowNull:
          false,

        field:
          "dataset_checksum",
      },

      target: {
        type:
          DataTypes.STRING(100),

        allowNull:
          false,
      },

      modelTimeframe: {
        type:
          DataTypes.STRING(20),

        allowNull:
          false,

        field:
          "model_timeframe",
      },

      horizon: {
        type:
          DataTypes.STRING(20),

        allowNull:
          false,
      },

      issuedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,

        field:
          "issued_at",
      },

      inputCutoffAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,

        field:
          "input_cutoff_at",
      },

      targetWindowStartAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,

        field:
          "target_window_start_at",
      },

      targetWindowEndAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,

        field:
          "target_window_end_at",
      },

      modelConfig: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,

        field:
          "model_config",
      },

      prediction: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,
      },
    },
    {
      tableName:
        "forecasts",

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
  Forecast;