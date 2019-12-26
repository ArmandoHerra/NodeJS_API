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

// users/
handlers.users = (userData, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(userData.method) > -1) {
        handlers._users[userData.method](userData, callback);
    } else {
        callback(405);
    }
};

// Container for the users submethods.
handlers._users = {};

// Users - post.
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
    // Check that all required fields are filled out.
    const firstName = typeof (data.payload.firstName) === 'string'
        && data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim()
        : false;
    const lastName = typeof (data.payload.lastName) === 'string'
        && data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim()
        : false;
    const phone = typeof (data.payload.phone) === 'string'
        && data.payload.phone.trim().length === 10
        ? data.payload.phone.trim()
        : false;
    const password = typeof (data.payload.password) === 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;
    const tosAgreement = !!(typeof (data.payload.tosAgreement) === 'boolean'
        && data.payload.tosAgreement === true);
    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't already exist.
        _data.read('users', phone, (dataReadError) => {
            if (dataReadError) {
                // Hash the password.
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    // Create the user object.
                    const userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement,
                    };
                    // Store the user.
                    _data.create('users', phone, userObject, (dataCreateError) => {
                        if (!dataCreateError) {
                            callback(200);
                        } else {
                            callback(500, {
                                Error: 'Could not create the new user.',
                            });
                        }
                    });
                } else {
                    callback(500, {
                        Error: 'Could not hash the user\'s password',
                    });
                }
            } else {
                // User already exists.
                callback(400, {
                    Error: 'A user with that phone number already exists.',
                });
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required fields.',
        });
    }
};

// Users get.
// Required data: phone.
// Optional data: none.
handlers._users.get = (data, callback) => {
    // Check that the phone number is valid.
    const phone = typeof (data.queryStringObject.phone) === 'string'
        && data.queryStringObject.phone.trim().length === 10
        ? data.queryStringObject.phone.trim()
        : false;
    if (phone) {
        // Get the token from the headers.
        const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number.
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                // Lookup the user.
                _data.read('users', phone, (dataReadError, dataReadData) => {
                    if (!dataReadError && dataReadData) {
                        // Remove the hashed password from the user obj before retuning it.
                        delete dataReadData.hashedPassword;
                        callback(200, dataReadData);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {
                    Error: 'Missing token in header or token is invalid.',
                });
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required field.',
        });
    }
};

// Users put.
// Required data: phone.
// Optional data: firstName, lastName, password. (At least one must be specified)
handlers._users.put = (data, callback) => {
    // Check for the required field.
    const phone = typeof (data.payload.phone) === 'string'
        && data.payload.phone.trim().length === 10
        ? data.payload.phone.trim()
        : false;
    // Check for the optional fields.
    const firstName = typeof (data.payload.firstName) === 'string'
        && data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim()
        : false;
    const lastName = typeof (data.payload.lastName) === 'string'
        && data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim()
        : false;
    const password = typeof (data.payload.password) === 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;
    // Error if the phone is invalid.
    if (phone) {
        // Error if nothing is sent to update.
        if (firstName || lastName || password) {
            // Get the token from the headers.
            const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
            // Verify that the given token is valid for the phone number.
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    // Lookup user.
                    _data.read('users', phone, (dataReadError, dataReadData) => {
                        if (!dataReadError && dataReadData) {
                            // Update the necessary fields.
                            if (firstName) dataReadData.firstName = firstName;
                            if (lastName) dataReadData.lastName = lastName;
                            if (password) dataReadData.hashedPassword = helpers.hash(password);
                            // Store the new updates.
                            _data.update('users', phone, data, (dataUpdateError) => {
                                if (!dataUpdateError) {
                                    callback(200);
                                } else {
                                    callback(500, {
                                        Error: 'Could not update the user.',
                                    });
                                }
                            });
                        } else {
                            callback(400, {
                                Error: 'The specified user does not exist.',
                            });
                        }
                    });
                } else {
                    callback(403, {
                        Error: 'Missing token in header or token is invalid.',
                    });
                }
            });
        } else {
            callback(400, {
                Error: 'Missing fields to update.',
            });
        }
    } else {
        callback(400, {
            Error: 'Missing required fields',
        });
    }
};


// Users delete.
// Required field: phone.
handlers._users.delete = (data, callback) => {
    // Check that the phone number is valid.
    const phone = typeof (data.queryStringObject.phone) === 'string'
        && data.queryStringObject.phone.trim().length === 10
        ? data.queryStringObject.phone.trim()
        : false;
    if (phone) {
        // Get the token from the headers.
        const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number.
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                // Lookup the user.
                _data.read('users', phone, (dataReadError, dataReadData) => {
                    if (!dataReadError && dataReadData) {
                        _data.delete('users', phone, (dataDeleteError) => {
                            if (!dataDeleteError) {
                                // Delete each of the checks associated with the user
                                const userChecks = typeof (dataReadData.checks) === 'object'
                                    && dataReadData.checks instanceof Array
                                    ? dataReadData.checks
                                    : [];
                                const checksToDelete = userChecks.length;
                                if (checksToDelete > 0) {
                                    let checksDeleted = 0;
                                    let deletionErrors = false;
                                    // Loop through the checks
                                    userChecks.forEach((checkId) => {
                                        // Delete the check
                                        _data.delete('checks', checkId, (dataDeleteErrorB) => {
                                            if (dataDeleteErrorB) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted += 1;
                                            if (checksDeleted === checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {
                                                        Error: 'Errors encountered while attempting to delete all of the users checks, all checks may now have been deleted from the system successfully',
                                                    });
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, {
                                    Error: 'Could not delete the specified user.',
                                });
                            }
                        });
                    } else {
                        callback(400, {
                            Error: 'Could not find the specified user.',
                        });
                    }
                });
            } else {
                callback(403, {
                    Error: 'Missing token in header or token is invalid.',
                });
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required field.',
        });
    }
};

// Tokens/
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the tokens submethods.
handlers._tokens = {};

// Tokens - post.
// Required data: phone, password.
// Optional data: none.
handlers._tokens.post = (data, callback) => {
    const phone = typeof (data.payload.phone) === 'string'
        && data.payload.phone.trim().length === 10
        ? data.payload.phone.trim()
        : false;
    const password = typeof (data.payload.password) === 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;
    if (phone && password) {
        // Lookup the user that matches that phone number.
        _data.read('users', phone, (dataReadError, dataReadData) => {
            if (!dataReadError) {
                // Hash the sent password, and compare it to the password stored in the user object.
                const hashedPassword = helpers.hash(password);
                if (hashedPassword === dataReadData.hashedPassword) {
                    // If valid, create a new token with a random name.
                    // Set expiration date to 1 hour in the future.
                    const tokenId = helpers.createRandomString(32);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObj = {
                        id: tokenId,
                        phone,
                        expires,
                    };
                    // Store the token.
                    _data.create('tokens', tokenId, tokenObj, (dataCreateError) => {
                        if (!dataCreateError) {
                            callback(200, tokenObj);
                        } else {
                            callback(500, {
                                Error: 'Could not create the new token.',
                            });
                        }
                    });
                } else {
                    callback(400, {
                        Error: 'The password did not match the specified users stored password.',
                    });
                }
            } else {
                callback(400, {
                    Error: 'Could not find the specified user.',
                });
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required fields.',
        });
    }
};

// Tokens - get.
// Required data: id.
// Optional data: none.
handlers._tokens.get = (data, callback) => {
    // Check that the id is valid.
    const id = typeof (data.queryStringObject.id) === 'string'
        && data.queryStringObject.id.trim().length === 32
        ? data.queryStringObject.id.trim()
        : false;
    if (id) {
        // Lookup the token.
        _data.read('tokens', id, (dataReadError, dataReadData) => {
            if (!dataReadError && dataReadData) {
                callback(200, dataReadData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(404, {
            Error: 'Missing required field.',
        });
    }
};

// Tokens - put.
// Required data: id, extend.
// Optional data: none.
handlers._tokens.put = (data, callback) => {
    const id = typeof (data.payload.id) === 'string'
        && data.payload.id.trim().length === 32
        ? data.payload.id.trim()
        : false;
    const extend = !!(typeof (data.payload.extend) === 'boolean'
        && data.payload.extend === true);
    if (id && extend) {
        // Lookup the token.
        _data.read('tokens', id, (dataReadError, dataReadData) => {
            if (!dataReadError && dataReadData) {
                // Check to make sure token isn't already expired.
                if (dataReadData.expires > Date.now()) {
                    // Set the expiration an hour from now.
                    dataReadData.expires = Date.now() + 1000 * 60 * 60;
                    // Store the new updates.
                    _data.update('tokens', id, dataReadData, (dataUpdateError) => {
                        if (!dataUpdateError) {
                            callback(200);
                        } else {
                            callback(500, {
                                Error: 'Could not update the tokens expiration.',
                            });
                        }
                    });
                } else {
                    callback(400, {
                        Error: 'The token has already expired and cannot be extended.',
                    });
                }
            } else {
                callback(400, {
                    Error: 'Specified token does not exist.',
                });
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required field(s) or field(s) are invalid.',
        });
    }
};

// Tokens - delete.
// Required data:
handlers._tokens.delete = (data, callback) => {
    // Check that the id is valid.
    const id = typeof (data.queryStringObject.id) === 'string'
        && data.queryStringObject.id.trim().length === 32
        ? data.queryStringObject.id.trim()
        : false;
    if (id) {
        // Lookup the token.
        _data.read('tokens', id, (dataReadError, dataReadData) => {
            if (!dataReadError && dataReadData) {
                _data.delete('tokens', id, (dataDeleteError) => {
                    if (!dataDeleteError) {
                        callback(200);
                    } else {
                        callback(500, {
                            Error: 'Could not delete the specified token.',
                        });
                    }
                });
            } else {
                callback(400, {
                    Error: 'Could not find the specified token.',
                });
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required field.',
        });
    }
};

// Verify if a given token id is currently valid for a given user.
handlers._tokens.verifyToken = (id, phone, callback) => {
    // Lookup the token.
    _data.read('tokens', id, (dataReadError, data) => {
        if (!dataReadError && data) {
            // Check that the token is for the given user and has not expired.
            if (data.phone === phone && data.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// Checks/
handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the checks methods.

handlers._checks = {};

// Checks - post.
// Required data: protocol, url, method, successCodes, timeoutSeconds.
// Optional data: none

handlers._checks.post = (data, callback) => {
    // Validate inputs.
    const protocol = typeof (data.payload.protocol) === 'string'
        && ['https', 'http'].indexOf(data.payload.protocol) > -1
        ? data.payload.protocol
        : false;
    const url = typeof (data.payload.url) === 'string'
        && data.payload.url.trim().length > 0
        ? data.payload.url.trim()
        : false;
    const method = typeof (data.payload.method) === 'string'
        && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
        ? data.payload.method
        : false;
    const successCodes = typeof (data.payload.successCodes) === 'object'
        && data.payload.successCodes instanceof Array
        && data.payload.successCodes.length > 0
        ? data.payload.successCodes
        : false;
    const timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number'
        && data.payload.timeoutSeconds % 1 === 0
        && data.payload.timeoutSeconds >= 1
        && data.payload.timeoutSeconds <= 5
        ? data.payload.timeoutSeconds
        : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // Get the token from the headers.
        const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
        // Lookup the user by reading the token.
        _data.read('tokens', token, (dataReadErrorA, dataReadDataA) => {
            if (!dataReadErrorA && dataReadDataA) {
                const userPhone = dataReadDataA.phone;
                // Lookup the user data.
                _data.read('users', userPhone, (dataReadErrorB, dataReadDataB) => {
                    if (!dataReadErrorB && dataReadDataB) {
                        const userChecks = typeof (dataReadDataB.checks) === 'object'
                            && dataReadDataB.checks instanceof Array
                            ? dataReadDataB.checks
                            : [];
                        // Verify that the user has less than the number of max checks per user.
                        if (userChecks.length < maxChecks) {
                            // Create a random id for the check.
                            const checkId = helpers.createRandomString(36);
                            // Create the check object, and include the user's phone.
                            const checkObj = {
                                id: checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds,
                            };
                            // Save the object,
                            _data.create('checks', checkId, checkObj, (dataCreateError) => {
                                if (!dataCreateError) {
                                    // Add the check id to the user's object.
                                    dataReadDataB.checks = userChecks;
                                    dataReadDataB.checks.push(checkId);
                                    // Save the new user data.
                                    _data.update('users', userPhone, dataReadDataB, (dataUpdateError) => {
                                        if (!dataUpdateError) {
                                            // Return the data about the new check.
                                            callback(200, checkObj);
                                        } else {
                                            callback(500, {
                                                Error: 'Could not update the user with the new check.',
                                            });
                                        }
                                    });
                                } else {
                                    callback(500, {
                                        Error: 'Could not create the new check',
                                    });
                                }
                            });
                        } else {
                            callback(400, {
                                Error: `The user already has the maximum number of checks (${maxChecks})`,
                            });
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required inputs, or inputs are invalid.',
        });
    }
};


// Checks - get.
// Required data: id
// Optional data: none
handlers._checks.get = (data, callback) => {
    // Check that the id is valid.
    const id = typeof (data.queryStringObject.id) === 'string'
        && data.queryStringObject.id.trim().length === 36
        ? data.queryStringObject.id.trim()
        : false;
    if (id) {
        // Lookup the check.
        _data.read('checks', id, (dataReadError, dataReadData) => {
            if (!dataReadError && dataReadData) {
                // Get the token from the headers.
                const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
                // eslint-disable-next-line max-len
                // Verify that the given token is valid and belongs to the user that created the check.
                handlers._tokens.verifyToken(token, dataReadData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        // Return the check data.
                        callback(200, dataReadData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required field.',
        });
    }
};

// Checks - put.
// Required data: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds (one must be set)

handlers._checks.put = (data, callback) => {
    // Check for the required field.
    const id = typeof (data.payload.id) === 'string'
        && data.payload.id.trim().length === 36
        ? data.payload.id.trim()
        : false;

    // Check for the optional fields.
    const protocol = typeof (data.payload.protocol) === 'string'
        && ['https', 'http'].indexOf(data.payload.protocol) > -1
        ? data.payload.protocol
        : false;
    const url = typeof (data.payload.url) === 'string'
        && data.payload.url.trim().length > 0
        ? data.payload.url.trim()
        : false;
    const method = typeof (data.payload.method) === 'string'
        && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
        ? data.payload.method
        : false;
    const successCodes = typeof (data.payload.successCodes) === 'object'
        && data.payload.successCodes instanceof Array
        && data.payload.successCodes.length > 0
        ? data.payload.successCodes
        : false;
    const timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number'
        && data.payload.timeoutSeconds % 1 === 0
        && data.payload.timeoutSeconds >= 1
        && data.payload.timeoutSeconds <= 5
        ? data.payload.timeoutSeconds
        : false;

    if (id) {
        // Check to make sure one or more optional fields have been sent
        if (protocol || url || method || successCodes || timeoutSeconds) {
            // Lookup the check
            _data.read('checks', id, (dataReadError, dataReadData) => {
                if (!dataReadError && dataReadData) {
                    // Get the token from the headers.
                    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
                    // eslint-disable-next-line max-len
                    // Verify that the given token is valid and belongs to the user that created the check.
                    handlers._tokens.verifyToken(token, dataReadData.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            // Update the check where necessary.
                            if (protocol) {
                                dataReadData.protocol = protocol;
                            }
                            if (url) {
                                dataReadData.url = url;
                            }
                            if (method) {
                                dataReadData.method = method;
                            }
                            if (successCodes) {
                                dataReadData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                dataReadData.timeoutSeconds = timeoutSeconds;
                            }
                            // Store the new updates.
                            _data.update('checks', id, dataReadData, (dataUpdateError) => {
                                if (!dataUpdateError) {
                                    callback(200);
                                } else {
                                    callback(400, {
                                        Error: 'Could not update the check',
                                    });
                                }
                            });
                        } else {
                            callback(403);
                        }
                    });
                } else {
                    callback(400, {
                        Error: 'Check ID did not exist',
                    });
                }
            });
        } else {
            callback(400, {
                Error: 'Missing fields to update',
            });
        }
    } else {
        callback(400, {
            Error: 'Missing required field',
        });
    }
};

// Checks - delete.
// Required data: id
// Optional data; none

handlers._checks.delete = (data, callback) => {
    // Check that the phone number is valid.
    const id = typeof (data.queryStringObject.id) === 'string'
        && data.queryStringObject.id.trim().length === 36
        ? data.queryStringObject.id.trim()
        : false;
    if (id) {
        // Lookup the check
        _data.read('checks', id, (dataReadErrorA, dataReadDataA) => {
            if (!dataReadErrorA && dataReadDataA) {
                // Get the token from the headers.
                const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
                // Verify that the given token is valid for the phone number.
                handlers._tokens.verifyToken(token, dataReadDataA.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        // Delete the check data
                        _data.delete('checks', id, (dataDeleteError) => {
                            if (!dataDeleteError) {
                                // Lookup the user.
                                _data.read('users', dataReadDataA.userPhone, (dataReadErrorB, dataReadDataB) => {
                                    if (!dataReadErrorB && dataReadDataB) {
                                        const userChecks = typeof (dataReadDataB.checks) === 'object'
                                            && dataReadDataB.checks instanceof Array
                                            ? dataReadDataB.checks
                                            : [];
                                        // Remove the delete check from their list of checks
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            // Re-save the users data.
                                            _data.update('users', dataReadDataA.userPhone, dataReadDataB, (dataUpdateError) => {
                                                if (!dataUpdateError) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {
                                                        Error: 'Could not update the specified user.',
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(500, {
                                                Error: 'Could not find the check on the users object, so could not remove it',
                                            });
                                        }
                                    } else {
                                        callback(500, {
                                            Error: 'Could not find the user who created the check, so could not remove the check from the list of checks on the user object',
                                        });
                                    }
                                });
                            } else {
                                callback(500, {
                                    Error: 'Could not delete the check data',
                                });
                            }
                        });
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(400, {
                    Error: 'The specified check ID does not exist',
                });
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required field.',
        });
    }
};


// Ping handler.
handlers.ping = (data, callback) => callback(200);

// Not found handler.
handlers.notFound = (data, callback) => callback(404);

// Export the module.
module.exports = handlers;
