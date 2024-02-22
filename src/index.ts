#!/usr/bin/env node

import * as minimist from 'minimist';
import { refactorDirectory } from './refactor';
import * as path from 'path';

function main() {
    const args = minimist(process.argv.slice(2));
    const directoryPath = args._[0] || '.'; // Default to current directory if no directory path is provided

    refactorDirectory(path.resolve(directoryPath));
}

main();
