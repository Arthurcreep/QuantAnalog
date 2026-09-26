const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("data_quality_reports", {
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

    status: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },

    coverage: {
      type: Sequelize.DOUBLE,
      allowNull: true,
    },

    metrics: {
      type: Sequelize.JSONB,
      allowNull: false,
    },

    policy: {
      type: Sequelize.JSONB,
      allowNull: false,
    },

    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex(
    "data_quality_reports",
    ["dataset_id"],
    {
      name: "data_quality_reports_dataset_idx",
    }
  );
};

const down = async (queryInterface) => {
  await queryInterface.dropTable(
    "data_quality_reports"
  );
};

module.exports = {
  up,
  down,
};