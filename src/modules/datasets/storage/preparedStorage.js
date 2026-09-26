const fs = require("fs/promises");
const path = require("path");

const PREPARED_STORAGE_PATH = path.resolve(
  "storage/prepared"
);

const storePreparedFile = async ({
  sourcePath,
  checksum,
}) => {
  await fs.mkdir(
    PREPARED_STORAGE_PATH,
    {
      recursive: true,
    }
  );

  const destinationPath = path.join(
    PREPARED_STORAGE_PATH,
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
  storePreparedFile,
};