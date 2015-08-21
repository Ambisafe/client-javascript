/**
 * Copyright (c) 2015 Ambisafe Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including the rights to use, copy, modify,
 * merge, publish, distribute, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * @file account.js
 * Account class used to store all the information related to an user account.
 * @author Charlie Fontana <charlie@ambisafe.co>
 * @date 07/13/2015
 */

/**
 * This section defines the required libraries
 */
var crypto = require('crypto'),
	bitcoin = require('bitcoinjs-lib');

/**
 * Defines the Account constructor.
 *
 * @param {string} containerJson.
 * @param {string} password.
 * @return none.
 */
var Account = function (containerJson, password) {
	var accountData, userData, key, privateKey;

	this.data = {};

	if (containerJson === undefined) {
		return;
	}

	if (typeof containerJson !== 'string') {
		console.log('ERR: expect parameter 1 to be string');
		return;
	}

	try {
		accountData = JSON.parse(containerJson);
	} catch(e){
		console.log('ERR: invalid JSON');
		return;
	}

	if (accountData.containers === undefined || accountData.containers.USER === undefined) {
		console.log('ERR: containers.USER is not defined');
		return;
	}

	userData = accountData.containers.USER;

	delete userData.role;

	for (var property in userData) {
		if (userData.hasOwnProperty(property)) {
			this.set(property, userData[property]);
		}
	}

	if (this.get('salt') && this.get('data') && this.get('iv') && password) {
		key = Ambisafe.deriveKey(password, this.get('salt'));
		this.set('key', key);

		privateKey = Ambisafe.decrypt(
			this.get('data'),
			this.get('iv'),
			this.get('key')
		);

		this.set('privateKey', privateKey);
	}
};

/**
 * Defines the instance data object used to store the Account data.
 */
Account.prototype.data = {};

/**
 * Instance method that signs a transaction.
 *
 * @param {object} unsigned transaction: {hex:'...', fee:'...', sighashes:['...', '...']}.
 * @return {object} signed transaction.
 */
Account.prototype.signTransaction = function (tx) {

	var privateKey = this.get('privateKey');

	if (privateKey) {
		return Ambisafe.signTransaction(tx, privateKey);
	}

	console.log('ERR: The transaction was not signed. privateKey is not defined');
};

/**
 * Instance method that set a new password
 *
 * @param {string} password
 * @return none.
 */
Account.prototype.setNewPassword = function (password) {
	var curKey, curData,
		newKey, newData,
		privateKey, iv;

	if (!this.get('salt') || !this.get('data') || !this.get('iv')) {
		console.log('ERR: The following attributes are required: salt, data and iv.');
		return;
	}

	curKey = this.get('key');
	curData = this.get('data');

	privateKey = Ambisafe.decrypt(curData, this.get('iv'), curKey);

	newKey = Ambisafe.deriveKey(password, this.get('salt'));

	this.set('iv', Ambisafe.generateRandomValue(16));
	newData = Ambisafe.encrypt(privateKey, this.get('iv'), newKey);

	this.set('data', newData);
	this.set('key', newKey);
	this.set('privateKey', privateKey);
}

/**
 * Instance method that gets the value of an indicated attribute.
 *
 * @param {string} attribute name.
 * @return {object} return the value of the indicated attribute.
 */
Account.prototype.get = function (name) {
	return this.data[name];
};

/**
 * Instance method that sets the value of an indicated attribute.
 *
 * @param {string} attribute name.
 * @param {object} attribute value.
 * @return none.
 */
Account.prototype.set = function (name, value) {
	this.data[name] = value;
};

/**
 * Intance method that returns the Account's data in a JSON format
 *
 * @param none.
 * @return {string} return the account data as string. 
 */
Account.prototype.stringify = function () {
	return JSON.stringify(this.data);
};

/**
 * Intance method that parse the Account's data
 *
 * @param {string} return the account data as string
 * @return none.
 */
Account.prototype.parse = function (data) {
	if (typeof data !== 'string') {
		console.log('ERR: The account data to parse has to be string');
		return;
	}

	this.data = JSON.parse(data);
};

/**
 * Intance method that get the Account's container as a Javascript object
 *
 * @param none.
 * @return {object}
 */
Account.prototype.getContainer = function () {
	var container = {};

	container.publicKey = this.get('publicKey');
	container.data = this.get('data');
	container.salt = this.get('salt');
	container.iv = this.get('iv');

	return container;
};

/**
 * Intance method that get the Account's container as string
 *
 * @param none.
 * @return {string}
 */
Account.prototype.getStringContainer = function () {
	return JSON.stringify(this.getContainer());
};

/**
 * exports the created Account object.
 */
module.exports = Account;