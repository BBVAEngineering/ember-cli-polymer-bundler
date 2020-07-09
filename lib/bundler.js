'use strict';

const CachingWriter = require('broccoli-caching-writer');
const path = require('path');
const fs = require('fs-extra');
const { Bundler } = require('polymer-bundler');
const { Analyzer, FSUrlLoader } = require('polymer-analyzer');
const parse5 = require('parse5');
const HTMLPostCSS = require('html-postcss');
const autoprefixer = require('autoprefixer');
const htmlAutoprefixer = (config) => new HTMLPostCSS([autoprefixer(config)]);
const PolymerProjectBuilder = require('@wctools/polymer-project-builder');

module.exports = class ElementBundler extends CachingWriter {
	constructor(inputNode, options, bundlerOptions) {
		super([inputNode], {
			name: 'Element Bundler',
			annotation: 'Bundles Polymer elements using polymer-bundler'
		});

		this.root = '/'; // use cwd by default
		this.options = options;
		this.output = this.options.output;

		if (!this.options.input) {
			throw new Error('[ember-cli-polymer-bundler] No input path found! 😵');
		}

		this.bundlerOptions = bundlerOptions;
		this.bundlerOptions.analyzer = bundlerOptions.analyzer || new Analyzer({
			urlLoader: new FSUrlLoader(path.resolve(this.root))
		});
	}

	build() {
		const buildForProduction = this.options.buildForProduction;

		if (buildForProduction.enabled) {
			const settings = this.getPolymerBuildSettings();
			const builder = new PolymerProjectBuilder(settings);

			return builder.build()
				.then(() => fs.copySync(buildForProduction.tmpDestPath, this.outputPath));
		}

		const bundler = new Bundler(this.bundlerOptions);
		const abspath = path.join(this.inputPaths[0], this.options.input);
		const entry = path.relative(this.root, abspath);
		const outpath = path.join(this.outputPath, this.options.output);

		// generateManifest takes urls relative to root
		return bundler.generateManifest([entry])
			.then((manifest) => bundler.bundle(manifest)).then((result) => {
				const html = parse5.serialize(result.documents.get(entry).ast);
				const content = this.processString(html);

				return fs.outputFile(outpath, content);
			}).catch((err) => {
				throw new Error(`ember-cli-polymer-bundler bundler.bundle() failure: ${err}`);
			});
	}

	getPolymerBuildSettings() {
		const buildForProduction = this.options.buildForProduction;
		const entrypoint = path.basename(buildForProduction.allImportsFile);
		const bundleFileName = path.basename(this.options.output);

		const defaultOptions = {
			entrypoint,
			bundleFileName,
			moduleResolution: 'none',
			dest: `${buildForProduction.tmpDestPath}/assets`,
			build: Object.assign({}, buildForProduction.build),
			lint: {
				rules: ['polymer-2'],
				ignoreWarnings: ['could-not-resolve-reference']
			}
		};

		if (this.options.autoprefixer.enabled) {
			defaultOptions.build.css = Object.assign({}, buildForProduction.build.css, {
				autoprefixer: this.options.autoprefixer
			});
		}

		return Object.assign({}, buildForProduction, defaultOptions);
	}

	processString(input) {
		if (this.options.autoprefixer.enabled) {
			return htmlAutoprefixer(this.options.autoprefixer).process(input);
		}

		return input;
	}
};
