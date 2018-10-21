/* Main File. */

// Node.js Dependencies.

const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;

// The server should respond to all requests with a string.
const server = http.createServer((req, res) => {
    // Get the URL and perse it.
    var parsedURL = url.parse(req.url, true);
    // Get the path from the URL.
    var path = parsedURL.pathname;
    var trimmedPath: string = path.replace(/^\/+|\/+$/g, "");
    // Get the query string as an object.
    var queryStringObject: object = parsedURL.query;
    // Get the HTTP method.
    var method = req.method.toLowerCase();
    // Get the headers as an object.
    var headers = req.headers;
    // Get the payload if there is any.
    var decoder = new StringDecoder("utf-8");
    var buffer = "";
    req.on("data", data => {
        buffer += decoder.write(data);
    });
    req.on("end", () => {
        buffer += decoder.end();
        // Send the response.
        res.end("Hello World from Server!\n");
        console.log("Request received with this payload: ", buffer);
    });
});

// Start the server, and have it listen on port 3000.
server.listen(3000, () => {
    console.log("The server is listening on port 3000 now!");
});
