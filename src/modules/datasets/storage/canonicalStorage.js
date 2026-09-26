const fs = require("fs/promises");
const path = require("path");

const CANONICAL_STORAGE_PATH = path.resolve(
  "storage/canonical"
);

const storeCanonicalFile = async ({
  sourcePath,
  checksum,
}) => {
  await fs.mkdir(
    CANONICAL_STORAGE_PATH,
    {
      recursive: true,
    }
  );

  const destinationPath = path.join(
    CANONICAL_STORAGE_PATH,
    `${checksum}.csv`
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
  storeCanonicalFile,
};