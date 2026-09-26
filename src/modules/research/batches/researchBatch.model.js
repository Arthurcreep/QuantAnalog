const {
  DataTypes,
} = require("sequelize");

const sequelize = require(
  "../../../config/database"
);

const ResearchBatch =
  sequelize.define(
    "ResearchBatch",
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

      mode: {
        type:
          DataTypes.STRING(20),

        allowNull:
          false,
      },

      venue: {
        type:
          DataTypes.STRING(100),

        allowNull:
          false,
      },

      instrument: {
        type:
          DataTypes.STRING(100),

        allowNull:
          false,
      },

      marketType: {
        type:
          DataTypes.STRING(50),

        allowNull:
          false,

        field:
          "market_type",
      },

      status: {
        type:
          DataTypes.STRING(30),

        allowNull:
          false,
      },

      planSnapshot: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,

        field:
          "plan_snapshot",
      },

      acquisitionRequirements: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,

        field:
          "acquisition_requirements",
      },

      executionSummary: {
        type:
          DataTypes.JSONB,

        allowNull:
          true,

        field:
          "execution_summary",
      },

      executionDetails: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,

        defaultValue:
          [],

        field:
          "execution_details",
      },

      startedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,

        defaultValue:
          DataTypes.NOW,

        field:
          "started_at",
      },

      completedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,

        field:
          "completed_at",
      },
    },
    {
      tableName:
        "research_batches",

      timestamps:
        true,

      createdAt:
        "created_at",

      updatedAt:
        "updated_at",
    }
  );

module.exports =
  ResearchBatch;