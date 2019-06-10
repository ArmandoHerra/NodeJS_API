/*
 * Helpers for various tasks.
 *
 */

// Dependencies
const crypto = require('crypto')
const config = require('./config')

// Container for all the helpers.
const helpers = {}

// Create a SHA512 hash.
helpers.hash = (str) => {
    if (typeof (str) == 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha512', config.hashingSecret)
            .update(str)
            .digest('hex')
        return hash
    } else {
        return false
    }
}

// Parse a JSON string into an object in all cases, without throwing.
helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str)
        return obj
    } catch (e) {
        return {}
    }
}

// Export the moodule.
module.exports = helpers