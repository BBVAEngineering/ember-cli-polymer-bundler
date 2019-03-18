/* eslint-env node */
'use strict';
const Plugin = require('broccoli-plugin');
const path = require('path');
const fs = require('fs-extra');

module.exports = class ElementWriter extends Plugin {
	constructor(elementPaths, filename, buildForProduction) {
		super([], {
			name: 'Element Writer',
			annotation: 'Writes html imports to a file, ready to be bundled',
			persistentOutput: true
		});
		this.elementPaths = elementPaths;
		this.filename = filename;
		this.buildForProduction = buildForProduction;
	}

	build() {
		const imports = this.elementPaths.map((elementPath) => {
			const href = path.relative(this.outputPath, elementPath);

			return `<link rel="import" href="${href}">`;
		}).join('\n');

		// Generates a file with all the imports in the app root
		// to be used by polymer-project-builder
		if (this.buildForProduction.enabled) {
			const allImports = this.elementPaths.map((elementPath) => {
				const href = path.relative(process.cwd(), elementPath);

				return `<link rel="import" href="${href}">`;
			}).join('\n');

			fs.outputFile(this.buildForProduction.allImportsFile, allImports);
		}

		return fs.outputFile(path.join(this.outputPath, this.filename), imports);
	}
};
