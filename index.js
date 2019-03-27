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

module.exports = {
	name: require('./package').name,

	isDevelopingAddon() {
		return true;
	},

	included(appOrAddon) {
		this._super.included.apply(this, arguments);
		this._app = appOrAddon.app || appOrAddon;
		this.options = new Config(this._app, this.ui);
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

		headContents.push(
			this.getPolyfills(),
			this.getBundleImport(config)
		);

		return headContents.join('\n');
	},

	getPolyfills() {
		const { polyfillBundle, buildForProduction } = this.options;
		const webcomponentsPolyfillsPath = path.join('assets', this._app.bowerDirectory, 'webcomponentsjs');
		const result = [];

		if (polyfillBundle && polyfillBundle !== 'none') {
			const webcomponentsPolyfill = path.join(webcomponentsPolyfillsPath, `webcomponents-${polyfillBundle}.js`);

			result.push(`<script src="${webcomponentsPolyfill}"></script>`);
		}

		/**
		 * Include custom-elements-es5-adapter only for browsers that natively support customElements
		 * https://github.com/webcomponents/webcomponentsjs/issues/749#issuecomment-319174318
		 */
		if (buildForProduction.enabled && buildForProduction.build.js.compile) {
			result.push(`
			<script>if (!window.customElements) { document.write('<!--'); }</script>
			<script type="text/javascript" src="${webcomponentsPolyfillsPath}/custom-elements-es5-adapter.js"></script>
			<!--! do not remove -->
			`);
		}

		return result.join('\n');
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
			fs.removeSync(this.options.tempPolymerBuildOutputPath);
			fs.removeSync(this.options.allImportsFile);
		}
	}
};
