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
 */
'use strict';
/**
 * This section defines the required libraries
 */
var bitcoin = require('bitcoinjs-lib'),
    crypto = require('crypto'),
    BigInteger = require('bigi'),
    uuid4 = require('uuid4');

/**
 * Defines the Ambisafe constructor.
 */
var Ambisafe = function () {};

/**
 * Defines the static constants
 */
Ambisafe.currency = {};
Ambisafe.currency.BITCOIN = 'BTC';


/**
 * Static method that creates an account and save it.
 * This supposed to happen after user have filled registration form and clicked submit.
 *
 * @param {string} currency as string
 * @param {string} password as string
 * @param {string} salt as string
 * @return {Ambisafe.Account} return the generated account object
 */
Ambisafe.generateAccount = function (currency, password, salt, keyPair) {
    var account,
        key,
        iv;

    salt = salt || uuid4();

    if (!password) {
        throw Error('ERR: password are required');
    }

    key = Ambisafe.deriveKey(password, salt);

    account = new Ambisafe.Account();
    account.set('key', key);
    account.set('salt', salt);

    if (!keyPair)
        keyPair = Ambisafe.generateKeyPair();
    account.set('private_key', keyPair.private_key);
    account.set('public_key', keyPair.public_key);
    iv = Ambisafe.generateRandomValue(16);
    account.set('iv', iv);

    account.set('data', Ambisafe.encrypt(
        new Buffer(account.get('private_key'), 'hex'),
        iv,
        key
    ));

    return account;
};

Ambisafe.fromPrivateKey = function (privateKey, password, salt) {
    var iv,
        key,
        account;
    salt = salt || uuid4();
    key = Ambisafe.deriveKey(password, salt);
    account = new Ambisafe.Account();
    account.set('private_key', privateKey);
    account.set('public_key', (new bitcoin.ECKey(BigInteger.fromBuffer(new Buffer(privateKey, 'hex')))).pub.toHex());
    iv = Ambisafe.generateRandomValue(16);
    account.set('iv', iv);
    account.set('salt', salt);
    account.set('data', Ambisafe.encrypt(
        new Buffer(account.get('private_key'), 'hex'),
        iv,
        key
    ));
    return account;
}

Ambisafe.generateKeyPair = function () {
    var eckey = bitcoin.ECKey.makeRandom();
    return {
        private_key: eckey.d.toHex(),
        public_key: eckey.pub.toHex()
    };
};


/**
 * Static method that signs a transaction.
 *
 * @param {object} tx unsigned transaction: {hex:'...', fee:'...', sighashes:['...', '...']}.
 * @param {string} private_key.
 * @return {object} signed transaction.
 */
Ambisafe.signTransaction = function (tx, private_key) {
    var keyPair, sign, buffer, d;

    if (!(tx.sighashes) || !(tx.sighashes instanceof Array)) {
        console.log('ERR: The "sighashes" attribute is required.');
        return;
    }

    tx.user_signatures = [];
    buffer = new Buffer(private_key, 'hex');
    d = BigInteger.fromBuffer(buffer);
    keyPair = new bitcoin.ECKey(d, true);

    tx.sighashes.forEach(function (sighash) {
        sign = keyPair.sign(new Buffer(sighash, 'hex')).toDER().toString('hex');
        tx.user_signatures.push(sign);
    });

    return tx;
};


/**
 * Static method that generates random values
 *
 * @param {number} length An integer
 * @return {string} return random value
 */
Ambisafe.generateRandomValue = function (length) {
    var randomBytes;

    if (!length) {
        length = 256 / 16;
    }

    randomBytes = crypto.randomBytes(Math.ceil(length));
    return randomBytes.toString('hex');
};

/**
 * Static method that derives a key from a password
 *
 * @param {string} password
 * @param {string} salt
 * @param {number} depth
 * @return {string} key
 */
Ambisafe.deriveKey = function (password, salt, depth) {
    var key;

    if (!depth) {
        depth = 1000;
    }

    key = crypto.pbkdf2Sync(password, salt, depth, 32, 'sha512');

    return key.toString('hex');
};

/**
 * Static method that encrypts an input based on the Advanced Encryption Standard (AES)
 *
 * @param {string} cleardata
 * @param {string} iv
 * @param {string} cryptkey
 * @return {string} encrypted data
 */
Ambisafe.encrypt = function (cleardata, iv, cryptkey) {
    var encipher, encryptData, encodeEncryptData, bufferCryptKey;

    bufferCryptKey = new Buffer(cryptkey, 'hex');

    encipher = crypto.createCipheriv('aes-256-cbc', bufferCryptKey, new Buffer(iv, 'hex'));
    encryptData  = encipher.update(cleardata, 'utf8', 'binary');

    encryptData += encipher.final('binary');
    encodeEncryptData = new Buffer(encryptData, 'binary').toString('hex');

    return encodeEncryptData;
};

/**
 * Static method that decrypts an input based on the Advanced Encryption Standard (AES)
 *
 * @param {string} encryptdata
 * @param {string} iv
 * @param {string} cryptkey
 * @return {string} decrypted text
 */
Ambisafe.decrypt = function (encryptdata, iv, cryptkey) {
    var decipher, decoded, bufferCryptKey;

    bufferCryptKey = new Buffer(cryptkey, 'hex');

    decipher = crypto.createDecipheriv('aes-256-cbc', bufferCryptKey, new Buffer(iv, 'hex'));
    decoded  = Buffer.concat([decipher.update(new Buffer(encryptdata, 'hex')), decipher.final()]);
    return decoded;
};

/**
 * Static method that gets the SHA1 hash of a string
 *
 * @param {string} input
 * @return {string} SHA1 hash
 */
Ambisafe.SHA1 = function (input) {
    var shasum = crypto.createHash('sha1');

    shasum.update(input);

    return shasum.digest('hex');
};

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

/**
 * exports the created Ambisafe object.
 */
var exports = module.exports = Ambisafe;
