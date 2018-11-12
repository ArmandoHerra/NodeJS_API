import config from "./config";
import _data from "./data";
import helpers from "./helpers";
import { LooseObject } from "./interfaces";

const handlers: LooseObject = {};

handlers.notFound = (data: object, callback: any) => {
    callback(404, { message: "No such endpoint!" });
};

handlers.ping = (data: object, callback: any) => {
    callback(200);
};

handlers.users = (data: LooseObject, callback: any) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._users = {};

handlers._users.post = (data: LooseObject, callback: any) => {
    const firstName: string =
        typeof data.payload.firstName === "string" &&
        data.payload.firstName.trim().length > 0
            ? data.payload.firstName.trim()
            : false;

    const lastName: string =
        typeof data.payload.lastName === "string" &&
        data.payload.lastName.trim().length > 0
            ? data.payload.lastName.trim()
            : false;

    const phone: string =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length === 10
            ? data.payload.phone.trim()
            : false;

    const password: string =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
            ? data.payload.password.trim()
            : false;

    const tosAgreement: boolean =
        typeof data.payload.tosAgreement === "boolean" &&
        data.payload.tosAgreement === true
            ? true
            : false;

    if (firstName && lastName && password && tosAgreement) {
        _data.read("users", phone, (error: any, data: object) => {
            if (error) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    const userObject: LooseObject = {
                        firstName: firstName,
                        hashedPassword: hashedPassword,
                        lastName: lastName,
                        phone: phone,
                        tosAgreement: true
                    };
                    _data.create("users", phone, userObject, (error: any) => {
                        if (!error) {
                            callback(200);
                        } else {
                            callback(500, {
                                Error: "Could not create the new user."
                            });
                        }
                    });
                } else {
                    callback(500, {
                        Error: "Could not hash the user's password."
                    });
                }
            } else {
                callback(400, {
                    Error: "A user with that phone number already exists."
                });
            }
        });
    } else {
        callback(400, { Error: "Missing required fields." });
    }
};

handlers._users.get = (data: LooseObject, callback: any) => {
    const phone: string =
        typeof data.queryStringObject.phone === "string" &&
        data.queryStringObject.phone.trim().length === 10
            ? data.queryStringObject.phone.trim()
            : false;
    if (phone) {
        const token =
            typeof data.headers.token === "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, (tokenIsValid: any) => {
            if (tokenIsValid) {
                _data.read("users", phone, (error: any, data: LooseObject) => {
                    if (!error && data) {
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {
                    Error:
                        "Missing required token in header, token is invalid or has expired."
                });
            }
        });
    } else {
        callback(400, { Error: "Missing required field." });
    }
};

handlers._users.put = (data: LooseObject, callback: any) => {
    const phone: string =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length === 10
            ? data.payload.phone.trim()
            : false;

    const firstName: string =
        typeof data.payload.firstName === "string" &&
        data.payload.firstName.trim().length > 0
            ? data.payload.firstName.trim()
            : false;

    const lastName: string =
        typeof data.payload.lastName === "string" &&
        data.payload.lastName.trim().length > 0
            ? data.payload.lastName.trim()
            : false;

    const password: string =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
            ? data.payload.password.trim()
            : false;

    if (phone) {
        if (firstName || lastName || password) {
            const token =
                typeof data.headers.token === "string"
                    ? data.headers.token
                    : false;

            handlers._tokens.verifyToken(token, phone, (tokenIsValid: any) => {
                if (tokenIsValid) {
                    _data.read(
                        "users",
                        phone,
                        (error: any, userData: LooseObject) => {
                            if (!error && userData) {
                                if (firstName) {
                                    userData.firstName = firstName;
                                }
                                if (lastName) {
                                    userData.lastName = lastName;
                                }
                                if (password) {
                                    userData.hashedPassword = helpers.hash(
                                        password
                                    );
                                }
                                _data.update(
                                    "users",
                                    phone,
                                    userData,
                                    (error: any) => {
                                        if (!error) {
                                            callback(200);
                                        } else {
                                            callback(500, {
                                                Error:
                                                    "Could not update the user."
                                            });
                                        }
                                    }
                                );
                            } else {
                                callback(400, {
                                    Error: "The specified user does not exist."
                                });
                            }
                        }
                    );
                } else {
                    callback(403, {
                        Error:
                            "Missing required token in header, or token is invalid."
                    });
                }
            });
        } else {
            callback(400, { Error: "Missing fields to update." });
        }
    } else {
        callback(400, { Error: "Missing required field." });
    }
};

handlers._users.delete = (data: LooseObject, callback: any) => {
    const phone: string =
        typeof data.queryStringObject.phone === "string" &&
        data.queryStringObject.phone.trim().length === 10
            ? data.queryStringObject.phone.trim()
            : false;

    if (phone) {
        const token =
            typeof data.headers.token === "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, (tokenIsValid: any) => {
            if (tokenIsValid) {
                _data.read("users", phone, (error: any, data: LooseObject) => {
                    if (!error && data) {
                        _data.delete("users", phone, (error: any) => {
                            if (!error) {
                                const userChecks =
                                    typeof data.checks === "object" &&
                                    data.checks instanceof Array
                                        ? data.checks
                                        : [];
                                const checkToDelete = userChecks.length;
                                if (checkToDelete > 0) {
                                    let checksDeleted = 0;
                                    let deletionErrors = false;
                                    userChecks.forEach((id) => {
                                        _data.delete(
                                            "checks",
                                            id,
                                            (error: any) => {
                                                if (error) {
                                                    deletionErrors = true;
                                                }
                                                checksDeleted++;
                                                if (
                                                    checksDeleted ===
                                                    checkToDelete
                                                ) {
                                                    if (!deletionErrors) {
                                                        callback(200, {
                                                            Response:
                                                                "User and user checks deleted successfully."
                                                        });
                                                    } else {
                                                        callback(500, {
                                                            Error: `Errors encountered while attempting to delete
                                                                the user's checks.`
                                                        });
                                                    }
                                                }
                                            }
                                        );
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, {
                                    Error:
                                        "Could not delete the specified user."
                                });
                            }
                        });
                    } else {
                        callback(400, {
                            Error: "Could not find the specified user."
                        });
                    }
                });
            } else {
                callback(403, {
                    Error:
                        "Missing required token in header, or token is invalid."
                });
            }
        });
    } else {
        callback(400, { Error: "Missing required field." });
    }
};

handlers.tokens = (data: LooseObject, callback: any) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._tokens = {};

handlers._tokens.post = (data: LooseObject, callback: any) => {
    const phone: string =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length === 10
            ? data.payload.phone.trim()
            : false;

    const password: string =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
            ? data.payload.password.trim()
            : false;

    if (phone && password) {
        _data.read("users", phone, (error: any, userData: LooseObject) => {
            if (!error && userData) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword === userData.hashedPassword) {
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObj = {
                        expires: expires,
                        id: tokenId,
                        phone: phone
                    };
                    _data.create("tokens", tokenId, tokenObj, (error: any) => {
                        if (!error) {
                            callback(200, tokenObj);
                        } else {
                            callback(500, {
                                Error: "Could not create the new token."
                            });
                        }
                    });
                } else {
                    callback(400, {
                        Error:
                            "Password did not match the specified user's stored password."
                    });
                }
            } else {
                callback(400, {
                    Error: "Error could not find the specified user."
                });
            }
        });
    } else {
        callback(400, { Error: "Missing required fields." });
    }
};
handlers._tokens.get = (data: LooseObject, callback: any) => {
    const id: string =
        typeof data.queryStringObject.id === "string" &&
        data.queryStringObject.id.trim().length === 20
            ? data.queryStringObject.id.trim()
            : false;

    if (id) {
        _data.read("tokens", id, (error: any, tokenData: LooseObject) => {
            if (!error && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404, { Error: "Token does not exist." });
            }
        });
    } else {
        callback(400, { Error: "Missing required field." });
    }
};
handlers._tokens.put = (data: LooseObject, callback: any) => {
    const id: string =
        typeof data.payload.id === "string" &&
        data.payload.id.trim().length === 20
            ? data.payload.id.trim()
            : false;

    const extend: boolean =
        typeof data.payload.extend === "boolean" && data.payload.extend === true
            ? true
            : false;

    if (id && extend) {
        _data.read("tokens", id, (error: any, tokenData: LooseObject) => {
            if (!error && tokenData) {
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update("tokens", id, tokenData, (error: any) => {
                        if (!error) {
                            callback(200, tokenData);
                        } else {
                            callback(500, {
                                Error:
                                    "Could not update token's expiration date."
                            });
                        }
                    });
                } else {
                    callback(400, {
                        Error:
                            "The token has already expired and can't be extended."
                    });
                }
            } else {
                callback(400, { Error: "Specified token does not exist." });
            }
        });
    } else {
        callback(400, {
            Error: "Missing required fields or fields are invalid."
        });
    }
};
handlers._tokens.delete = (data: LooseObject, callback: any) => {
    const id: string =
        typeof data.queryStringObject.id === "string" &&
        data.queryStringObject.id.trim().length === 20
            ? data.queryStringObject.id.trim()
            : false;

    if (id) {
        _data.read("tokens", id, (error: any, data: LooseObject) => {
            if (!error && data) {
                _data.delete("tokens", id, (error: any) => {
                    if (!error) {
                        callback(200, {
                            Response: "Token deleted successfully."
                        });
                    } else {
                        callback(500, {
                            Error: "Could not delete the specified user."
                        });
                    }
                });
            } else {
                callback(400, { Error: "Could not find the specified user." });
            }
        });
    } else {
        callback(400, { Error: "Missing required field." });
    }
};

handlers._tokens.verifyToken = (id: number, phone: string, callback: any) => {
    _data.read("tokens", id, (error: any, tokenData: LooseObject) => {
        if (!error && tokenData) {
            if (tokenData.phone === phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

handlers.checks = (data: LooseObject, callback: any) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._checks = {};

handlers._checks.post = (data: LooseObject, callback: any) => {
    const protocol: string =
        typeof data.payload.protocol === "string" &&
        ["https", "http"].indexOf(data.payload.protocol) > -1
            ? data.payload.protocol
            : false;

    const url: string =
        typeof data.payload.url === "string" &&
        data.payload.url.trim().length > 0
            ? data.payload.url.trim()
            : false;

    const method: string =
        typeof data.payload.method === "string" &&
        ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
            ? data.payload.method
            : false;

    const successCodes: string =
        typeof data.payload.successCodes === "object" &&
        data.payload.successCodes instanceof Array &&
        data.payload.successCodes.length > 0
            ? data.payload.successCodes
            : false;

    const timeoutSeconds: number =
        typeof data.payload.timeoutSeconds === "number" &&
        data.payload.timeoutSeconds % 1 === 0 &&
        data.payload.timeoutSeconds >= 1 &&
        data.payload.timeoutSeconds <= 5
            ? data.payload.timeoutSeconds
            : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        const token =
            typeof data.headers.token === "string" ? data.headers.token : false;
        _data.read("tokens", token, (error: any, tokenData: LooseObject) => {
            if (!error && tokenData) {
                const userPhone = tokenData.phone;
                _data.read(
                    "users",
                    userPhone,
                    (error: any, userData: LooseObject) => {
                        if (!error && userData) {
                            const userChecks =
                                typeof userData.checks === "object" &&
                                userData.checks instanceof Array
                                    ? userData.checks
                                    : [];
                            if (userChecks.length < config.maxChecks) {
                                const checkId = helpers.createRandomString(20);
                                const checkObj = {
                                    id: checkId,
                                    method: method,
                                    protocol: protocol,
                                    successCodes: successCodes,
                                    timeoutSeconds: timeoutSeconds,
                                    url: url,
                                    userPhone: userPhone
                                };
                                _data.create(
                                    "checks",
                                    checkId,
                                    checkObj,
                                    (error: any) => {
                                        if (!error) {
                                            userData.checks = userChecks;
                                            userData.checks.push(checkId);
                                            _data.update(
                                                "users",
                                                userPhone,
                                                userData,
                                                (error: any) => {
                                                    if (!error) {
                                                        callback(200, checkObj);
                                                    } else {
                                                        callback(500, {
                                                            Error:
                                                                "Could not update the user with the new check."
                                                        });
                                                    }
                                                }
                                            );
                                        } else {
                                            callback(500, {
                                                Error:
                                                    "Could not create the new check."
                                            });
                                        }
                                    }
                                );
                            } else {
                                callback(400, {
                                    Error: `The user already has the maximum number of checks. (${
                                        config.maxChecks
                                    })`
                                });
                            }
                        } else {
                            callback(403, {
                                Error:
                                    "Not authorized to access these resources."
                            });
                        }
                    }
                );
            } else {
                callback(403, { Error: "Not a valid token." });
            }
        });
    } else {
        callback(400, {
            Error: "Missing required inputs, or inputs are invalid."
        });
    }
};

handlers._checks.get = (data: LooseObject, callback: any) => {
    const id: string =
        typeof data.queryStringObject.id === "string" &&
        data.queryStringObject.id.trim().length === 20
            ? data.queryStringObject.id.trim()
            : false;
    console.log(id);
    if (id) {
        _data.read("checks", id, (error: any, checkData: LooseObject) => {
            if (!error && checkData) {
                const token =
                    typeof data.headers.token === "string"
                        ? data.headers.token
                        : false;
                handlers._tokens.verifyToken(
                    token,
                    checkData.userPhone,
                    (tokenIsValid: any) => {
                        if (tokenIsValid) {
                            callback(200, checkData);
                        } else {
                            callback(403, {
                                Error: "Token is invalid or has expired."
                            });
                        }
                    }
                );
            } else {
                callback(404, { Error: "Check was not found." });
            }
        });
    } else {
        callback(400, { Error: "Missing required field." });
    }
};

handlers._checks.put = (data: LooseObject, callback: any) => {
    const id: string =
        typeof data.payload.id === "string" &&
        data.payload.id.trim().length === 20
            ? data.payload.id.trim()
            : false;

    const protocol: string =
        typeof data.payload.protocol === "string" &&
        ["https", "http"].indexOf(data.payload.protocol) > -1
            ? data.payload.protocol
            : false;

    const url: string =
        typeof data.payload.url === "string" &&
        data.payload.url.trim().length > 0
            ? data.payload.url.trim()
            : false;

    const method: string =
        typeof data.payload.method === "string" &&
        ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
            ? data.payload.method
            : false;

    const successCodes: string =
        typeof data.payload.successCodes === "object" &&
        data.payload.successCodes instanceof Array &&
        data.payload.successCodes.length > 0
            ? data.payload.successCodes
            : false;

    const timeoutSeconds: number =
        typeof data.payload.timeoutSeconds === "number" &&
        data.payload.timeoutSeconds % 1 === 0 &&
        data.payload.timeoutSeconds >= 1 &&
        data.payload.timeoutSeconds <= 5
            ? data.payload.timeoutSeconds
            : false;
    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            _data.read("checks", id, (error: any, checkData: LooseObject) => {
                if (!error && checkData) {
                    const token =
                        typeof data.headers.token === "string"
                            ? data.headers.token
                            : false;
                    handlers._tokens.verifyToken(
                        token,
                        checkData.userPhone,
                        (tokenIsValid: any) => {
                            if (tokenIsValid) {
                                if (protocol) {
                                    checkData.protocol = protocol;
                                }
                                if (url) {
                                    checkData.url = url;
                                }
                                if (method) {
                                    checkData.method = method;
                                }
                                if (successCodes) {
                                    checkData.successCodes = successCodes;
                                }
                                if (timeoutSeconds) {
                                    checkData.timeoutSeconds = timeoutSeconds;
                                }
                                _data.update(
                                    "checks",
                                    id,
                                    checkData,
                                    (error: any) => {
                                        if (!error) {
                                            callback(200, {
                                                Response:
                                                    "Check updated successfully."
                                            });
                                        } else {
                                            callback(500, {
                                                Error:
                                                    "Could not update the check."
                                            });
                                        }
                                    }
                                );
                            } else {
                                callback(403, {
                                    Error: "Token is invalid or has expired."
                                });
                            }
                        }
                    );
                } else {
                    callback(400, { Error: "Check ID does not exist." });
                }
            });
        } else {
            callback(400, { Error: "Missing fields to update." });
        }
    } else {
        callback(400, { Error: "Missing required field." });
    }
};

handlers._checks.delete = (data: LooseObject, callback: any) => {
    const id: string =
        typeof data.queryStringObject.id === "string" &&
        data.queryStringObject.id.trim().length === 20
            ? data.queryStringObject.id.trim()
            : false;

    if (id) {
        const token =
            typeof data.headers.token === "string" ? data.headers.token : false;
        _data.read("checks", id, (error: any, checkData: LooseObject) => {
            if (!error && checkData) {
                handlers._tokens.verifyToken(
                    token,
                    checkData.userPhone,
                    (tokenIsValid: any) => {
                        if (tokenIsValid) {
                            _data.delete("checks", id, (error: any) => {
                                if (!error) {
                                    _data.read(
                                        "users",
                                        checkData.userPhone,
                                        (error: any, userData: LooseObject) => {
                                            if (!error && userData) {
                                                const userChecks =
                                                    typeof userData.checks ===
                                                        "object" &&
                                                    userData.checks instanceof
                                                        Array
                                                        ? userData.checks
                                                        : [];
                                                const checkIndex = userChecks.indexOf(
                                                    id
                                                );
                                                if (checkIndex > -1) {
                                                    userChecks.splice(
                                                        checkIndex,
                                                        1
                                                    );
                                                    _data.update(
                                                        "users",
                                                        checkData.userPhone,
                                                        userData,
                                                        (error: any) => {
                                                            if (!error) {
                                                                callback(200, {
                                                                    Response:
                                                                        "User check deleted successfully."
                                                                });
                                                            } else {
                                                                callback(500, {
                                                                    Error:
                                                                        "Could not remove the check from the user."
                                                                });
                                                            }
                                                        }
                                                    );
                                                } else {
                                                    callback(500, {
                                                        Error:
                                                            "Could not find the check on the user object."
                                                    });
                                                }
                                            } else {
                                                callback(500, {
                                                    Error: `Could not find the user who created the check,
                                                        so could not remove the check from the
                                                        list of checks on the user.`
                                                });
                                            }
                                        }
                                    );
                                } else {
                                    callback(500, {
                                        Error:
                                            "Could not delete the check data."
                                    });
                                }
                            });
                        } else {
                            callback(403, {
                                Error:
                                    "Missing required token in header, or token is invalid."
                            });
                        }
                    }
                );
            } else {
                callback(400, {
                    Error: "The specified check ID does not exist."
                });
            }
        });
    } else {
        callback(400, { Error: "Missing required field." });
    }
};

export default handlers;
