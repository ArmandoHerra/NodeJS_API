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
                        "Missing required token in header, or token is invalid."
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
                                            console.log("Error: ", error);
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
                                callback(200);
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
                        console.log(error);
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
                        callback(200);
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

export default handlers;
