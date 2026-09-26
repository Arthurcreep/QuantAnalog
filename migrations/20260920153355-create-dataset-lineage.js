const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("dataset_lineage", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
    },

    parent_dataset_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "datasets",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    child_dataset_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "datasets",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    transformation_type: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    transformation_version: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },

    metadata: {
      type: Sequelize.JSONB,
      allowNull: true,
    },

    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex(
    "dataset_lineage",
    ["parent_dataset_id"],
    {
      name: "dataset_lineage_parent_idx",
    }
  );

  await queryInterface.addIndex(
    "dataset_lineage",
    ["child_dataset_id"],
    {
      name: "dataset_lineage_child_idx",
    }
  );

  await queryInterface.addIndex(
    "dataset_lineage",
    [
      "parent_dataset_id",
      "child_dataset_id",
      "transformation_type",
    ],
    {
      unique: true,
      name: "dataset_lineage_edge_unique",
    }
  );
};

const down = async (queryInterface) => {
  await queryInterface.dropTable(
    "dataset_lineage"
  );
};

module.exports = {
  up,
  down,
};