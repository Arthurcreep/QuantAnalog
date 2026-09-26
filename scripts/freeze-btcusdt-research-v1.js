const sequelize = require(
  "../src/config/database"
);

const {
  createResearchFreeze,
} = require(
  "../src/modules/research/freezes/createResearchFreeze.service"
);

const {
  BTCUSDT_RESEARCH_FREEZE_V1,
} = require(
  "../src/modules/research/freezes/btcusdtResearchFreezeV1"
);

const run = async () => {
  try {
    await sequelize.authenticate();

    console.log(
      "Creating immutable BTCUSDT research freeze V1..."
    );

    const result =
      await createResearchFreeze({
        manifest:
          BTCUSDT_RESEARCH_FREEZE_V1,
      });

    console.log(
      "\n===== RESEARCH FREEZE CREATED ====="
    );

    console.log({
      freezeId:
        result.freezeId,

      version:
        result.version,

      frozenAt:
        result.frozenAt,

      payloadChecksum:
        result.payloadChecksum,

      fileChecksum:
        result.fileChecksum,

      filePath:
        result.filePath,

      checksumPath:
        result.checksumPath,
    });

    console.log(
      "\n===== FROZEN CANDIDATE ====="
    );

    console.log({
      candidate:
        BTCUSDT_RESEARCH_FREEZE_V1
          .calendarHourCandidate
          .id,

      supportedHorizons:
        BTCUSDT_RESEARCH_FREEZE_V1
          .calendarHourCandidate
          .supportedHorizons,

      unsupportedHorizons:
        BTCUSDT_RESEARCH_FREEZE_V1
          .calendarHourCandidate
          .unsupportedHorizons,

      forwardOos:
        BTCUSDT_RESEARCH_FREEZE_V1
          .calendarHourCandidate
          .forwardOos
          .status,
    });
  } catch (error) {
    console.error(
      "Research freeze failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();