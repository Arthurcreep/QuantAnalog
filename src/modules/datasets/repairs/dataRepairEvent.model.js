const { DataTypes } = require("sequelize");

const sequelize = require("../../../config/database");

const DataRepairEvent = sequelize.define(
  "DataRepairEvent",
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    sourceDatasetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "source_dataset_id",
    },

    targetDatasetId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "target_dataset_id",
    },

    eventType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "event_type",
    },

    sourceDataRow: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "source_data_row",
    },

    sourceLine: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "source_line",
    },

    sourceTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "source_timestamp",
    },

    oldValue: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "old_value",
    },

    newValue: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "new_value",
    },

    method: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    policyVersion: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "policy_version",
    },
  },
  {
    tableName: "data_repair_events",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = DataRepairEvent;