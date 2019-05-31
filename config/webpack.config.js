const path = require('path');
const decamelize = require('decamelize');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const OUTPUT_PATH = 'dist/scripts/lit';

const importMetaUriLoaderPath = require.resolve('@open-wc/webpack/loaders/import-meta-url-loader.js');
const importBabelLoaderPath = require.resolve('babel-loader');
const babelLoaderInNodeModules = importBabelLoaderPath.split('/babel-loader')[0];

module.exports = ({ importFolder, litImportsFilename, alias }) => ({
	entry: { litComponents: path.join(importFolder, litImportsFilename) },
	mode: 'production',
	output: {
		path: path.join(importFolder, OUTPUT_PATH),
		publicPath: OUTPUT_PATH
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules\/(?!(@webcomponents\/shadycss|lit-css|styled-lit-element|lit-html|@polymer|@vaadin|@lit)\/).*/,
				options: {
					cacheDirectory: true
				}
			},
			{
				test: /\.js$/,
				loader: importMetaUriLoaderPath
			}
		]
	},
	resolve: {
		alias
	},
	resolveLoader: {
		modules: [babelLoaderInNodeModules, 'node_modules']

	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(importFolder, './lit-imports.html'),
			filename: path.join(importFolder, '/lit-imports.html'),
			cache: false
		})
	]
});
