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
handlers._users.get = (data, cb) => {
    // Check that the phone number is valid.
    const phone = typeof (data.queryStringObject.phone) == 'string'
        && data.queryStringObject.phone.trim().length == 10
        ? data.queryStringObject.phone.trim()
        : false
    if (phone) {
        // Get the token from the headers.
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
        // Verify that the given token is valid for the phone number.
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
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
                cb(403, {
                    'Error': 'Missing token in header or token is invalid.'
                })
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
            // Get the token from the headers.
            const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
            // Verify that the given token is valid for the phone number.
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
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
                    cb(403, {
                        'Error': 'Missing token in header or token is invalid.'
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
// @TODO cleanup (delete) any other data files associated with this user.
handlers._users.delete = (data, cb) => {
    // Check that the phone number is valid.
    const phone = typeof (data.queryStringObject.phone) == 'string'
        && data.queryStringObject.phone.trim().length == 10
        ? data.queryStringObject.phone.trim()
        : false
    if (phone) {
        // Get the token from the headers.
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
        // Verify that the given token is valid for the phone number.
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
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
                cb(403, {
                    'Error': 'Missing token in header or token is invalid.'
                })
            }
        })
    } else {
        cb(400, {
            'Error': 'Missing required field.'
        })
    }
};

// Tokens/
handlers.tokens = (data, cb) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, cb);
    } else {
        cb(405);
    }
};

// Container for the tokens submethods.
handlers._tokens = {};

// Tokens - post.
// Required data: phone, password.
// Optional data: none.
handlers._tokens.post = (data, cb) => {
    const phone = typeof (data.payload.phone) == 'string'
        && data.payload.phone.trim().length == 10
        ? data.payload.phone.trim()
        : false
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;
    if (phone && password) {
        // Lookup the user that matches that phone number.
        _data.read('users', phone, (err, data) => {
            if (!err) {
                // Hash the sent password, and compare it to the password stored in the user object.
                const hashedPassword = helpers.hash(password)
                if (hashedPassword == data.hashedPassword) {
                    // If valid, create a new token with a random name. Set expiration date to 1 hour in the future.
                    const tokenId = helpers.createRandomString(32)
                    const expires = Date.now() + 1000 * 60 * 60
                    const tokenObj = {
                        id: tokenId,
                        phone,
                        expires
                    }
                    console.log(JSON.stringify(tokenObj, null, 4))
                    // Store the token.
                    _data.create('tokens', tokenId, tokenObj, (err) => {
                        if (!err) {
                            cb(200, tokenObj)
                        } else {
                            cb(500, {
                                'Error': 'Could not create the new token.'
                            })
                        }
                    })
                } else {
                    cb(400, {
                        'Error': 'The password did not match the specified users stored password.'
                    })
                }
            } else {
                cb(400, {
                    'Error': 'Could not find the specified user.'
                })
            }
        })
    } else {
        cb(400, {
            'Error': 'Missing required fields.'
        })
    }
}

// Tokens - get.
// Required data: id.
// Optional data: none.
handlers._tokens.get = (data, cb) => {
    // Check that the id is valid.
    const id = typeof (data.queryStringObject.id) == 'string'
        && data.queryStringObject.id.trim().length == 32
        ? data.queryStringObject.id.trim()
        : false
    if (id) {
        // Lookup the token.
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                cb(200, data)
            } else {
                cb(404)
            }
        })
    } else {
        cb(404, {
            'Error': 'Missing required field.'
        })
    }
}

// Tokens - put.
// Required data: id, extend.
// Optional data: none.
handlers._tokens.put = (data, cb) => {
    const id = typeof (data.payload.id) == 'string'
        && data.payload.id.trim().length == 32
        ? data.payload.id.trim()
        : false
    const extend = typeof (data.payload.extend) == 'boolean'
        && data.payload.extend == true
        ? true
        : false
    if (id && extend) {
        // Lookup the token.
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                // Check to make sure token isn't already expired.
                if (data.expires > Date.now()) {
                    // Set the expiration an hour from now.
                    data.expires = Date.now() + 1000 * 60 * 60
                    // Store the new updates.
                    _data.update('tokens', id, data, (err) => {
                        if (!err) {
                            cb(200)
                        } else {
                            cb(500, {
                                'Error': 'Could not update the tokens expiration.'
                            })
                        }
                    })
                } else {
                    cb(400, {
                        'Error': 'The token has already expired and cannot be extended.'
                    })
                }
            } else {
                cb(400, {
                    'Error': 'Specified token does not exist.'
                })
            }
        })
    } else {
        cb(400, {
            'Error': 'Missing required field(s) or field(s) are invalid.'
        })
    }
}

// Tokens - delete.
// Required data: 
handlers._tokens.delete = (data, cb) => {
    // Check that the id is valid.
    const id = typeof (data.queryStringObject.id) == 'string'
        && data.queryStringObject.id.trim().length == 32
        ? data.queryStringObject.id.trim()
        : false
    if (id) {
        // Lookup the token.
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        cb(200)
                    } else {
                        cb(500, {
                            'Error': 'Could not delete the specified token.'
                        })
                    }
                })
            } else {
                cb(400, {
                    'Error': 'Could not find the specified token.'
                })
            }
        })
    } else {
        cb(400, {
            'Error': 'Missing required field.'
        })
    }
}

// Verify if a given token id is currently valid for a given user.
handlers._tokens.verifyToken = (id, phone, cb) => {
    // Lookup the token.
    _data.read('tokens', id, (err, data) => {
        if (!err && data) {
            // Check that the token is for the given user and has not expired.
            if (data.phone == phone && data.expires > Date.now()) {
                cb(true)
            } else {
                cb(false)
            }
        } else {
            cb(false)
        }
    })
}

// Ping handler.
handlers.ping = (data, cb) => cb(200);

// Not found handler.
handlers.notFound = (data, cb) => cb(404);

// Export the module.
module.exports = handlers;
