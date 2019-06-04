/* eslint-env node */
'use strict';
const path = require('path');
// broccoli plugins
const MergeTrees = require('broccoli-merge-trees');
const ElementBundler = require('./lib/bundler');
const ElementWriter = require('./lib/writer');
// internals
const Config = require('./lib/config');
const { scrapeDeps } = require('./lib/scraper');
const extractDeps = require('./lib/extractor');
const fs = require('fs-extra');
const extractModules = require('./lib/modulesExtractor');
const LIT_COMPONENTS_NAME = 'lit-imports.html';

module.exports = {
	name: require('./package').name,

	isDevelopingAddon() {
		return true;
	},

	included(appOrAddon) {
		this._super.included.apply(this, arguments);
		this._app = appOrAddon.app || appOrAddon;
		this.options = new Config(this._app, this.ui);

		this.importPolyfills();
	},

	importPolyfills() {
		const { polyfillBundle } = this.options;

		const webcomponentsjsPath = path.join(this._app.bowerDirectory, 'webcomponentsjs');
		const webcomponentsjsPolyfill = path.join(webcomponentsjsPath, `webcomponents-${polyfillBundle}.js`);
		const customElementsEs5Adapter = path.join(__dirname, 'polyfills/native-shim.js');

		this._app.import(customElementsEs5Adapter, { options: 'prepend' });
		this._app.import(webcomponentsjsPolyfill, { options: 'prepend' });
	},

	// insert polyfills and bundled elements
	contentFor(type, config) {
		if (type === 'head') {
			const { globalPolymerSettings } = this.options;

			if (globalPolymerSettings) {
				return `<script>window.Polymer = ${JSON.stringify(globalPolymerSettings)};</script>`;
			}
		} else if (type === 'body-footer') {
			return this.getBundleImport(config);
		}

		return null;
	},

	getBundleImport(config) {
		const { bundlerOutput, useRelativePath, lazyImport } = this.options;
		const href = useRelativePath ? bundlerOutput : path.join(config.rootURL, bundlerOutput);
		const rel = lazyImport ? 'lazy-import' : 'import';
		const htmlImport = `<link rel="${rel}" href="${href}">`;

		return htmlImport;
	},

	postprocessTree(type, tree) {
		if (type !== 'all') {
			return tree;
		}

		// auto element import
		const bowerPath = path.join(this.options.projectRoot, this.project.bowerDirectory);
		const bowerPackages = scrapeDeps(this.project.bowerDependencies(), bowerPath, 'bower.json');
		const npmPackages = scrapeDeps(this.project.dependencies(), path.resolve('node_modules'), 'package.json');
		const packages = bowerPackages.concat(npmPackages);
		const exclude = (pkg) => !this.options.excludeElements.includes(pkg.name);
		let elementPaths = packages.filter(exclude).map((pkg) => pkg.elementPath);

		// ES6 imports
		elementPaths = elementPaths.concat(extractModules({
			filepath: this.options.htmlImportsFile,
			litImportsFilename: this.options.litImportsFilename,
			litOutputFile: LIT_COMPONENTS_NAME,
			importAlias: {
				key: `@${this.options.importAlias.key}`,
				folder: this.options.importAlias.folder
			},
			outputFolder: this.options.tempPolymerBuildOutputPath
		}));

		// manual element import
		const manualPackagePaths = extractDeps(this.options.htmlImportsFile);

		elementPaths = elementPaths.concat(manualPackagePaths);

		// check for duplicates
		elementPaths.filter((ep, i, eps) => eps.includes(ep, i + 1)).forEach((ep) => {
			const relativePath = path.relative(this.options.projectRoot, ep);

			this.ui.writeInfoLine(`The html import \`${relativePath}\` was already ` +
                            'automatically imported ✨  You can remove this ' +
                            'import. (ember-cli-polymer-bundler)');
		});

		// write and bundle
		const filepath = path.basename(this.options.htmlImportsFile);

		const buildForProduction = Object.assign({}, this.options.buildForProduction, {
			allImportsFile: this.options.allImportsFile,
			tmpDestPath: this.options.tempPolymerBuildOutputPath
		});

		const writer = new ElementWriter(
			elementPaths,
			filepath,
			buildForProduction
		);

		const bundler = new ElementBundler(writer, {
			input: filepath,
			output: this.options.bundlerOutput,
			autoprefixer: this.options.autoprefixer,
			buildForProduction
		}, this.options.bundlerOptions);

		// merge normal tree and our bundler tree
		return new MergeTrees([tree, bundler], {
			overwrite: true,
			annotation: 'Merge (ember-cli-polymer-bundler merge bundler with addon tree)'
		});
	},

	postBuild() {
		if (this.options.buildForProduction.enabled) {
			fs.removeSync(this.options.allImportsFile);
		}
		fs.removeSync(this.options.tempPolymerBuildOutputPath);
	}
};
