'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const path = require('path');

module.exports = function(defaults) {
	const app = new EmberAddon(defaults, {
		'ember-cli-polymer-bundler': {
			htmlImportsFile: path.join('tests', 'dummy', 'app', 'elements.html'),
			elementPaths: [
				'tests/dummy/app/elements'
			]
		}
	});

	return app.toTree();
};
