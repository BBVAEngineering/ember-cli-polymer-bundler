import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Polymer | Shadow DOM', (hooks) => {
	setupRenderingTest(hooks);

	test('Uses native Shadow DOM if available', async(assert) => {
		if (!window.Polymer.Settings.nativeShadow) {
			assert.expect(0);

			return;
		}

		assert.expect(2);

		await render(hbs`<paper-button></paper-button>`);

		assert.ok(document.querySelector('paper-button').shadowRoot,
			'paper-button has shadowRoot');
		assert.equal(document.querySelector('paper-button').getAttribute('role'), 'button',
			'role is attached to button immediately');
	});
});
