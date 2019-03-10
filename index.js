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

module.exports = {
	name: require('./package').name,

	isDevelopingAddon() {
		return true;
	},

	included(appOrAddon) {
		this._super.included.apply(this, arguments);

		// config
		const app = appOrAddon.app || appOrAddon;

		this._app = app;

		this.options = new Config(app, this.ui);
	},

	// insert polyfills and bundled elements
	contentFor(type, config) {
		if (type !== 'head') {
			return null;
		}

		const headContents = [];
		const optionalContents = this.getOptionalContents();
		const bundleImport = this.getBundleImport(config);

		headContents.push(optionalContents, bundleImport);

		return headContents.join('\n');
	},

	getOptionalContents() {
		const { babelify, polyfillBundle, globalPolymerSettings } = this.options;

		const output = [];
		const webcomponentsPolyfillsPath = path.join(this.project.bowerDirectory, 'webcomponentsjs');

		if (babelify.enabled) {
			const customElementsEs5Adapter = path.join(webcomponentsPolyfillsPath, 'custom-elements-es5-adapter.js');

			output.push(`<script src="${customElementsEs5Adapter}"></script>`);
		}

		if (polyfillBundle && polyfillBundle !== 'none') {
			const webcomponentsPolyfill = path.join(webcomponentsPolyfillsPath, `webcomponents-${polyfillBundle}.js`);

			output.push(`<script src="${webcomponentsPolyfill}"></script>`);
		}

		if (globalPolymerSettings) {
			output.push(`<script>window.Polymer = ${JSON.stringify(globalPolymerSettings)};</script>`);
		}

		return output.join('\n');
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
		const bowerPath = path.join(this.options.projectRoot,
			this.project.bowerDirectory);
		const bowerPackages = scrapeDeps(this.project.bowerDependencies(),
			bowerPath, 'bower.json');
		const npmPackages = scrapeDeps(this.project.dependencies(),
			path.resolve('node_modules'), 'package.json');
		const packages = bowerPackages.concat(npmPackages);
		const exclude = (pkg) => !this.options.excludeElements.includes(pkg.name);
		let elementPaths = packages.filter(exclude).map((pkg) => pkg.elementPath);

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
		const writer = new ElementWriter(elementPaths, filepath);
		const bundler = new ElementBundler(writer, {
			input: filepath,
			output: this.options.bundlerOutput,
			autoprefixer: this.options.autoprefixer,
			babelify: this.options.babelify
		}, this.options.bundlerOptions);

		// merge normal tree and our bundler tree
		return new MergeTrees([tree, bundler], {
			overwrite: true,
			annotation: 'Merge (ember-cli-polymer-bundler merge bundler with addon tree)'
		});
	}
};
