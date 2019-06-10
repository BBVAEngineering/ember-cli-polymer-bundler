/* eslint-env node */
'use strict';

const assert = require('assert');
const getModules = require('../../../lib/modulesExtractor');
const webpackAdapter = require('../../../lib/webpackAdapter');

describe('modulesExtractor', () => {
	it('returns empty string when file does not exist', () => {
		assert.deepStrictEqual(getModules({ filepath: 'test-file.html' }), []);
	});
});

describe('webpackAdapter', () => {
	it('throws warnings when config is null', (done) => {
		webpackAdapter.webpack(undefined, () => {})
			.then((msg) => {done(); assert.ok(msg);})
			.catch((msg) => {done(); assert.ok(msg);});
	});
});
