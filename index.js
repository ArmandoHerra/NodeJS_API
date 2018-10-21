/* Main File. */
// Node.js Dependencies.
var http = require("http");
var url = require("url");
// The server should respond to all requests with a string.
var server = http.createServer(function (req, res) {
    // Get the URL and perse it.
    var parsedURL = url.parse(req.url, true);
    // Get the path from the URL.
    var path = parsedURL.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, "");
    // Get the HTTP method.
    var method = req.method.toLowerCase();
    // Send the response.
    res.end("Hello World from Server!\n");
    // Log the request path.
    console.log("Request received on path: ", trimmedPath);
    console.log("With HTTP method: ", method);
});
// Start the server, and have it listen on port 3000.
server.listen(3000, function () {
    console.log("The server is listening on port 3000 now!");
});
