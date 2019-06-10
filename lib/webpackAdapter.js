'use strict';

const webpack = require('webpack');

const _webpack = (config = {}, logger) => new Promise((resolve, reject) => {
	webpack(config, (error, stats) => {
		if (error) {
			reject(error);
		} else {
			const info = stats.toJson();

			if (stats.hasWarnings()) {
				const warnings = info.warnings.filter((warn) => !warn.match(/entrypoint size limit/));

				logger(warnings.toString());
			}
			if (stats.hasErrors()) {
				reject(info.errors);
			} else {
				resolve();
			}
		}
	});
});


module.exports = {
	webpack: _webpack,
	adaptedLibrary: 'webpack'
};
