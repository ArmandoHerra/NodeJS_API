/*
 * Helpers for various tasks.
 *
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for all the helpers.
const helpers = {};

// Create a SHA512 hash.
helpers.hash = (str) => {
    if (typeof (str) === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha512', config.hashingSecret)
            .update(str)
            .digest('hex');
        return hash;
    }
    return false;
};

// Parse a JSON string into an object in all cases, without throwing.
helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};

// Create a string of random alphanumeric characters, of a given length.
helpers.createRandomString = (strLength) => {
    if (typeof (strLength) === 'number' && strLength > 0 ? strLength : false) {
        // Define all the possible characters that could go in the string.
        const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        // Start the final str.
        let str = '';
        for (let i = 1; i <= strLength; i += 1) {
            // Get a random character from the possibleChars string.
            // eslint-disable-next-line max-len
            const randomCharacter = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            // Append this character to the final str.
            str += randomCharacter;
        }
        return str;
    }
    return false;
};

// Export the moodule.
module.exports = helpers;
