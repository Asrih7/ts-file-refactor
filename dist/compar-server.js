"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
var http = require("http");
var fs = require("fs");
var path = require("path");
var PORT = 3000;
var server = http.createServer(function (req, res) {
    var _a;
    // Assume the URL format is '/compare/:folder'
    if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith('/compare/src')) {
        try {
            // Read the list of files from the 'src' directory
            var srcDir = path.join(process.cwd(), 'src');
            var refactoredFiles = fs.readdirSync(srcDir);
            // Send the list of files as a JSON response
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ refactoredFiles: refactoredFiles }));
        }
        catch (error) {
            // If there's an error reading the directory or files, send a 500 Internal Server Error response
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading files');
        }
    }
    else {
        // If the requested URL does not match the '/compare/src' format, send a 404 Not Found response
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});
function startServer() {
    // Start the server
    server.listen(PORT, function () {
        console.log("Server is running on port ".concat(PORT));
    });
}
exports.startServer = startServer;
