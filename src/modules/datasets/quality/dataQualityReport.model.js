const { DataTypes } = require("sequelize");

const sequelize = require("../../../config/database");

const DataQualityReport = sequelize.define(
  "DataQualityReport",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },

    datasetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "dataset_id",
    },

    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    coverage: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },

    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    policy: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: "data_quality_reports",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = DataQualityReport;