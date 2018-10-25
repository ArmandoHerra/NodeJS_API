const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;

interface LooseObject {
    [key: string]: any;
}

const server = http.createServer((req: LooseObject, res: LooseObject) => {
    const parsedURL = url.parse(req.url, true);
    const path = parsedURL.pathname;
    const trimmedPath: string = path.replace(/^\/+|\/+$/g, "");
    const queryStringObject: object = parsedURL.query;
    const method = req.method.toLowerCase();
    const headers = req.headers;
    const decoder = new StringDecoder("utf-8");
    let buffer = "";

    req.on("data", (data: object) => {
        buffer += decoder.write(data);
    });

    req.on("end", () => {
        buffer += decoder.end();
        const chosenHandler =
            typeof router[trimmedPath] !== undefined
                ? router[trimmedPath]
                : handlers.notFound;

        const data: object = {
            headers: headers,
            method: method,
            payload: buffer,
            queryStringObject: queryStringObject,
            trimmedPath: trimmedPath
        };

        chosenHandler(data, (statusCode: number, payload: object) => {
            statusCode = typeof statusCode === "number" ? statusCode : 200;
            payload = typeof payload === "object" ? payload : {};
            const payloadString = JSON.stringify(payload);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
});

server.listen(3000, () => {
    console.log("The server is listening on port 3000 now!");
});

const handlers: LooseObject = {};

handlers.sample = (data: object, callback: any): void => {
    callback(406, {
        name: "sample-handler"
    });
};

handlers.notFound = (data: object, callback: any) => {
    callback(404);
};

const router: LooseObject = {
    sample: handlers.sample
};
