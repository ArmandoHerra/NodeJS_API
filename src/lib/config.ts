import { LooseObject } from "./interfaces";

const environments: LooseObject = {};

environments.development = {
    envName: "development",
    hashingSecret: "b%~+}QoEPaB=@5ou*#8q6~RmYBcZ=K40nq37",
    httpPort: 3000,
    httpsPort: 3001
};

environments.production = {
    envName: "production",
    hashingSecret: "7)EGLh3_7NP:h-!UkZp>pz)eeRYP9VapzZri",
    httpPort: 5000,
    httpsPort: 5001
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
