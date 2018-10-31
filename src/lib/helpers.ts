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

export default helpers;
