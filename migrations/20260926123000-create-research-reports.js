const up = async (
  queryInterface,
  Sequelize
) => {
  await queryInterface.createTable(
    "research_reports",
    {
      id: {
        type:
          Sequelize.UUID,

        allowNull:
          false,

        primaryKey:
          true,

        defaultValue:
          Sequelize.UUIDV4,
      },

      research_batch_id: {
        type:
          Sequelize.UUID,

        allowNull:
          false,

        references: {
          model:
            "research_batches",

          key:
            "id",
        },

        onUpdate:
          "CASCADE",

        onDelete:
          "RESTRICT",
      },

      schema_version: {
        type:
          Sequelize.STRING,

        allowNull:
          false,
      },

      report_engine_version: {
        type:
          Sequelize.STRING,

        allowNull:
          false,
      },

      evidence_engine_version: {
        type:
          Sequelize.STRING,

        allowNull:
          false,
      },

      evidence_policy_id: {
        type:
          Sequelize.STRING,

        allowNull:
          false,
      },

      evidence_policy_version: {
        type:
          Sequelize.STRING,

        allowNull:
          false,
      },

      evidence_policy_checksum: {
        type:
          Sequelize.STRING(64),

        allowNull:
          false,
      },

      report_checksum: {
        type:
          Sequelize.STRING(64),

        allowNull:
          false,
      },

      payload: {
        type:
          Sequelize.JSONB,

        allowNull:
          false,
      },

      created_at: {
        type:
          Sequelize.DATE,

        allowNull:
          false,

        defaultValue:
          Sequelize.fn(
            "NOW"
          ),
      },
    }
  );

  await queryInterface.addIndex(
    "research_reports",
    [
      "research_batch_id",
    ],
    {
      name:
        "research_reports_batch_id_idx",
    }
  );

  await queryInterface.addIndex(
    "research_reports",
    [
      "research_batch_id",
      "schema_version",
      "report_engine_version",
      "evidence_engine_version",
      "evidence_policy_checksum",
    ],
    {
      unique:
        true,

      name:
        "research_reports_snapshot_unique_idx",
    }
  );

  await queryInterface.addIndex(
    "research_reports",
    [
      "report_checksum",
    ],
    {
      name:
        "research_reports_checksum_idx",
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.dropTable(
    "research_reports"
  );
};

module.exports = {
  up,
  down,
};