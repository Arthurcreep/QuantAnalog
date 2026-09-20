const { DataTypes } = require("sequelize");

const sequelize = require("../../config/database");

const Dataset = sequelize.define(
  "Dataset",
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    datasetType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "dataset_type",
    },

    stage: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    venue: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    instrument: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    marketType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "market_type",
    },

    sourceTimeframe: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "source_timeframe",
    },

    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "UTC",
    },

    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "start_time",
    },

    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "end_time",
    },

    rowCount: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "row_count",
    },

    checksum: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },

    storageUri: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "storage_uri",
    },

    qualityStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "quality_status",
    },
  },
  {
    tableName: "datasets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Dataset;