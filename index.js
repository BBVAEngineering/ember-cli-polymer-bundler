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

		this.options = new Config(app, this.ui);

		// import webcomponentsjs polyfill library
		if (this.options.polyfillBundle && this.options.polyfillBundle !== 'none') {
			app.import(`${app.bowerDirectory}/webcomponentsjs/webcomponents-${this.options.polyfillBundle}.js`);
		}
	},

	// insert polymer and bundled elements
	contentFor(type, config) {
		if (type !== 'head') {
			return null;
		}

		const { bundlerOutput, useRelativePath, globalPolymerSettings, lazyImport } = this.options;

		const href = useRelativePath ? bundlerOutput : path.join(config.rootURL, bundlerOutput);
		const rel = lazyImport ? 'lazy-import' : 'import';
		const polymerSettings = globalPolymerSettings
			? `<script>window.Polymer = ${JSON.stringify(globalPolymerSettings)};</script>`
			: '';

		return `${polymerSettings}<link rel="${rel}" href="${href}">`;
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
			autoprefixer: this.options.autoprefixer
		}, this.options.bundlerOptions);

		// merge normal tree and our bundler tree
		return new MergeTrees([tree, bundler], {
			overwrite: true,
			annotation: 'Merge (ember-cli-polymer-bundler merge bundler with addon tree)'
		});
	}
};
