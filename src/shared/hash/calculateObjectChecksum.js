const crypto = require(
  "crypto"
);

const {
  canonicalJsonStringify,
} = require(
  "./canonicalJson"
);

const calculateObjectChecksum = (
  value
) =>
  crypto
    .createHash(
      "sha256"
    )
    .update(
      canonicalJsonStringify(
        value
      )
    )
    .digest(
      "hex"
    );

module.exports = {
  calculateObjectChecksum,
};