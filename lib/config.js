'use strict';

const path = require('path');
const extend = require('deep-extend');

module.exports = class Config {
	constructor(app, ui) {
		this.ui = ui;

		// defaults
		this.autoElementImport = true;
		this.excludeElements = [];
		this.elementPaths = [];
		this.htmlImportsFile = path.join('app', 'elements.html');
		this.bundlerOutput = path.join('assets', 'bundled.html');
		this.bundlerOptions = {
			stripComments: true
		};
		this.polyfillBundle = 'lite';
		this.autoprefixer = {
			browsers: app.project.targets && app.project.targets.browsers,
			enabled: false
		};
		this.lazyImport = false;

		// polymer build options
		this.tempPolymerBuildOutputPath = 'tmp-polymer';
		this.allImportsFile = path.join(process.cwd(), 'all-imports.html');
		this.buildForProduction = {
			enabled: false,
			build: {
				csp: true,
				js: {
					minify: true,
					compile: true
				},
				css: {
					minify: true
				},
				html: {
					minify: true
				}
			}
		};

		// retrieve and apply addon options
		const addonOptions = app.options['ember-cli-polymer-bundler'] || {};

		extend(this, addonOptions);

		this.projectRoot = app.project.root;

		// convert relative path to absolute path
		this.htmlImportsFile = path.join(this.projectRoot, this.htmlImportsFile);
	}

	set bundlerOutput(bundlerOutput) {
		if (path.extname(bundlerOutput) === '.html') {
			this._bundlerOutput = bundlerOutput;
		} else {
			throw new Error('[ember-cli-polymer-bundler] The `bundlerOutput` file ' +
      `is not a .html file. You specified '${bundlerOutput}'`);
		}
	}

	get bundlerOutput() {
		return this._bundlerOutput;
	}
};
