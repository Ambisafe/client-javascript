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

'use strict';

/**
 * This section defines the required libraries
 */
var crypto = require('crypto'),
    bitcoin = require('bitcoinjs-lib'),
    Ambisafe = require('../ambisafe');

/**
 * Defines the Account constructor.
 *
 * @param {object} container.
 * @param {string} password.
 * @return none.
 */
Ambisafe.Account = function (container, password) {
    var key, privateKey, property;

    this.data = {};

    for (property in container) {
        if (container.hasOwnProperty(property)) {
            this.set(property, container[property]);
        }
    }

    if (this.get('salt') && this.get('data') && this.get('iv') && password) {
        key = Ambisafe.deriveKey(password, this.get('salt'));
        this.set('key', key);

        privateKey = Ambisafe.decrypt(
            this.get('data'),
            this.get('iv'),
            this.get('key')
        ).toString('hex');

        this.set('private_key', privateKey);
    }
};

/**
 * Defines the instance data object used to store the Account data.
 */
Ambisafe.Account.prototype.data = {};

/**
 * Instance method that signs a transaction.
 *
 * @param {object} tx unsigned transaction: {hex:'...', fee:'...', sighashes:['...', '...']}.
 * @return {object} signed transaction.
 */
Ambisafe.Account.prototype.signTransaction = function (tx) {

    var privateKey = this.get('private_key');

    if (privateKey) {
        return Ambisafe.signTransaction(tx, privateKey);
    }

    console.log('ERR: The transaction was not signed. The "private_key" attribute is not defined');
};

/**
 * Instance method that set a new password
 *
 * @param {string} password
 * @return none.
 */
Ambisafe.Account.prototype.setNewPassword = function (password) {
    var curKey, curData,
        newKey, newData,
        privateKey;

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
    this.set('private_key', privateKey.toString('hex'));
};

/**
 * Instance method that gets the value of an indicated attribute.
 *
 * @param {string} name attribute name.
 * @return {object} return the value of the indicated attribute.
 */
Ambisafe.Account.prototype.get = function (name) {
    return this.data[name];
};

/**
 * Instance method that sets the value of an indicated attribute.
 *
 * @param {string} name attribute name.
 * @param {object} value attribute value.
 * @return none.
 */
Ambisafe.Account.prototype.set = function (name, value) {
    this.data[name] = value;
};

/**
 * Intance method that returns the Account's data in a JSON format
 *
 * @return {string} return the account data as string.
 */
Ambisafe.Account.prototype.stringify = function () {
    return JSON.stringify(this.data);
};

/**
 * Intance method that parse the Account's data
 *
 * @param {string} data return the account data as string
 * @return none.
 */
Ambisafe.Account.prototype.parse = function (data) {
    if (typeof data !== 'string') {
        console.log('ERR: The account data to parse has to be string');
        return;
    }

    this.data = JSON.parse(data);
};

/**
 * Intance method that get the Account's container as a Javascript object
 *
 * @return {object}
 */
Ambisafe.Account.prototype.getContainer = function () {
    var container = {};

    container.public_key = this.get('public_key');
    container.data = this.get('data');
    container.salt = this.get('salt');
    container.iv = this.get('iv');

    return container;
};

/**
 * Intance method that get the Account's container as string
 *
 * @return {string}
 */
Ambisafe.Account.prototype.getStringContainer = function () {
    return JSON.stringify(this.getContainer());
};