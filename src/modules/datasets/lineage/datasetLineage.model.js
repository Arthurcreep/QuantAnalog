const { DataTypes } = require("sequelize");

const sequelize = require("../../../config/database");

const DatasetLineage = sequelize.define(
  "DatasetLineage",
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    parentDatasetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "parent_dataset_id",
    },

    childDatasetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "child_dataset_id",
    },

    transformationType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "transformation_type",
    },

    transformationVersion: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "transformation_version",
    },

    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "dataset_lineage",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = DatasetLineage;