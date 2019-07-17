/*
 * Create and export configuration variables.
 *
 */

// Container for the environments.

const environments = {};

// Staging (default) environment.
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging',
    hashingSecret: 'iY6Z34LHv67vAFeMFaGkctTGKKPy6ZUg!m@vett_qLuByvoFNk',
    maxChecks: 5,
};

// Production environment.
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: '6@xV2FF-pfm2nVj6TUV7!wXj!z@hkq6PyzdCc*28n-Bw.3DDKx',
    maxChecks: 5,
};

// Determine which environment was passed as a command-line argument.
const currentEnvironment = typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

// Check that the current environment is one of the environment above, if not, default to staging.
const environmentToExport = typeof environments[currentEnvironment] === 'object'
    ? environments[currentEnvironment]
    : environments.staging;

// Export the module.
module.exports = environmentToExport;
