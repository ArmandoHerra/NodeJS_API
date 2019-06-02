/*
 * Request handlers.
 *
 */

// Dependencies.

// Define the handlers.
const handlers = {};

// Users/
handlers.users = (data, cb) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, cb);
    } else {
        cb(405);
    }
};

// Container for the users submethods.

// Ping handler.
handlers.ping = (data, cb) => cb(200);

// Not found handler.
handlers.notFound = (data, cb) => cb(404);

// Export the module.
module.exports = handlers;
