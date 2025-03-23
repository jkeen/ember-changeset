import { fillIn, find, render, settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { module, test } from 'qunit';
import { Changeset } from 'ember-changeset';

module('Integration | Helper | changeset-get', function (hooks) {
  setupRenderingTest(hooks);

  let model;

  hooks.beforeEach(function () {
    model = {
      name: {
        first: 'Bob',
        last: 'Loblaw',
      },
      email: 'bob@lob.law',
      url: 'http://bobloblawslawblog.com',
    };

    this.changeset = Changeset(model);
    this.fieldName = 'name.first';
  });

  test('it retrieves the current value using {{get}}', async function (assert) {
    this.updateName = (changeset, evt) => {
      changeset.set('name.first', evt.target.value);
    };
    await render(hbs`
      <label for="text-input">First name</label>
      <input
        id="text-input"
        type="text"
        {{on "input" (fn this.updateName this.changeset)}}
        {{on "change" (fn this.updateName this.changeset)}}
        value={{get this.changeset this.fieldName}}/>
      <p id="test-el">{{this.changeset.name.first}}</p>
      <ul>
        {{#each this.changeset.changes as |change|}}
          <li>{{change.key}}: {{change.value}}</li>
        {{/each}}
      </ul>
    `);

    await fillIn(find('input'), 'Robert');

    assert.dom('#test-el').hasText('Robert');
    assert.dom('input').hasValue('Robert');

    await this.changeset.rollback();

    assert.dom('#test-el').hasText('Robert');
    assert.dom('input').hasValue('Robert');
  });

  test('it succeeds in retrieving the current value using {{get}}', async function (assert) {
    this.updateName = (changeset, evt) => {
      changeset.set('name.first', evt.target.value);
    };
    await render(hbs`
      <label for="text-input">First name</label>
      <input
        id="text-input"
        type="text"
        {{on "input" (fn this.updateName this.changeset)}}
        {{on "change" (fn this.updateName this.changeset)}}
        value={{get this.changeset this.fieldName}} />
      <p id="test-el">{{get this.changeset this.fieldName}}</p>
      <ul>
        {{#each (get this.changeset "changes") as |change index|}}
          <li id="change-{{index}}">{{change.key}}: {{change.value}}</li>
        {{/each}}
      </ul>
    `);

    const input = find('input');
    const testEl = find('#test-el');

    await fillIn(input, 'Robert');

    assert.dom(testEl).hasText('Robert');
    let list = find('#change-0');
    assert.dom(list).hasText('name.first: Robert');
    assert.strictEqual(input.value, 'Robert');

    this.changeset.rollback();

    await settled();
    assert.dom(testEl).hasText('Bob');
    list = find('#change-0');
    assert.notOk(list, 'no changes');
    assert.strictEqual(input.value, 'Bob');
  });
});

module('Integration | Helper | changeset-get relationships', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.store = this.owner.lookup('service:store');

    this.createUser = (userType, withDogs) => {
      let profile = this.store.createRecord('profile');
      let user = this.store.createRecord(userType, { profile });

      if (withDogs) {
        for (let i = 0; i < 2; i++) {
          user.get('dogs').addObject(this.store.createRecord('dog'));
        }
      }
      return user;
    };

    this.createUserWithNullBelongsTo = (userType) => {
      let user = this.store.createRecord(userType, { profile: null });
      return user;
    };
  });

  test('it renders belongsTo property', async function (assert) {
    let user = this.createUser('user', false);
    this.changeset = Changeset(user);

    await render(hbs`
      <p id="test-el">{{changeset-get this.changeset "profile.firstName"}}</p>
    `);

    assert.dom('#test-el').hasText('Bob');
  });

  test('it does not fail with a null belongsTo property', async function (assert) {
    let user = this.createUserWithNullBelongsTo('user');
    this.changeset = Changeset(user);

    await render(hbs`
      <p id="test-el">{{changeset-get this.changeset "profile.firstName"}}</p>
    `);

    assert.dom('#test-el').hasText('');
  });
});
