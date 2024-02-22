import * as fs from 'fs';
import * as ts from 'typescript';
import * as path from 'path';

export function refactorDirectory(directoryPath: string) {
  const files = getAllFiles(directoryPath);
  files.forEach(filePath => {
      if (filePath.endsWith('.ts')) {
          refactorFile(filePath);
      } else {
          console.log(`Skipping non-TypeScript file: ${filePath}`);
      }
  });

  console.log('Refactoring complete.');
}

function refactorFile(filePath: string) {
    try {
        let code = fs.readFileSync(filePath, 'utf-8');
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
        const formattedCode = formatCode(code);
        fs.writeFileSync(filePath, formattedCode, 'utf-8');
        console.log(`Refactored file: ${filePath}`);
    } catch (error) {
        console.error(`Error refactoring file ${filePath}: ${error}`);
    }
}

function removeUnusedVariables(code: string): string {
    // Regular expression to match variable declarations (const, let, var)
    const variableRegex = /(const|let|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*.*;/g;
    // Find all variable declarations
    let updatedVariable = code.replace(variableRegex, (match, declarationType, variableName) => {
        // Check if the variable is used
        if (!isVariableUsed(variableName, code)) {
            // Remove the entire line containing the variable declaration
            return '';
        } else {
            // Keep the variable declaration if used
            return match;
        }
    });

    // Regular expression to match variable declarations (public, protected, private)
    const accessModifierRegex = /(public|protected|private)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*(?::\s*\w+(?:\s*\|\s*\w+)?\s*)?(?:=\s*[^;]+)?\s*;/g;
    // Find all access modifier declarations
    let updatedVariableTs = updatedVariable.replace(accessModifierRegex, (match, declarationType, variableName) => {
        if (!isVariableUsed(variableName, code)) {
            // Remove the entire line containing the variable declaration
            return '';
        } else {
            // Keep the variable declaration if used
            return match;
        }
    });
    return updatedVariableTs;
}


function removeUnusedVariablesWithoutType(code: string): string {
    // Regular expression to match variable declarations without an explicit type
    const variableWithoutExplicitTypeRegex = /\b([a-zA-Z_$][0-9a-zA-Z_$]*)\s*(?::\s*\w+(?:\s*\|\s*\w+)?\s*)?(?:=\s*[^;]+)?;/g;
    // Find and handle variable declarations without an explicit type
    let updatedVWT = code.replace(variableWithoutExplicitTypeRegex, (match, variableName) => {
        // Check if the variable is used
        if (!isVariableUsed(variableName, code)) {
            // Remove the entire line containing the variable declaration
            return '';
        } else {
            // Keep the variable declaration if used
            return match;
        }
    });
    return updatedVWT;
}

function isVariableUsed(variableName: string, code: string): boolean {
    // Regular expression to find the usage of the variable within the code
    const variableUsageRegex = new RegExp(`\\b${variableName}\\b`, 'g');
    const matches = code.match(variableUsageRegex);
    return matches && matches.length > 1; // If the variable is used more than once, consider it as used
}
// Remove console.log() statements
function removeConsoleLogs(code: string): string {
    const lines = code.split('\n');
    const modifiedLines = lines.filter(line => !line.includes('console.log('));
    return modifiedLines.join('\n');
}

// Remove comments
function removeComments(code: string): string {
    let inComment = false;
    const lines = code.split('\n');
    const modifiedLines = [];

    for (let line of lines) {
        // Check for multi-line comment start
        if (line.includes('/*')) {
            const index = line.indexOf('/*');
            if (!inComment) {
                inComment = true;
                // Keep the part before the comment
                modifiedLines.push(line.substring(0, index));
            }
        }

        // Check for multi-line comment end
        if (inComment && line.includes('*/')) {
            const index = line.indexOf('*/') + 2; // Include the '*/' in the removed part
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
// Remove unused imports
function removeUnusedImports(code: string): string {
    // Regular expression to match import statements
    const importRegex = /import\s*{\s*([^}]*)\s*}\s*from\s*(['"][^'"]+['"]);?/g;

    // Find all import statements
    let updatedCode = code.replace(importRegex, (match, importClause, importPath) => {
        // Extract imported symbols
        const importedSymbols = importClause.split(',').map(symbol => symbol.trim());

        // Filter out the used symbols
        const usedSymbols = importedSymbols.filter(symbol => isSymbolUsed(symbol, code));

        // Rebuild the import statement with the used symbols only
        let updatedImportClause = '';
        if (usedSymbols.length > 0) {
            updatedImportClause = `{ ${usedSymbols.join(', ')} }`;
        }
        return updatedImportClause ? `import ${updatedImportClause} from ${importPath};` : '';
    });

    return updatedCode;
}

function isSymbolUsed(symbol: string, code: string): boolean {
    // Regular expression to find the usage of the symbol within the code
    const symbolUsageRegex = new RegExp(`\\b${symbol}\\b`, 'g');
    const matches = code.match(symbolUsageRegex);
    return matches && matches.length > 1; // If the symbol is used more than once, consider it as used
}
// Format code
function formatCode(code: string): string {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
    const printer = ts.createPrinter();

    return printer.printFile(sourceFile);
}

export { removeUnusedVariables,removeUnusedVariablesWithoutType, removeConsoleLogs, removeComments,removeUnusedImports, formatCode };


function getAllFiles(directoryPath: string): string[] {
    const files: string[] = [];

    function traverseDirectory(currentPath: string) {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                traverseDirectory(fullPath);
            } else if (stats.isFile() && fullPath.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
    }

    traverseDirectory(directoryPath);
    return files;
}
