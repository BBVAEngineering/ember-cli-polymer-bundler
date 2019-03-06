/* eslint-env node */
'use strict';
const Plugin = require('broccoli-plugin');
const path = require('path');
const fs = require('fs-extra');
const { Bundler } = require('polymer-bundler');
const { Analyzer, FSUrlLoader } = require('polymer-analyzer');
const parse5 = require('parse5');
const HTMLPostCSS = require('html-postcss');
const autoprefixer = require('autoprefixer');
const htmlAutoprefixer = (config) => new HTMLPostCSS([autoprefixer(config)]);
const babel = require('@babel/core');
const crisper = require('crisper');
const minify = require('html-minifier').minify;

module.exports = class ElementBundler extends Plugin {
	constructor(inputNode, options = {}, bundlerOptions = {}) {
		super([inputNode], {
			name: 'Element Bundler',
			annotation: 'Bundles Polymer elements using polymer-bundler'
		});

		this.root = '/'; // use cwd by default
		Object.assign(this, options);
		this.output = this.output || this.input;

		if (!this.input) {
			throw new Error('[ember-cli-polymer-bundler] No input path found! 😵');
		}

		this.bundlerOptions = bundlerOptions;
		this.bundlerOptions.analyzer = bundlerOptions.analyzer || new Analyzer({
			urlLoader: new FSUrlLoader(path.resolve(this.root))
		});
	}

	build() {
		const bundler = new Bundler(this.bundlerOptions);
		const abspath = path.join(this.inputPaths[0], this.input);
		const entry = path.relative(this.root, abspath);

		// generateManifest takes urls relative to root
		return bundler.generateManifest([entry])
			.then((manifest) => bundler.bundle(manifest))
			.then((result) => parse5.serialize(result.documents.get(entry).ast))
			.then((contents) => this.processContents(contents))
			.then((processed) => this.writeFiles(processed))
			.catch((err) => {
				throw new Error(`ember-cli-polymer-bundler bundler.bundle() failure: ${err}`);
			});
	}

	processContents(input) {
		return this.processHTML(input)
			.then((result) => this.processStyles(result))
			.then((result) => this.processScripts(result));
	}

	processHTML(input) {
		if (!this.babelify.enabled) {
			return Promise.resolve({
				html: input
			});
		}

		const { html, js } = crisper({
			source: input,
			jsFileName: 'bundled.js',
			scriptInHead: false
		});

		const minified = minify(html, {
			minifyCSS: true,
			removeComments: true,
			collapseWhitespace: true
		});

		return Promise.resolve({
			html: minified,
			js
		});
	}

	processStyles({ html, js }) {
		if (!this.autoprefixer.enabled) {
			return Promise.resolve(...arguments);
		}

		const output = htmlAutoprefixer(this.autoprefixer).process(html);

		return Promise.resolve({
			html: output,
			js
		});
	}

	processScripts({ html, js }) {
		if (!this.babelify.enabled) {
			return Promise.resolve(...arguments);
		}

		const { code } = babel.transform(js, this.getBabelPressets());

		return Promise.resolve({
			html,
			js: code
		});
	}

	getBabelPressets() {
		const targets = this.babelify.browsers;

		return {
			comments: false,
			presets: [
				['@babel/preset-env', { targets }],
				'minify'
			]
		};
	}

	writeFiles(fileContents) {
		const types = Object.keys(fileContents);
		const [type] = types;
		const content = fileContents[type];

		if (!content) {
			return Promise.resolve();
		}

		const outputPath = path.join(this.outputPath, 'assets', `bundled.${type}`);

		if (types.length === 1) {
			return fs.outputFile(outputPath, content);
		}

		return fs.outputFile(outputPath, content).then(() => {
			const remaining = Object.assign({}, fileContents);

			delete remaining[type];

			return this.writeFiles(remaining);
		});
	}
};
