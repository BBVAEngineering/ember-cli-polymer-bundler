# [1.0.0](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.3.3...v1.0.0) (2020-07-13)


### Bug Fixes

* **travis:** wrong syntax ([db58a1e](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/db58a1e3e825e159038873643ee1331c9748d442))


### Features

* rebuild bundle only on changes ([8420dd6](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/8420dd61964938c83615b48970bf67b766cdc8bf))


### BREAKING CHANGES

* web components are not looked for inside node_modules any more

chore(vscode): remove folder

feat: use caching-writer to prevent unneeded rebuilds
* web components are not looked for inside node_modules any more (assuming using Polymer & Bower)

style: change eslint settings and remove eslint file comments

refactor: rename property

test: remove skipped tests for not implemented functionality

test: increase coverage thresholds

docs(readme): document new property and changes

## [0.3.3](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.3.2...v0.3.3) (2020-04-22)


### Bug Fixes

* **package:** update polymer-project-builder ([d9664c3](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/d9664c3))

## [0.3.2](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.3.1...v0.3.2) (2019-03-28)


### Bug Fixes

* add test ([e91ee2d](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/e91ee2d))

## [0.3.1](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.3.0...v0.3.1) (2019-03-28)


### Bug Fixes

* remove incompatible polyfill ([86c3eaf](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/86c3eaf))

# [0.3.0](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.2.0...v0.3.0) (2019-03-21)


### Bug Fixes

* **bundler:** continue writing files if a key is undefined ([2f48bf5](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/2f48bf5))
* **index:** load polyfills before bundle ([7f68f5f](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/7f68f5f))
* **package:** use proper version of babel ([b1c5c93](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/b1c5c93))


### Features

* allow to build the bundle using polymer build ([492669c](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/492669c))
* **writer:** write all imports in a file ([d1de669](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/d1de669))
* add option to minify and transpile the bundle ([34f06a3](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/34f06a3))

# [0.2.0](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.1.0...v0.2.0) (2019-02-26)


### Features

* **config:** add an option to use "lazy-import" for the bundle ([22d7bb0](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/22d7bb0))

# [0.1.0](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.0.3...v0.1.0) (2019-02-06)


### Features

* **bundler:** allow to config autoprefixer options ([ba1a38a](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/ba1a38a))
* **bundler:** allows to apply autoprefixer to the output ([b510136](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/b510136))

## [0.0.3](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.0.2...v0.0.3) (2019-02-04)


### Bug Fixes

* **index:** write global Polymer settings before the bundle import ([926ee0f](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/926ee0f))

## [0.0.2](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/compare/v0.0.1...v0.0.2) (2019-01-21)


### Bug Fixes

* **version:** reset version to beta ([5cc8aa6](https://github.com/BBVAEngineering/ember-cli-polymer-bundler/commit/5cc8aa6))
