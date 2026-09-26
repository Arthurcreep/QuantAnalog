const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable(
    "analysis_runs",
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },

      dataset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "datasets",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },

      run_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      engine_version: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      config: {
        type: Sequelize.JSONB,
        allowNull: false,
      },

      metrics: {
        type: Sequelize.JSONB,
        allowNull: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue:
          Sequelize.fn("NOW"),
      },
    }
  );

  await queryInterface.addIndex(
    "analysis_runs",
    ["dataset_id"],
    {
      name:
        "analysis_runs_dataset_idx",
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.dropTable(
    "analysis_runs"
  );
};

module.exports = {
  up,
  down,
};