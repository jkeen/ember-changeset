import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { typeOf, isPresent } from '@ember/utils';
import { set } from '@ember/object';
import { Changeset } from 'ember-changeset';
import { lookupValidator } from 'validated-changeset';
import hbs from 'htmlbars-inline-precompile';
import {
  render,
  find,
  fillIn,
  click,
  blur,
  triggerEvent,
} from '@ember/test-helpers';

module('Integration | Helper | changeset', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.updateAttr = (changeset, attr, event) => {
      changeset.set(attr, event.target.value);
    };
  });

  test('it validates changes', async function (assert) {
    let validations = {
      firstName(value) {
        return (isPresent(value) && value.length > 3) || 'too short';
      },
      lastName(value) {
        return (isPresent(value) && value.length > 3) || 'too short';
      },
    };
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.validate = ({ key, newValue }) => {
      let validatorFn = validations[key];

      if (typeOf(validatorFn) === 'function') {
        return validatorFn(newValue);
      }
    };
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#let (changeset this.dummyModel this.validate) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        <input id="first-name" value={{changesetObj.firstName}} {{on "change" (fn this.updateAttr changesetObj "firstName")}} />
        <input id="last-name" value={{changesetObj.lastName}} {{on "change" (fn this.updateAttr changesetObj "lastName")}} />
        <button id="submit-btn" type="button" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" type="button" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/let}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').exists('should be invalid');

    await fillIn('#first-name', 'Billy');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').doesNotExist('should be valid');
  });

  test('it accepts validation map', async function (assert) {
    let validations = {
      firstName(key, newValue) {
        return (isPresent(newValue) && newValue.length > 3) || 'too short';
      },
      lastName(key, newValue) {
        return (isPresent(newValue) && newValue.length > 3) || 'too short';
      },
    };
    this.dummyModel = { firstName: 'Jim', lastName: 'Bobbie' };
    this.validations = validations;
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#let (changeset this.dummyModel this.validations) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        <input id="first-name" value={{changesetObj.firstName}} {{on "change" (fn this.updateAttr changesetObj "firstName")}} />
        <input id="last-name" value={{changesetObj.lastName}} {{on "change" (fn this.updateAttr changesetObj "lastName")}} />
        <button id="submit-btn" type="button" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" type="button" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/let}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').exists('should be invalid');

    await fillIn('#first-name', 'Billy');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').doesNotExist('should be valid');
  });

  test('it accepts validation map with multiple validations', async function (assert) {
    function validateLength() {
      return (key, newValue) =>
        (isPresent(newValue) && newValue.length > 3) || 'too short';
    }
    function validateStartsUppercase() {
      return (key, newValue) =>
        (isPresent(newValue) &&
          newValue.charCodeAt(0) > 65 &&
          newValue.charCodeAt(0) < 90) ||
        'not upper case';
    }
    let validations = {
      firstName: [validateLength(), validateStartsUppercase()],
    };
    this.dummyModel = { firstName: 'Jim', lastName: 'Bobbie' };
    this.validations = validations;
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#let (changeset this.dummyModel this.validations) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        <input id="first-name" value={{changesetObj.firstName}} {{on "change" (fn this.updateAttr changesetObj "firstName")}} />
        <input id="last-name" value={{changesetObj.lastName}} {{on "change" (fn this.updateAttr changesetObj "lastName")}} />
        <button id="submit-btn" type="button" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" type="button" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/let}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').exists('should be invalid');

    await fillIn('#first-name', 'Billy');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').doesNotExist('should be valid');
  });

  test('it accepts validation map with multiple validations with promises', async function (assert) {
    function validateLength() {
      return (key, newValue) =>
        (isPresent(newValue) && Promise.resolve(newValue.length > 3)) ||
        'too short';
    }
    function validateStartsUppercase() {
      return (key, newValue) =>
        (isPresent(newValue) &&
          newValue.charCodeAt(0) > 65 &&
          newValue.charCodeAt(0) < 90) ||
        Promise.resolve('not upper case');
    }
    let validations = {
      firstName: [validateLength(), validateStartsUppercase()],
    };
    this.dummyModel = { firstName: 'Jim', lastName: 'Bobbie' };
    this.validations = validations;
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#let (changeset this.dummyModel this.validations) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        <input id="first-name" value={{changesetObj.firstName}} {{on "change" (fn this.updateAttr changesetObj "firstName")}} />
        <input id="last-name" value={{changesetObj.lastName}} {{on "change" (fn this.updateAttr changesetObj "lastName")}} />
        <button id="submit-btn" type="button" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" type="button" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/let}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').exists('should be invalid');

    await fillIn('#first-name', 'Billy');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').doesNotExist('should be valid');
  });

  test('it rollsback changes', async function (assert) {
    this.dummyModel = { firstName: 'Jim' };
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#let (changeset this.dummyModel) as |changesetObj|}}
        <input id="first-name" value={{changesetObj.firstName}} {{on "change" (fn this.updateAttr changesetObj "firstName")}} />
        <button id="reset-btn" type="button" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/let}}
    `);

    assert.dom('#first-name').hasValue('Jim', 'precondition');
    await fillIn('#first-name', 'foo');
    assert.dom('#first-name').hasValue('foo', 'should update input');
    await click('#reset-btn');
    assert.dom('#first-name').hasValue('Jim', 'should rollback');
  });

  test('it can be used with 1 argument', async function (assert) {
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#let (changeset this.dummyModel) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        <input id="first-name" value={{changesetObj.firstName}} {{on "change" (fn this.updateAttr changesetObj "firstName")}} />
        <input id="last-name" value={{changesetObj.lastName}} {{on "change" (fn this.updateAttr changesetObj "lastName")}} />
        <button id="submit-btn" type="button" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" type="button" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/let}}
    `);

    await click('#submit-btn');
    assert.dom('#errors-paragraph').doesNotExist('should be valid');
  });

  test('it updates when set without a validator', async function (assert) {
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    await render(hbs`
      {{#let (changeset this.dummyModel) as |changesetObj|}}
        <h1>{{changesetObj.firstName}} {{changesetObj.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{changesetObj.firstName}}
          {{on "change" (fn this.updateAttr changesetObj "firstName")}}
        />
        <input id="last-name" value={{changesetObj.lastName}} {{on "change" (fn this.updateAttr changesetObj "lastName")}} />
      {{/let}}
    `);

    assert.dom('h1').hasText('Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.dom('h1').hasText('foo bar', 'should update observable value');
  });

  test('it updates when set with a validator', async function (assert) {
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.validate = () => true;
    this.updateFirstName = (changeset, evt) => {
      changeset.firstName = evt.target.value;
    };
    await render(hbs`
      {{#let (changeset this.dummyModel this.this.validate) as |changesetObj|}}
        <h1>{{changesetObj.firstName}} {{changesetObj.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{changesetObj.firstName}}
          {{on "change" (fn this.updateAttr changesetObj "firstName")}}
        />
        <input id="last-name" value={{changesetObj.lastName}} {{on "change" (fn this.updateAttr changesetObj "lastName")}} />
      {{/let}}
    `);

    assert.dom('h1').hasText('Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.dom('h1').hasText('foo bar', 'should update observable value');
  });

  test('a passed down nested object updates when set without a validator', async function (assert) {
    let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
    let changeset = Changeset(data);
    this.changeset = changeset;

    await render(hbs`
      <h1>{{this.changeset.person.firstName}} {{this.changeset.person.lastName}}</h1>
      <input
        id="first-name"
        value={{this.changeset.person.firstName}}
        {{on "change" (fn this.updateAttr this.changeset "person.firstName")}}>
      <input id="last-name"
        value={{this.changeset.person.lastName}}
        {{on "change" (fn this.updateAttr this.changeset "person.lastName")}}>
    `);

    assert.dom('h1').hasText('Jim Bob', 'precondition');
    assert.strictEqual(
      changeset.get('person.firstName'),
      'Jim',
      'precondition firstName',
    );
    assert.strictEqual(
      changeset.get('person.lastName'),
      'Bob',
      'precondition lastName',
    );
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.strictEqual(
      changeset.get('person.firstName'),
      'foo',
      'should update observable value',
    );
    assert.strictEqual(
      changeset.get('person.lastName'),
      'bar',
      'should update observable value lastName',
    );
    assert.strictEqual(
      changeset.get('person').firstName,
      'foo',
      'should work with top level key',
    );
    assert.strictEqual(
      changeset.get('person').lastName,
      'bar',
      'should work with top level key last name',
    );
    assert.strictEqual(
      changeset.person.firstName,
      'foo',
      'should work with top level key',
    );
    assert.strictEqual(
      changeset.get('_content').person.firstName,
      'Jim',
      "keeps value on model as execute hasn't been called",
    );
    assert.dom('h1').hasText('foo bar', 'should update observable value');
  });

  test('nested object updates when set without a validator', async function (assert) {
    let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
    let changeset = Changeset(data);
    this.changeset = changeset;

    await render(hbs`
      <h1>{{this.changeset.person.firstName}} {{this.changeset.person.lastName}}</h1>
      <input
        id="first-name"
        value={{this.changeset.person.firstName}}
        {{on "change" (fn this.updateAttr this.changeset "person.firstName")}}>
      <input
        id="last-name"
        value={{this.changeset.person.lastName}}
        {{on "change" (fn this.updateAttr this.changeset "person.lastName")}}>
    `);

    assert.dom('h1').hasText('Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.dom('h1').hasText('foo bar', 'should update observable value');
  });

  test('nested key error clears after entering valid input', async function (assert) {
    let data = { person: { firstName: 'Jim' } };
    let validator = ({ newValue }) =>
      isPresent(newValue) || 'need a first name';
    let c = Changeset(data, validator);
    this.c = c;

    await render(hbs`
      <h1>{{this.c.person.firstName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{this.c.person.firstName}}
        {{on "change" (fn this.updateAttr this.c "person.firstName")}}>
      <small id="first-name-error">{{this.c.error.person.firstName.validation}}</small>
    `);

    assert.dom('h1').hasText('Jim', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#first-name', '');

    let actual = find('#first-name-error').textContent.trim();
    let expectedResult = 'need a first name';
    assert.strictEqual(actual, expectedResult, 'shows error message');

    await fillIn('#first-name', 'foo');

    actual = find('#first-name-error').textContent.trim();
    expectedResult = '';
    assert.strictEqual(actual, expectedResult, 'hides error message');
  });

  test('nested object updates when set with async validator', async function (assert) {
    let data = { person: { firstName: 'Jim' } };
    let validator = () => Promise.resolve(true);
    let c = Changeset(data, validator);
    this.c = c;

    await render(hbs`
      <h1>{{this.c.person.firstName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{this.c.person.firstName}}
        {{on "change" (fn this.updateAttr this.c "person.firstName")}}>
      <small id="first-name-error">{{this.c.error.person.firstName.validation}}</small>
    `);
    assert.dom('h1').hasText('Jim', 'precondition');
    await fillIn('#first-name', 'John');
    assert.dom('h1').hasText('John', 'should update observable value');
  });

  test('deeply nested key error clears after entering valid input', async function (assert) {
    assert.expect(3);

    let data = { person: { name: { parts: { first: 'Jim' } } } };
    let validator = ({ newValue }) =>
      isPresent(newValue) || 'need a first name';
    let c = Changeset(data, validator);
    this.c = c;
    this.mutValue = (path, evt) => (this.c[path] = evt.target.value);

    await render(hbs`
      <h1>{{this.c.person.name.parts.first}}</h1>
      <input
        id="first-name"
        type="text"
        value={{this.c.person.name.parts.first}}
        {{on "change" (fn this.updateAttr this.c "person.name.parts.first")}}>
      <small id="first-name-error">{{this.c.error.person.name.parts.first.validation}}</small>
    `);

    assert.dom('h1').hasText('Jim', 'precondition');
    await fillIn('#first-name', '');

    {
      let actual = find('#first-name-error').textContent.trim();
      let expectedResult = 'need a first name';
      assert.strictEqual(actual, expectedResult, 'shows error message');
    }

    await fillIn('#first-name', 'foo');

    {
      let actual = find('#first-name-error').textContent.trim();
      let expectedResult = '';
      assert.strictEqual(actual, expectedResult, 'hides error message');
    }
  });

  test('a rollback propagates binding to deeply nested changesets', async function (assert) {
    let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
    let changeset = Changeset(data);
    this.changeset = changeset;
    this.reset = () => changeset.rollback();
    this.mutValue = (path, evt) => (this.changeset[path] = evt.target.value);
    await render(hbs`
      <h1>{{this.changeset.person.firstName}} {{this.changeset.person.lastName}}</h1>
      <input
        id="first-name"
        value={{this.changeset.person.firstName}}
        {{on "change" (fn this.updateAttr this.changeset "person.firstName")}}>
      <input
        id="last-name"
        value={{this.changeset.person.lastName}}
        {{on "change" (fn this.updateAttr this.changeset "person.lastName")}}>
      <button id="reset-btn" type="button" {{on "click" this.reset}}>Reset</button>
    `);

    assert.dom('h1').hasText('Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.dom('h1').hasText('foo bar', 'should update observable value');
    await click('#reset-btn');
    assert.dom('h1').hasText('Jim Bob', 'should rollback values');
  });

  test('it does not rollback when validating', async function (assert) {
    let dummyValidations = {
      even(k, value) {
        return value % 2 === 0 || 'must be even';
      },
      odd(k, value) {
        return value % 2 !== 0 || 'must be odd';
      },
    };
    let changeset = Changeset(
      { even: 4, odd: 4 },
      lookupValidator(dummyValidations),
      dummyValidations,
    );
    this.addEven = (changeset, evt) => {
      changeset.even = evt.target.value;
    };
    this.addOdd = (changeset, evt) => {
      changeset.odd = evt.target.value;
    };
    this.changeset = changeset;
    this.validateProperty = (changeset, property) =>
      changeset.validate(property);
    await render(hbs`
      <fieldset class="even">
        <label for="even">Even Number</label>
        <input
          id="even"
          type="text"
          value={{this.changeset.even}}
          {{on "input" (fn this.addEven this.changeset)}}
          {{on "blur" (fn this.validateProperty this.changeset "even")}}>
        {{#if this.changeset.error.even}}
          <small class="even">{{this.changeset.error.even.validation}}</small>
        {{/if}}
        <code class="even">{{this.changeset.even}}</code>
      </fieldset>

      <fieldset class="odd">
        <label for="odd">Odd Number</label>
        <input
          id="odd"
          type="text"
          value={{this.changeset.odd}}
          {{on "input" (fn this.addOdd this.changeset)}}
          {{on "blur" (fn this.validateProperty this.changeset "odd")}}>
        {{#if this.changeset.error.odd}}
          <small class="odd">{{this.changeset.error.odd.validation}}</small>
        {{/if}}
        <code class="odd">{{this.changeset.odd}}</code>
      </fieldset>
    `);

    await fillIn('#even', '9');
    await triggerEvent('#odd', 'blur');
    assert
      .dom('small.even')
      .hasText('must be even', 'should display error message');
    assert
      .dom('small.odd')
      .hasText('must be odd', 'should display error message');
    assert.dom('#even').hasValue('9', 'should not rollback');
    assert.dom('code.even').hasText('9', 'should not rollback');
    assert.dom('#odd').hasValue('4', 'should not rollback');
    await blur('#even');
    // there is a scenario where going from valid to invalid would cause values to
    // go out of sync
    await fillIn('#odd', '10');
    await blur('#odd');
    assert
      .dom('small.even')
      .hasText('must be even', 'should display error message');
    assert
      .dom('small.odd')
      .hasText('must be odd', 'should display error message');
    assert.dom('#odd').hasValue('10', 'should not rollback');
    assert.dom('code.odd').hasText('10', 'should not rollback');
  });

  test('it handles when changeset is already set', async function (assert) {
    class Moment {
      constructor(date) {
        this.date = date;
      }
    }
    let d = new Date('2015');
    let momentInstance = new Moment(d);
    this.dummyModel = { startDate: momentInstance };
    await render(hbs`
      {{#let (changeset this.dummyModel) as |changesetObj|}}
        <h1>{{changesetObj.startDate.date}}</h1>
      {{/let}}
    `);

    assert.dom('h1').hasText(d.toString(), 'should update observable value');
  });

  test('it handles when is plain object passed to helper', async function (assert) {
    let d = new Date('2015');
    this.d = d;
    await render(hbs`
      {{#let (changeset (hash date=this.d)) as |changesetObj|}}
        <h1>{{changesetObj.date}}</h1>
      {{/let}}
    `);

    assert.dom('h1').hasText(d.toString(), 'should update observable value');
  });

  test('it handles models that are promises', async function (assert) {
    this.dummyModel = Promise.resolve({ firstName: 'Jim', lastName: 'Bob' });

    this.updateAttr = (changeset, attr, event) => {
      set(changeset, attr, event.target.value);
    };

    // @todo this test does not await until promise resolved
    // and actually mutates props on the Promise object, not on the changeset
    await render(hbs`
      {{#let (changeset this.dummyModel) as |changesetObj|}}
        <h1>{{changesetObj.firstName}} {{changesetObj.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{changesetObj.firstName}}
          {{on "change" (fn this.updateAttr changesetObj "firstName")}}>

        <input
          id="last-name"
          value={{changesetObj.lastName}}
          {{on "change" (fn this.updateAttr changesetObj "lastName")}}
        />
      {{/let}}
    `);

    await fillIn('#first-name', 'foo');
    await blur('#first-name');
    await fillIn('#last-name', 'bar');
    await blur('#last-name');
    assert.dom('h1').hasText('foo bar', 'should update observable value');
  });

  test('it skips validation when skipValidate is passed as an option', async function (assert) {
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.validate = () => false;
    await render(hbs`
      {{#let (changeset this.dummyModel this.validate skipValidate=true) as |changesetObj|}}
        <h1>{{changesetObj.firstName}} {{changesetObj.lastName}}</h1>
        <input id="first-name" value={{changesetObj.firstName}} {{on "change" (fn this.updateAttr changesetObj "firstName")}} />
        <input id="last-name" value={{changesetObj.lastName}} {{on "change" (fn this.updateAttr changesetObj "lastName")}} />
        {{#if changesetObj.isInvalid}}
          <p id="error-paragraph">There were one or more errors in your form.</p>
        {{/if}}
      {{/let}}
    `);

    assert.dom('h1').hasText('Jim Bob', 'precondition');
    await fillIn('#first-name', 'J');
    await blur('#first-name');
    await fillIn('#last-name', 'B');
    await blur('#last-name');
    assert.dom('h1').hasText('J B', 'should update observable value');
    assert.dom('#error-paragraph').doesNotExist('should skip validation');
  });

  test('it validates changes with changesetKeys', async function (assert) {
    let validations = {
      firstName(value) {
        return (isPresent(value) && value.length > 3) || 'too short';
      },
    };
    this.dummyModel = { firstName: 'Jimm', lastName: 'Bob' };
    this.validate = ({ key, newValue }) => {
      let validatorFn = validations[key];

      if (typeOf(validatorFn) === 'function') {
        return validatorFn(newValue);
      }
    };
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    this.changesetKeys = ['lastName'];
    await render(hbs`
      {{#let (changeset this.dummyModel this.validate changesetKeys=this.changesetKeys) as |changesetObj|}}
        {{#if changesetObj.isDirty}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        <input id="first-name" value={{changesetObj.firstName}} {{on "change" (fn this.updateAttr changesetObj "firstName")}} />
        <button id="submit-btn" type="button" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
      {{/let}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.dom('#errors-paragraph').doesNotExist('should not be invalid');
  });
});
