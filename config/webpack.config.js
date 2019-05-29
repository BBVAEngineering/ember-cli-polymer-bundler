const path = require('path');
const decamelize = require('decamelize');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const OUTPUT_PATH = 'dist/scripts/lit';

const importMetaUriLoaderPath = require.resolve('@open-wc/webpack/loaders/import-meta-url-loader.js');
const importBabelLoaderPath = require.resolve('babel-loader');
const babelLoaderInNodeModules = importBabelLoaderPath.split('/babel-loader')[0];

module.exports = (dir) => ({
	entry: { litComponents: path.join(dir, './es6-imports.js') },
	mode: 'production',
	output: {
		path: path.join(dir, OUTPUT_PATH),
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
	optimization: {
		splitChunks: {
			chunks(chunk) {
				chunk.name = decamelize(chunk.name, '-');
				return true;
			},
			minSize: 20000,
			maxSize: 100000,
			minChunks: 1,
			maxAsyncRequests: 5,
			maxInitialRequests: 3,
			automaticNameDelimiter: '-',
			name: true,
			cacheGroups: {
				commons: {
					minChunks: 2,
					priority: -20,
					reuseExistingChunk: true
				}
			}
		}
	},
	resolve: {
		alias: {
			'@elements': path.resolve(path.join(dir, 'elements/'))
		}
	},
	resolveLoader: {
		modules: [babelLoaderInNodeModules, 'node_modules']

	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(dir, './lit-imports.html'),
			filename: path.join(dir, '/lit-imports.html'),
			cache: false
		})
	]
});
