const fs = require("fs/promises");
const path = require("path");

const CLEAN_STORAGE_PATH = path.resolve(
  "storage/clean"
);

const storeCleanFile = async ({
  sourcePath,
  checksum,
  originalFilename,
}) => {
  await fs.mkdir(CLEAN_STORAGE_PATH, {
    recursive: true,
  });

  const extension =
    path.extname(originalFilename).toLowerCase();

  const destinationPath = path.join(
    CLEAN_STORAGE_PATH,
    `${checksum}${extension}`
  );

  try {
    await fs.access(destinationPath);

    await fs.rm(sourcePath, {
      force: true,
    });

    return {
      path: destinationPath,
      alreadyExists: true,
    };
  } catch {
    await fs.rename(
      sourcePath,
      destinationPath
    );

    return {
      path: destinationPath,
      alreadyExists: false,
    };
  }
};

module.exports = {
  storeCleanFile,
};