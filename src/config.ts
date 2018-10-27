import { LooseObject } from "./interfaces";

const environments: LooseObject = {};

environments.development = {
    envName: "development",
    port: 3000
};

environments.production = {
    envName: "production",
    port: 5000
};

const currentEnvironment =
    typeof process.env.NODE_ENV === "string"
        ? process.env.NODE_ENV.toLowerCase()
        : "";

const environmentToExport =
    typeof environments[currentEnvironment] === "object"
        ? environments[currentEnvironment]
        : environments.development;

export default environmentToExport;
