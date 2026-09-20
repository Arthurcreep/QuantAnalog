const fs = require("fs/promises");
const path = require("path");

const RAW_STORAGE_PATH = path.resolve("storage/raw");

const ensureRawStorage = async () => {
  await fs.mkdir(RAW_STORAGE_PATH, {
    recursive: true,
  });
};

const buildRawFilePath = ({
  checksum,
  originalFilename,
}) => {
  const extension = path.extname(originalFilename).toLowerCase();

  return path.join(
    RAW_STORAGE_PATH,
    `${checksum}${extension}`
  );
};

const storeRawFile = async ({
  sourcePath,
  originalFilename,
  checksum,
}) => {
  await ensureRawStorage();

  const destinationPath = buildRawFilePath({
    checksum,
    originalFilename,
  });

  try {
    await fs.access(destinationPath);

    return {
      path: destinationPath,
      alreadyExists: true,
    };
  } catch {
    await fs.copyFile(sourcePath, destinationPath);

    return {
      path: destinationPath,
      alreadyExists: false,
    };
  }
};

module.exports = {
  storeRawFile,
};