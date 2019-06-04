const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const importMetaUriLoaderPath = require.resolve('@open-wc/webpack/loaders/import-meta-url-loader.js');
const importBabelLoaderPath = require.resolve('babel-loader');
const babelLoaderInNodeModules = importBabelLoaderPath.split('/babel-loader')[0];

module.exports = ({ importFolder, litOutputFolder, litOutputFile, litImportsFilename, alias }) => ({
	entry: { litComponents: path.join(importFolder, litImportsFilename) },
	mode: 'production',
	output: {
		path: litOutputFolder
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
			template: path.join(litOutputFolder, litOutputFile),
			filename: path.join(litOutputFolder, litOutputFile),
			cache: false
		})
	]
});
