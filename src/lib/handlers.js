/* eslint-disable no-param-reassign */
/*
 * Request handlers.
 *
 */

// Dependencies.
const _data = require('./data');
const helpers = require('./helpers');
const { maxChecks } = require('./config');

// Define the handlers.
const handlers = {};

// Ping handler.
handlers.ping = (data, callback) => callback(200);

handlers.hello = (data, callback) => callback(200, {"Message: ": "Hello World!"})

// Not found handler.
handlers.notFound = (data, callback) => callback(404);

// Export the module.
module.exports = handlers;
