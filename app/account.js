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
 * @version 0.1
 */

/**
 * Defines the Account constructor.
 *
 * @param {string} containerJsonAsString.
 * @param {string} password.
 * @return none.
 */
var Account = function (containerJsonAsString, password) {

	if (containerJsonAsString) {
		this.data.containerJsonAsString = containerJsonAsString;
	}
	
	if (password) {
		this.data.password = password;
	}
};

/**
 * Defines the instance data object used to store the Account data.
 */
Account.prototype.data = {};

/**
 * Defines the signTransaction function.
 *
 * @param {string} currency.
 * @param {object} unsigned transaction.
 * @return {object} signed transaction.
 */
Account.prototype.signTransaction = function (currency, tx) {
	//TODO implement it.

	this.set('currency', currency);

	return tx;
};

/**
 * Defines the "get" functions based on the attribute name.
 *
 * @param {string} attribute name.
 * @return {object} return the value of the indicated attribute.
 */
Account.prototype.get = function (name) {
	return this.data[name];
};

/**
 * Defines the "set" functions.
 *
 * @param {string} attribute name.
 * @param {object} attribute value.
 * @return none.
 */
Account.prototype.set = function (name, value) {
	this.data[name] = value;
};

/**
 * Defines the "toString" function.
 *
 * @param none.
 * @return {string} return the account data as string
 */
Account.prototype.toString = function () {
	return this.data;
};

/**
 * exports the created Account object.
 */
module.exports = Account;