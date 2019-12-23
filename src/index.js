/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/*
 *
 *   Index file.
 *
 */

// Node Dependencies.
const fs = require('fs');
const url = require('url');
const http = require('http');
const https = require('https');
const { StringDecoder } = require('string_decoder');

// Own Dependencies.
const config = require('./lib/config');
// eslint-disable-next-line no-unused-vars
const _data = require('./lib/data');
const helpers = require('./lib/helpers');
const handlers = require('./lib/handlers');

// Define a request router.
const router = {
    ping: handlers.ping,
    hello: handlers.hello
};

// All the server logic for both the HTTP and HTTPS server.
const unifiedServer = (req, res) => {
    // Get the URL and parse it.
    const parsedUrl = url.parse(req.url, true);

    // Get the path.
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object.
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method.
    const method = req.method.toLowerCase();

    // Get the headers as an object.
    const { headers } = req;

    // Get the payload if any.
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // Choose the handler this request goes to.
        // If one is not found, use the notFound handler.
        const chosenHandler = typeof router[trimmedPath] !== 'undefined'
            ? router[trimmedPath]
            : handlers.notFound;

        // Construct the data object to send to the handler.
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer),
        };

        // route the request to the handler specified in the router.
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or default to 200.
            statusCode = typeof statusCode === 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to empty object.
            payload = typeof payload === 'object' ? payload : {};

            // Convert the payload to a string.
            const payloadString = JSON.stringify(payload);

            // Return the response.
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path.
            console.log('Returning this response: ', statusCode, payload);
        });
    });
};


// Instantiate the HTTP server.
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// Start the HTTP server, and have it listen on the environment port.
httpServer.listen(config.httpPort, () => {
    console.log(
        `The server is listening on port ${config.httpPort} in ${
            config.envName
        } mode`,
    );
});