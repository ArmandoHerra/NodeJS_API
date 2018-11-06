import crypto from "crypto";
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

export default helpers;
