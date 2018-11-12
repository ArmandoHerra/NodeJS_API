import crypto from "crypto";
import https from "https";
import querystring from "querystring";
import config from "./config";
import { LooseObject } from "./interfaces";

const helpers: LooseObject = {};

// Create a SHA256 hash.
helpers.hash = (str: string) => {
    if (typeof str === "string" && str.length > 0) {
        const hash = crypto
            .createHmac("sha256", config.hashingSecret)
            .update(str)
            .digest("hex");
        return hash;
    } else {
        return false;
    }
};

// Parser a JSON string to an object in all cases, whothout throwing.
helpers.parseJsonToObject = (str: string) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return {};
    }
};

// Create a string of random alphanumeric characters, of a given length.
helpers.createRandomString = (strLen: any) => {
    strLen = typeof strLen === "number" && strLen > 0 ? strLen : false;
    if (strLen) {
        const possibleCharacters =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";
        let str = "";
        for (let i = 1; i <= strLen; i++) {
            const randomChar = possibleCharacters.charAt(
                Math.floor(Math.random() * possibleCharacters.length)
            );
            str += randomChar;
        }
        return str;
    } else {
        return false;
    }
};

// Send an SMS message via Twilio.
helpers.sendTwilioSMS = (phone: string, msg: string, callback: any) => {
    const phoneNum: string | boolean =
        typeof phone === "string" && phone.trim().length === 10
            ? phone.trim()
            : false;
    const message: string | boolean =
        typeof msg === "string" &&
        msg.trim().length > 0 &&
        msg.trim().length <= 1600
            ? msg.trim()
            : false;

    if (phoneNum && message) {
        const payload: LooseObject = {
            Body: message,
            From: config.twilio.fromPhone,
            To: `+52${phoneNum}`
        };
        const stringPayload = querystring.stringify(payload);
        const requestDetails: LooseObject = {
            auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
            headers: {
                "Content-Length": Buffer.byteLength(stringPayload),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            hostname: "api.twilio.com",
            method: "POST",
            path: `/2010-04-01/Accounts/${
                config.twilio.accountSid
            }/Messages.json`,
            protocol: "https:"
        };
        console.log(payload);
        const req = https.request(requestDetails, (response: any) => {
            const status = response.statusCode;
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                callback(`Status code returned was: ${status}`);
            }
        });
        req.on("error", (error: any) => {
            callback({ Error: `${error}` });
        });
        req.write(stringPayload);
        req.end();
    } else {
        callback("Given parameters are missing or invalid.");
    }
};

export default helpers;
