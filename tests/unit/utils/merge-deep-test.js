import mergeDeep from 'ember-changeset/utils/merge-deep';
import { Change } from 'validated-changeset';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { get, set } from '@ember/object';

module('Unit | Utility | merge deep', (hooks) => {
  setupTest(hooks);

  test('it returns merged objects', async function (assert) {
    let objA = { other: 'Ivan' };
    let objB = { foo: new Change('bar'), zoo: 'doo' };
    let value = mergeDeep(objA, objB);

    assert.deepEqual(
      value,
      { other: 'Ivan', foo: 'bar', zoo: 'doo' },
      'merges both values',
    );
  });

  test('works with arrays', function (assert) {
    const objA = { employees: ['Ivan', 'Jan'] };
    const objB = {
      employees: { 0: new Change('Jull'), 1: new Change('Olafur') },
    };
    const value = mergeDeep(objA, objB);

    assert.deepEqual(value, { employees: ['Jull', 'Olafur'] });
  });

  test('it unsets', async function (assert) {
    let objA = { other: 'Ivan' };
    let objB = { other: new Change(null) };
    let value = mergeDeep(objA, objB);

    assert.deepEqual(value, { other: null }, 'unsets value');
  });

  test('it works with Ember.get and Ember.set', async function (assert) {
    let objA = { other: 'Ivan' };
    let objB = { other: new Change(null) };
    let value = mergeDeep(objA, objB, { safeGet: get, safeSet: set });

    assert.deepEqual(value, { other: null }, 'unsets value');
  });

  test('it works with deeper nested objects', async function (assert) {
    let objA = { company: { employees: ['Ivan', 'Jan'] } };
    let objB = { company: { employees: new Change(['Jull', 'Olafur']) } };
    let value = mergeDeep(objA, objB);

    assert.deepEqual(
      value,
      { company: { employees: ['Jull', 'Olafur'] } },
      'has right employees',
    );
  });

  test('it works with source null', async function (assert) {
    let objA = { company: { employees: null } };
    let objB = { company: { employees: new Change(['Jull', 'Olafur']) } };
    let value = mergeDeep(objA, objB);

    assert.deepEqual(
      value,
      { company: { employees: ['Jull', 'Olafur'] } },
      'has right employees',
    );

    objB = { company: { employees: null } };
    value = mergeDeep(objA, objB);

    assert.deepEqual(
      value,
      { company: { employees: null } },
      'has right employees',
    );
  });

  test('it works with unsafe properties', async function (assert) {
    class A {
      _boo = 'bo';

      get boo() {
        return this._boo;
      }
      set boo(value) {
        this._boo = value;
      }

      foo = { baz: 'ba' };
    }

    class B extends A {
      other = 'Ivan';
    }

    const objA = new B();
    const objB = { boo: new Change('doo'), foo: { baz: new Change('bar') } };

    const value = mergeDeep(objA, objB, { safeGet: get, safeSet: set });

    assert.strictEqual(value.boo, 'doo', 'unsafe plain property is merged');
    assert.strictEqual(value.other, 'Ivan', 'safe property is not touched');
    assert.deepEqual(
      value.foo,
      { baz: 'bar' },
      'unsafe object property is merged',
    );
  });

  test('it merges with content as ember data object', async function (assert) {
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

    let user = this.createUser('user', false);
    let user2 = { profile: { firstName: new Change('Joejoe') } };
    mergeDeep(user, user2, { safeGet: get, safeSet: set });

    assert.strictEqual(
      user.get('profile.firstName'),
      'Joejoe',
      'has first name',
    );
  });

  test('it does not work with ember-data objects', async function (assert) {
    assert.expect(1);

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

    let user = this.createUser('user', false);
    let user2 = this.createUser('user', true);
    try {
      mergeDeep(user, user2, { safeGet: get, safeSet: set });
    } catch ({ message }) {
      assert.strictEqual(
        message,
        'Unable to `mergeDeep` with your data. Are you trying to merge two ember-data objects? Please file an issue with ember-changeset.',
        'throws message',
      );
    }
  });
});
