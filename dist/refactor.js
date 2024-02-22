"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCode = exports.removeUnusedImports = exports.removeComments = exports.removeConsoleLogs = exports.removeUnusedVariablesWithoutType = exports.removeUnusedVariables = exports.refactorDirectory = void 0;
var fs = require("fs");
var ts = require("typescript");
var path = require("path");
function refactorDirectory(directoryPath) {
    var files = getAllFiles(directoryPath);
    files.forEach(function (filePath) {
        if (filePath.endsWith('.ts')) {
            refactorFile(filePath);
        }
        else {
            console.log("Skipping non-TypeScript file: ".concat(filePath));
        }
    });
    console.log('Refactoring complete.');
}
exports.refactorDirectory = refactorDirectory;
function refactorFile(filePath) {
    try {
        var code = fs.readFileSync(filePath, 'utf-8');
        // Remove unused variables with types
        code = removeUnusedVariables(code);
        // Remove unused variables without types
        code = removeUnusedVariablesWithoutType(code);
        // Remove console logs
        code = removeConsoleLogs(code);
        // Remove comments
        code = removeComments(code);
        // Remove unused imports
        code = removeUnusedImports(code);
        // Format code
        var formattedCode = formatCode(code);
        fs.writeFileSync(filePath, formattedCode, 'utf-8');
        console.log("Refactored file: ".concat(filePath));
    }
    catch (error) {
        console.error("Error refactoring file ".concat(filePath, ": ").concat(error));
    }
}
function removeUnusedVariables(code) {
    // Regular expression to match variable declarations (const, let, var)
    var variableRegex = /(const|let|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*.*;/g;
    // Find all variable declarations
    var updatedVariable = code.replace(variableRegex, function (match, declarationType, variableName) {
        // Check if the variable is used
        if (!isVariableUsed(variableName, code)) {
            // Remove the entire line containing the variable declaration
            return '';
        }
        else {
            // Keep the variable declaration if used
            return match;
        }
    });
    // Regular expression to match variable declarations (public, protected, private)
    var accessModifierRegex = /(public|protected|private)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*(?::\s*\w+(?:\s*\|\s*\w+)?\s*)?(?:=\s*[^;]+)?\s*;/g;
    // Find all access modifier declarations
    var updatedVariableTs = updatedVariable.replace(accessModifierRegex, function (match, declarationType, variableName) {
        if (!isVariableUsed(variableName, code)) {
            // Remove the entire line containing the variable declaration
            return '';
        }
        else {
            // Keep the variable declaration if used
            return match;
        }
    });
    return updatedVariableTs;
}
exports.removeUnusedVariables = removeUnusedVariables;
function removeUnusedVariablesWithoutType(code) {
    // Regular expression to match variable declarations without an explicit type
    var variableWithoutExplicitTypeRegex = /\b([a-zA-Z_$][0-9a-zA-Z_$]*)\s*(?::\s*\w+(?:\s*\|\s*\w+)?\s*)?(?:=\s*[^;]+)?;/g;
    // Find and handle variable declarations without an explicit type
    var updatedVWT = code.replace(variableWithoutExplicitTypeRegex, function (match, variableName) {
        // Check if the variable is used
        if (!isVariableUsed(variableName, code)) {
            // Remove the entire line containing the variable declaration
            return '';
        }
        else {
            // Keep the variable declaration if used
            return match;
        }
    });
    return updatedVWT;
}
exports.removeUnusedVariablesWithoutType = removeUnusedVariablesWithoutType;
function isVariableUsed(variableName, code) {
    // Regular expression to find the usage of the variable within the code
    var variableUsageRegex = new RegExp("\\b".concat(variableName, "\\b"), 'g');
    var matches = code.match(variableUsageRegex);
    return matches && matches.length > 1; // If the variable is used more than once, consider it as used
}
// Remove console.log() statements
function removeConsoleLogs(code) {
    var lines = code.split('\n');
    var modifiedLines = lines.filter(function (line) { return !line.includes('console.log('); });
    return modifiedLines.join('\n');
}
exports.removeConsoleLogs = removeConsoleLogs;
// Remove comments
function removeComments(code) {
    var inComment = false;
    var lines = code.split('\n');
    var modifiedLines = [];
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        // Check for multi-line comment start
        if (line.includes('/*')) {
            var index = line.indexOf('/*');
            if (!inComment) {
                inComment = true;
                // Keep the part before the comment
                modifiedLines.push(line.substring(0, index));
            }
        }
        // Check for multi-line comment end
        if (inComment && line.includes('*/')) {
            var index = line.indexOf('*/') + 2; // Include the '*/' in the removed part
            inComment = false;
            // Keep the part after the comment
            line = line.substring(index);
        }
        if (!inComment) {
            // Remove single-line comments
            line = line.replace(/\/\/.*/, '');
            modifiedLines.push(line);
        }
    }
    return modifiedLines.join('\n');
}
exports.removeComments = removeComments;
// Remove unused imports
function removeUnusedImports(code) {
    // Regular expression to match import statements
    var importRegex = /import\s*{\s*([^}]*)\s*}\s*from\s*(['"][^'"]+['"]);?/g;
    // Find all import statements
    var updatedCode = code.replace(importRegex, function (match, importClause, importPath) {
        // Extract imported symbols
        var importedSymbols = importClause.split(',').map(function (symbol) { return symbol.trim(); });
        // Filter out the used symbols
        var usedSymbols = importedSymbols.filter(function (symbol) { return isSymbolUsed(symbol, code); });
        // Rebuild the import statement with the used symbols only
        var updatedImportClause = '';
        if (usedSymbols.length > 0) {
            updatedImportClause = "{ ".concat(usedSymbols.join(', '), " }");
        }
        return updatedImportClause ? "import ".concat(updatedImportClause, " from ").concat(importPath, ";") : '';
    });
    return updatedCode;
}
exports.removeUnusedImports = removeUnusedImports;
function isSymbolUsed(symbol, code) {
    // Regular expression to find the usage of the symbol within the code
    var symbolUsageRegex = new RegExp("\\b".concat(symbol, "\\b"), 'g');
    var matches = code.match(symbolUsageRegex);
    return matches && matches.length > 1; // If the symbol is used more than once, consider it as used
}
// Format code
function formatCode(code) {
    var sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
    var printer = ts.createPrinter();
    return printer.printFile(sourceFile);
}
exports.formatCode = formatCode;
function getAllFiles(directoryPath) {
    var files = [];
    function traverseDirectory(currentPath) {
        var items = fs.readdirSync(currentPath);
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var fullPath = path.join(currentPath, item);
            var stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                traverseDirectory(fullPath);
            }
            else if (stats.isFile() && fullPath.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
    }
    traverseDirectory(directoryPath);
    return files;
}
