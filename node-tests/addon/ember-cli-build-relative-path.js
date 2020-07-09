'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const path = require('path');

module.exports = function(defaults) {
	const app = new EmberAddon(defaults, {
		'ember-cli-polymer-bundler': {
			htmlImportsFile: path.join('tests', 'dummy', 'app', 'elements.html'),
			elementPaths: [
				'tests/dummy/app/elements'
			],
			useRelativePath: true,
			bundlerOutput: '../any.html',
			autoprefixer: {
				browsers: ['chrome >= 30', 'firefox >= 32', 'ios >= 9', 'last 1 edge versions'],
				enabled: true,
				cascade: false
			}
		}
	});

	return app.toTree();
};
