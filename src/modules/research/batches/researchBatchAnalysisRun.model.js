const {
  DataTypes,
} = require("sequelize");

const sequelize = require(
  "../../../config/database"
);

const ResearchBatchAnalysisRun =
  sequelize.define(
    "ResearchBatchAnalysisRun",
    {
      researchBatchId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        primaryKey:
          true,

        field:
          "research_batch_id",
      },

      analysisRunId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        primaryKey:
          true,

        field:
          "analysis_run_id",
      },

      hypothesisId: {
        type:
          DataTypes.STRING(100),

        allowNull:
          false,

        field:
          "hypothesis_id",
      },

      timeframe: {
        type:
          DataTypes.STRING(20),

        allowNull:
          true,
      },
    },
    {
      tableName:
        "research_batch_analysis_runs",

      timestamps:
        true,

      createdAt:
        "created_at",

      updatedAt:
        false,
    }
  );

module.exports =
  ResearchBatchAnalysisRun;