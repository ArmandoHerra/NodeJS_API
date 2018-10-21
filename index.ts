/* Main API File. */

// Node.js Dependencies.

const http = require("http");
const url = require("url");

// The server should respond to all requests with a string.
const server = http.createServer((req, res) => {
    // Get the URL and perse it.
    var parsedURL = url.parse(req.url, true);
    // Get the path from the URL.
    var path = parsedURL.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, "");
    // Send the response.
    res.end("Hello World from Server!\n");
    // Log the request path.
    console.log("Request received on path: ", trimmedPath);
});

// Start the server, and have it listen on port 3000.
server.listen(3000, () => {
    console.log("The server is listening on port 3000 now!");
});
