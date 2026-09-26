const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize = require(
  "../../../config/database"
);

const ResearchReport =
  sequelize.define(
    "ResearchReport",
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

      researchBatchId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,

        field:
          "research_batch_id",
      },

      schemaVersion: {
        type:
          DataTypes.STRING,

        allowNull:
          false,

        field:
          "schema_version",
      },

      reportEngineVersion: {
        type:
          DataTypes.STRING,

        allowNull:
          false,

        field:
          "report_engine_version",
      },

      evidenceEngineVersion: {
        type:
          DataTypes.STRING,

        allowNull:
          false,

        field:
          "evidence_engine_version",
      },

      evidencePolicyId: {
        type:
          DataTypes.STRING,

        allowNull:
          false,

        field:
          "evidence_policy_id",
      },

      evidencePolicyVersion: {
        type:
          DataTypes.STRING,

        allowNull:
          false,

        field:
          "evidence_policy_version",
      },

      evidencePolicyChecksum: {
        type:
          DataTypes.STRING(64),

        allowNull:
          false,

        field:
          "evidence_policy_checksum",
      },

      reportChecksum: {
        type:
          DataTypes.STRING(64),

        allowNull:
          false,

        field:
          "report_checksum",
      },

      payload: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,
      },
    },

    {
      tableName:
        "research_reports",

      timestamps:
        true,

      createdAt:
        "created_at",

      updatedAt:
        false,
    }
  );

module.exports =
  ResearchReport;