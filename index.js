/* eslint-disable no-unsanitized/method */
'use strict';

const path = require('path');
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const ElementBundler = require('./lib/bundler');
const ElementWriter = require('./lib/writer');
const Config = require('./lib/config');
const { scrapeDeps } = require('./lib/scraper');
const extractDeps = require('./lib/extractor');
const fs = require('fs-extra');

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
		if (type !== 'head') {
			return null;
		}

		const headContents = [];
		const { globalPolymerSettings } = this.options;

		if (globalPolymerSettings) {
			headContents.push(`<script>window.Polymer = ${JSON.stringify(globalPolymerSettings)};</script>`);
		}

		headContents.push(this.getBundleImport(config));

		return headContents.join('\n');
	},

	getBundleImport(config) {
		const { bundlerOutput, useRelativePath, lazyImport } = this.options;
		const href = useRelativePath ? bundlerOutput : path.join(config.rootURL, bundlerOutput);
		const rel = lazyImport ? 'lazy-import' : 'import';
		const htmlImport = `<link rel="${rel}" href="${href}">`;

		return htmlImport;
	},

	getImportPaths() {
		const bowerPath = path.join(this.options.projectRoot, this.project.bowerDirectory);
		const packages = scrapeDeps(this.project.bowerDependencies(), bowerPath, 'bower.json');
		const notExcluded = (pkg) => !this.options.excludeElements.includes(pkg.name);
		const importPaths = packages.filter(notExcluded).map((pkg) => pkg.elementPath);
		const manualImportPaths = extractDeps(this.options.htmlImportsFile);

		return importPaths.concat(manualImportPaths);
	},

	postprocessTree(type, tree) {
		if (type !== 'all') {
			return tree;
		}

		const importPaths = this.getImportPaths();
		const bowerPath = path.join(this.options.projectRoot, this.project.bowerDirectory);
		const elementsTree = new Funnel(new MergeTrees([bowerPath, ...this.options.elementPaths]));
		const filepath = path.basename(this.options.htmlImportsFile);
		const buildForProduction = Object.assign({}, this.options.buildForProduction, {
			allImportsFile: this.options.allImportsFile,
			tmpDestPath: this.options.tempPolymerBuildOutputPath
		});

		const writer = new ElementWriter(
			elementsTree,
			importPaths,
			filepath,
			buildForProduction
		);

		const bundler = new ElementBundler(writer, {
			input: filepath,
			output: this.options.bundlerOutput,
			autoprefixer: this.options.autoprefixer,
			buildForProduction
		}, this.options.bundlerOptions);

		return new MergeTrees([tree, bundler], {
			overwrite: true,
			annotation: 'Merge (ember-cli-polymer-bundler merge bundler with addon tree)'
		});
	},

	postBuild() {
		if (this.options.buildForProduction.enabled) {
			fs.removeSync(this.options.tempPolymerBuildOutputPath);
			fs.removeSync(this.options.allImportsFile);
		}
	}
};
