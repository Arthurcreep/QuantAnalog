const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("data_repair_events", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
    },

    source_dataset_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "datasets",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    target_dataset_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "datasets",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    event_type: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    source_data_row: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },

    source_line: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },

    source_timestamp: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    old_value: {
      type: Sequelize.JSONB,
      allowNull: true,
    },

    new_value: {
      type: Sequelize.JSONB,
      allowNull: true,
    },

    method: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    reason: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    policy_version: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },

    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex(
    "data_repair_events",
    ["source_dataset_id"],
    {
      name: "data_repair_events_source_dataset_idx",
    }
  );

  await queryInterface.addIndex(
    "data_repair_events",
    ["target_dataset_id"],
    {
      name: "data_repair_events_target_dataset_idx",
    }
  );
};

const down = async (queryInterface) => {
  await queryInterface.dropTable(
    "data_repair_events"
  );
};

module.exports = {
  up,
  down,
};