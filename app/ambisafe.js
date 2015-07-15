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
 * @file ambisafe.js
 * Ambisafe class used to define the functions of the library
 * @author Charlie Fontana <charlie@ambisafe.co>
 * @date 07/13/2015
 * @version 0.1
 */

/**
 * This section defines the required libraries
 */
var bitcoin = require('bitcoinjs-lib'),
	pbkdf2 = require('crypto-PBKDF2'),
	cryptoAES = require('node-cryptojs-aes');

/**
 * Defines the Ambisafe constructor.
 */
var Ambisafe = function () {

};

/**
 * Defines the static constants
 */
Ambisafe.currency = {};
Ambisafe.currency.BITCOIN = 'btc';

/**
 * Defines the Ambisafe.Account class based on the ./account.js file.
 * It was solved in this way to prevent the conflict between the "Account" class and another customer class.
 */
Ambisafe.Account = require('./account.js');

/**
 * Static method that creates an account and save it. 
 * This supposed to happen after user have filled registration form and clicked submit.
 *
 * @param {string} currency as string
 * @param {string} password as string
 * @param {string} salt as string
 * @return {Ambisafe.Account} return the generated account object
 */
Ambisafe.generateAccount = function(currency, password, salt) {
	var account, key, keyWif;

	if (!password || !password) {
		console.log('ERR: currency and password are required.');
		return;
	}

	key = Ambisafe.deriveKey(password, salt);

	account = new Ambisafe.Account();
	account.set('key', key);
	account.set('password', password);

	if (currency) {
		account.set('currency', currency);
	}

	keyWif = bitcoin.ECKey.makeRandom().toWIF();
	account.set('privatekey', keyWif);
	account.set('data', Ambisafe.encrypt(keyWif, key));

	return account;
};

/**
 * Static method that grabs a new salt value.
 *
 * @param {number} explicitIterations An integer
 * @return {string} return iterations and salt together as one string ({hex-iterations}.{base64-salt})
 */
Ambisafe.generateSalt = function(explicitIterations) {
	var bytes, iterations;

	bytes = pbkdf2.lib.WordArray.random(192/8);
	iterations = explicitIterations.toString(16);

	return iterations + '.' + bytes.toString(pbkdf2.enc.Base64);
};

/**
 * Static method that derives a key from a password
 *
 * @param {string} password
 * @param {string} salt
 * @param {number} depth
 * @return {string} key
 */
Ambisafe.deriveKey = function(password, salt, depth) {
	var key;

	if (!depth) {
		depth = 1000;
	}

	if (!salt) {
		salt = Ambisafe.generateSalt(depth);
	}

	key = pbkdf2.PBKDF2(
		password,
		salt,
		{ 'keySize': 256/32, 'iterations': depth }
	);

	return key.toString();
};

/**
 * Static method that encrypts an input based on the Advanced Encryption Standard (AES)
 *
 * @param {string} input
 * @param {string} key
 * @return {object} JSON object: {ct:'..', iv:'..', s:'..'}
 */
Ambisafe.encrypt = function(input, key) {
	var cryptoJS, encrypted;

	cryptoJS = cryptoAES.CryptoJS;

	encrypted = cryptoJS.AES.encrypt(input, key, {
		format: cryptoAES.JsonFormatter
	});

	return encrypted.toString();
};

/**
 * Static method decrypts an input based on the Advanced Encryption Standard (AES)
 *
 * @param {object} JSON object: {ct:'..', iv:'..', s:'..'}
 * @param {string} key
 * @return {string} decrypted text
 */
Ambisafe.decrypt = function(encryptedInput, key) {
	var cryptoJS, decrypted;

	cryptoJS = cryptoAES.CryptoJS;

	decrypted = cryptoJS.AES.decrypt(encryptedInput, key, {
		format: cryptoAES.JsonFormatter
	});

	return cryptoJS.enc.Utf8.stringify(decrypted);
};

/**
 * exports the created Ambisafe object.
 */
module.exports = Ambisafe;