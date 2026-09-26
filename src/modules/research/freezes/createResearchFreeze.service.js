const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  findAnalysisRunById,
} = require(
  "../runs/analysisRun.repository"
);

const toPlain = (value) => {
  if (
    value &&
    typeof value.toJSON ===
      "function"
  ) {
    return value.toJSON();
  }

  return value;
};

const normalizeForJson = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof value === "bigint"
  ) {
    return value.toString();
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      normalizeForJson
    );
  }

  if (
    typeof value === "object"
  ) {
    const normalized = {};

    const keys =
      Object.keys(value)
        .sort();

    for (
      const key of keys
    ) {
      normalized[key] =
        normalizeForJson(
          value[key]
        );
    }

    return normalized;
  }

  return value;
};

const stableStringify = (
  value,
  spacing = 0
) =>
  JSON.stringify(
    normalizeForJson(value),
    null,
    spacing
  );

const sha256 = (value) =>
  crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");

const resolveReferenceTree =
  async ({
    tree,
    loader,
    entityName,
  }) => {
    if (
      typeof tree === "string"
    ) {
      const entity =
        await loader(tree);

      if (!entity) {
        throw new Error(
          `${entityName}_NOT_FOUND: ${tree}`
        );
      }

      return toPlain(entity);
    }

    if (
      !tree ||
      typeof tree !== "object" ||
      Array.isArray(tree)
    ) {
      throw new Error(
        `INVALID_${entityName}_REFERENCE_TREE`
      );
    }

    const result = {};

    for (
      const [
        key,
        value,
      ] of Object.entries(tree)
    ) {
      result[key] =
        await resolveReferenceTree({
          tree: value,
          loader,
          entityName,
        });
    }

    return result;
  };

const createResearchFreeze =
  async ({
    manifest,
  }) => {
    if (
      !manifest ||
      !manifest.id ||
      !manifest.version
    ) {
      throw new Error(
        "INVALID_RESEARCH_FREEZE_MANIFEST"
      );
    }

    const frozenAt =
      new Date().toISOString();

    const datasets =
      await resolveReferenceTree({
        tree:
          manifest.datasets,

        loader:
          findDatasetById,

        entityName:
          "DATASET",
      });

    const analysisRuns =
      await resolveReferenceTree({
        tree:
          manifest.analysisRuns,

        loader:
          findAnalysisRunById,

        entityName:
          "ANALYSIS_RUN",
      });

    const payload = {
      identity: {
        id:
          manifest.id,

        version:
          manifest.version,

        frozenAt,

        researchState:
          manifest.researchState,
      },

      market: {
        instrument:
          manifest.instrument,

        venue:
          manifest.venue,

        marketType:
          manifest.marketType,
      },

      references: {
        datasets:
          manifest.datasets,

        analysisRuns:
          manifest.analysisRuns,
      },

      resolvedEvidence: {
        datasets,

        analysisRuns,
      },

      findings: {
        volatilityStructure:
          manifest
            .volatilityStructure,

        calendarHourCandidate:
          manifest
            .calendarHourCandidate,
      },

      limitations:
        manifest.limitations,
    };

    const canonicalPayload =
      stableStringify(
        payload
      );

    const payloadChecksum =
      sha256(
        canonicalPayload
      );

    const artifact = {
      artifactType:
        "QUANTLOG_RESEARCH_FREEZE",

      schemaVersion:
        "1.0.0",

      checksum: {
        algorithm:
          "SHA256",

        scope:
          "CANONICAL_PAYLOAD",

        value:
          payloadChecksum,
      },

      payload,
    };

    const content =
      `${stableStringify(
        artifact,
        2
      )}\n`;

    const fileChecksum =
      sha256(content);

    const outputDirectory =
      path.join(
        process.cwd(),
        "storage",
        "research-freezes"
      );

    await fs.mkdir(
      outputDirectory,
      {
        recursive: true,
      }
    );

    const fileName =
      `${manifest.id}.json`;

    const filePath =
      path.join(
        outputDirectory,
        fileName
      );

    const checksumPath =
      `${filePath}.sha256`;

    try {
      await fs.writeFile(
        filePath,
        content,
        {
          encoding:
            "utf8",

          flag:
            "wx",
        }
      );
    } catch (error) {
      if (
        error.code ===
        "EEXIST"
      ) {
        throw new Error(
          `RESEARCH_FREEZE_ALREADY_EXISTS: ${filePath}`
        );
      }

      throw error;
    }

    try {
      await fs.writeFile(
        checksumPath,
        `${fileChecksum}  ${fileName}\n`,
        {
          encoding:
            "utf8",

          flag:
            "wx",
        }
      );
    } catch (error) {
      await fs.rm(
        filePath,
        {
          force: true,
        }
      );

      throw error;
    }

    return {
      freezeId:
        manifest.id,

      version:
        manifest.version,

      frozenAt,

      payloadChecksum,

      fileChecksum,

      filePath,

      checksumPath,

      datasetReferenceCount:
        Object.keys(
          manifest.datasets
        ).length,

      analysisRunGroups:
        Object.keys(
          manifest.analysisRuns
        ),
    };
  };

module.exports = {
  createResearchFreeze,
};