/* eslint-disable no-sync */
'use strict';

const fs = require('fs-extra');
const readFile = fs.readFileSync;
const fileExists = fs.existsSync;
const path = require('path');
const parse5 = require('parse5');

const LIT_COMPONENTS_NAME = 'lit-imports.html';
const { webpack } = require('./webpackAdapter');

const createImports = (folder) => {
	const file = path.join(folder, LIT_COMPONENTS_NAME);

	return fs.createFile(file);
};


const getFolder = ({ filepath, litImportsFilename, importAlias }) => {
	if (!fileExists(filepath)) {
		return [];
	}

	const file = readFile(filepath, 'utf8');
	const dir = path.dirname(filepath);

	const fragment = parse5.parseFragment(file);
	const link = (node) => node.tagName === 'link';
	const href = (attr) => attr.name === 'href';
	const links = [];

	fragment.childNodes.filter(link).forEach((node) => {
		const relativePath = node.attrs.find(href).value;

		const importFolder = path.join(dir, path.dirname(relativePath));

		if (fileExists(path.join(importFolder, litImportsFilename))) {
			const alias = {};

			if (importAlias) {
				alias[importAlias.key] = path.resolve(path.join(importFolder, importAlias.folder));
			}
			const config = require('../config/webpack.config')({ importFolder, litImportsFilename, alias });

			createImports(importFolder)
				.then(() => webpack(config));
			links.push(path.join(importFolder, LIT_COMPONENTS_NAME));
		}
	});
	return links;
};

module.exports = getFolder;
