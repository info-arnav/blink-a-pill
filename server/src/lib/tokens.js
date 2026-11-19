const crypto = require('node:crypto');

const randomToken = (bytes = 24) => crypto.randomBytes(bytes).toString('base64url');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const randomDigits = (length) => {
  let out = '';
  for (let i = 0; i < length; i += 1) out += crypto.randomInt(0, 10).toString();
  return out;
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomCode = (length) => {
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  return out;
};

module.exports = { randomToken, sha256, randomDigits, randomCode };
