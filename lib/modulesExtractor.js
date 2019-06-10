/* eslint-disable no-sync */
'use strict';

const fs = require('fs-extra');
const readFile = fs.readFileSync;
const fileExists = fs.existsSync;
const path = require('path');
const parse5 = require('parse5');

const getModules = ({ filepath, litImportsFilename, litOutputFile, importAlias }) => {
	if (!fileExists(filepath)) {
		return [];
	}

	const file = readFile(filepath, 'utf8');
	const dir = path.dirname(filepath);

	const fragment = parse5.parseFragment(file);
	const link = (node) => node.tagName === 'link';
	const href = (attr) => attr.name === 'href';
	const config = {
		entries: {},
		alias: {}
	};


	fragment.childNodes.filter(link).forEach((node) => {
		const relativePath = node.attrs.find(href).value;

		const importFolder = path.join(dir, path.dirname(relativePath));
		const importFile = path.join(importFolder, litImportsFilename);

		if (fileExists(importFile)) {
			// const litOutputFolder = path.resolve(path.join(emberOutputFolder, 'lit', path.dirname(relativePath.replace(/(\.\.\/)*/, ''))));
			const litOutputFolder = path.basename(path.dirname(importFile));

			if (importAlias) {
				config.alias[importAlias.namespace] = path.resolve(path.join(importFolder, importAlias.folder));
			}
			config.entries[litOutputFolder] = importFile;
		}
	});
	if (Object.keys(config.entries).length) {
		config.link = path.resolve(path.join('tmp-lit', litOutputFile));
	}
	return config;
};

module.exports = getModules;
