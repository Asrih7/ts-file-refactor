#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var minimist = require("minimist");
var refactor_1 = require("./refactor");
var path = require("path");
function main() {
    var args = minimist(process.argv.slice(2));
    var directoryPath = args._[0] || '.'; // Default to current directory if no directory path is provided
    (0, refactor_1.refactorDirectory)(path.resolve(directoryPath));
}
main();
