const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("datasets", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
    },

    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },

    dataset_type: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },

    stage: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },

    version: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    venue: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    instrument: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    market_type: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },

    source_timeframe: {
      type: Sequelize.STRING(20),
      allowNull: true,
    },

    timezone: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "UTC",
    },

    start_time: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    end_time: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    row_count: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },

    checksum: {
      type: Sequelize.STRING(128),
      allowNull: false,
    },

    storage_uri: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    quality_status: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },

    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },

    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex("datasets", ["checksum"], {
    name: "datasets_checksum_idx",
  });

  await queryInterface.addIndex(
    "datasets",
    ["venue", "instrument", "source_timeframe"],
    {
      name: "datasets_market_lookup_idx",
    }
  );

  await queryInterface.addIndex(
    "datasets",
    ["stage", "quality_status"],
    {
      name: "datasets_stage_quality_idx",
    }
  );
};

const down = async (queryInterface) => {
  await queryInterface.dropTable("datasets");
};

module.exports = {
  up,
  down,
};