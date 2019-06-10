/*
 * Request handlers.
 *
 */

// Dependencies.
const _data = require('./data')
const helpers = require('./helpers')

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
handlers._users = {};

// Users - post.
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, cb) => {
    // Check that all required fields are filled out.
    const firstName = typeof (data.payload.firstName) == 'string'
        && data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim()
        : false
    const lastName = typeof (data.payload.lastName) == 'string'
        && data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim()
        : false
    const phone = typeof (data.payload.phone) == 'string'
        && data.payload.phone.trim().length == 10
        ? data.payload.phone.trim()
        : false
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;
    const tosAgreement = typeof (data.payload.tosAgreement) == 'boolean'
        && data.payload.tosAgreement == true
        ? true
        : false
    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't already exist.
        _data.read('users', phone, (err, data) => {
            if (err) {
                // Hash the password.
                const hashedPassword = helpers.hash(password)
                if (hashedPassword) {
                    // Create the user object.
                    const userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement
                    }
                    // Store the user.
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            cb(200)
                        } else {
                            console.log(err)
                            cb(500, {
                                'Error': 'Could not create the new user.'
                            })
                        }
                    })
                } else {
                    cb(500, {
                        'Error': 'Could not hash the user\'s password'
                    })
                }
            } else {
                // User already exists.
                cb(400, {
                    'Error': 'A user with that phone number already exists.'
                })
            }
        })
    } else {
        cb(400, {
            'Error': 'Missing required fields.'
        })
    }
};

// Users get.
// Required data: phone.
// Optional data: none.
// @TODO Only let an authenticated user access their object. Don't let them access anyone elses.
handlers._users.get = (data, cb) => {
    // Check that the phone number is valid.
    const phone = typeof (data.queryStringObject.phone) == 'string'
        && data.queryStringObject.phone.trim().length == 10
        ? data.queryStringObject.phone.trim()
        : false
    if (phone) {
        // Lookup the user.
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                // Remove the hashed password from the user object before retuning it to the requester.
                delete data.hashedPassword
                cb(200, data)
            } else {
                cb(404)
            }
        })
    } else {
        cb(400, {
            'Error': 'Missing required field.'
        })
    }
};

// Users put.
// Required data: phone.
// Optional data: firstName, lastName, password. (At least one must be specified)
// @TODO Only let an authenticated user update their own object. Don't let them update anyone else's.
handlers._users.put = (data, cb) => {
    // Check for the required field.
    const phone = typeof (data.payload.phone) == 'string'
        && data.payload.phone.trim().length == 10
        ? data.payload.phone.trim()
        : false
    // Check for the optional fields.
    const firstName = typeof (data.payload.firstName) == 'string'
        && data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim()
        : false
    const lastName = typeof (data.payload.lastName) == 'string'
        && data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim()
        : false
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;
    // Error if the phone is invalid.
    if (phone) {
        // Error if nothing is sent to update.
        if (firstName || lastName || password) {
            // Lookup user.
            _data.read('users', phone, (err, data) => {
                if (!err && data) {
                    // Update the necessary fields.
                    if (firstName) {
                        data.firstName = firstName
                    }
                    if (lastName) {
                        data.lastName = lastName
                    }
                    if (password) {
                        data.hashedPassword = helpers.hash(password)
                    }
                    // Store the new updates.
                    _data.update('users', phone, data, (err) => {
                        if (!err) {
                            cb(200)
                        } else {
                            console.log(err)
                            cb(500, {
                                'Error': 'Could not update the user.'
                            })
                        }
                    })
                } else {
                    cb(400, {
                        'Error': 'The specified user does not exist.'
                    })
                }
            })
        } else {
            cb(400, {
                'Error': 'Missing fields to update.'
            })
        }
    } else {
        cb(400, {
            'Error': 'Missing required fields'
        })
    }
};

// Users delete.
// Required field: phone.
// @TODO Only let an authenticated user delete their object. Don't let them delete anyone else's.
// @TODO cleanup (delete) any other data files associated with this user.
handlers._users.delete = (data, cb) => {
    // Check that the phone number is valid.
    const phone = typeof (data.queryStringObject.phone) == 'string'
        && data.queryStringObject.phone.trim().length == 10
        ? data.queryStringObject.phone.trim()
        : false
    if (phone) {
        // Lookup the user.
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                _data.delete('users', phone, (err) => {
                    if (!err) {
                        cb(200)
                    } else {
                        cb(500, {
                            'Error': 'Could not delete the specified user.'
                        })
                    }
                })
            } else {
                cb(400, {
                    'Error': 'Could not find the specified user.'
                })
            }
        })
    } else {
        cb(400, {
            'Error': 'Missing required field.'
        })
    }
};

// Ping handler.
handlers.ping = (data, cb) => cb(200);

// Not found handler.
handlers.notFound = (data, cb) => cb(404);

// Export the module.
module.exports = handlers;
