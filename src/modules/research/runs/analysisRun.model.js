const {
  DataTypes,
} = require("sequelize");

const sequelize = require(
  "../../../config/database"
);

const AnalysisRun =
  sequelize.define(
    "AnalysisRun",
    {
      id: {
        type:
          DataTypes.UUID,

        allowNull: false,
        primaryKey: true,

        defaultValue:
          DataTypes.UUIDV4,
      },

      datasetId: {
        type:
          DataTypes.UUID,

        allowNull: false,

        field:
          "dataset_id",
      },

      runType: {
        type:
          DataTypes.STRING(100),

        allowNull: false,

        field:
          "run_type",
      },

      engineVersion: {
        type:
          DataTypes.STRING(50),

        allowNull: false,

        field:
          "engine_version",
      },

      config: {
        type:
          DataTypes.JSONB,

        allowNull: false,
      },

      metrics: {
        type:
          DataTypes.JSONB,

        allowNull: false,
      },
    },
    {
      tableName:
        "analysis_runs",

      timestamps: true,

      createdAt:
        "created_at",

      updatedAt: false,
    }
  );

module.exports =
  AnalysisRun;