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
    "FORECAST_RUN_IS_IMMUTABLE"
  );
};

const ForecastRun =
  sequelize.define(
    "ForecastRun",
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

      runKey: {
        type:
          DataTypes.STRING(64),

        allowNull:
          false,

        field:
          "run_key",
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

      datasetChecksum: {
        type:
          DataTypes.STRING(128),

        allowNull:
          false,

        field:
          "dataset_checksum",
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

      protocolId: {
        type:
          DataTypes.STRING(100),

        allowNull:
          false,

        field:
          "protocol_id",
      },

      protocolVersion: {
        type:
          DataTypes.STRING(50),

        allowNull:
          false,

        field:
          "protocol_version",
      },

      protocolChecksum: {
        type:
          DataTypes.STRING(64),

        allowNull:
          false,

        field:
          "protocol_checksum",
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

      horizons: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,
      },

      runConfig: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,

        field:
          "run_config",
      },
    },
    {
      tableName:
        "forecast_runs",

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
  ForecastRun;