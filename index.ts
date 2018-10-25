/* Main File. */

const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;

const server = http.createServer((req: any, res: any) => {
    var parsedURL = url.parse(req.url, true);
    var path = parsedURL.pathname;
    var trimmedPath: string = path.replace(/^\/+|\/+$/g, "");
    var queryStringObject: object = parsedURL.query;
    var method = req.method.toLowerCase();
    var headers = req.headers;
    var decoder = new StringDecoder("utf-8");
    var buffer = "";
    
    req.on("data", data => {
        buffer += decoder.write(data);
    });

    req.on("end", () => {
        buffer += decoder.end();
        var chosenHandler =
            typeof router[trimmedPath] !== undefined
                ? router[trimmedPath]
                : handlers.notFound;

        var data: any = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: buffer
        };

        chosenHandler(data, (statusCode: number, payload: object) => {
            statusCode = typeof statusCode == "number" ? statusCode : 200;
            payload = typeof payload == "object" ? payload : {};
            var payloadString = JSON.stringify(payload);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log("Returning this response: ", statusCode, payloadString);
        });
    });
});

server.listen(3000, () => {
    console.log("The server is listening on port 3000 now!");
});

var handlers: any = {};

handlers.sample = (data: object, callback: any) => {
    callback(406, {
        name: "sample-handler"
    });
};

handlers.notFound = (data: object, callback: any) => {
    callback(404);
};

var router = {
    sample: handlers.sample
};
