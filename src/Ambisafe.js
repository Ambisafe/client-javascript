
import bitcoin from 'bitcoinjs-lib';
import crypto from 'crypto';
import BigInteger from 'bigi';
import secp256k1 from 'secp256k1';
import Account from './Account';

export default class Ambisafe {

    /**
     * Defines the Ambisafe constructor.
     */
     constructor() {
     }

    /**
     * Static method to set the method to use by generateRandomValue
     */
    static setRandom(rng){
        this.rng = rng;
        return this;
    }

    /**
     * Static Method to generate rnadom salt key
     */
    static generateSalt() {
        var rnd;
        if (this.rng)
            rnd = this.rng.randomBytes(16);
        else
            rnd = crypto.randomBytes(Math.ceil(16));
        rnd[6] = (rnd[6] & 0x0f) | 0x40;
        rnd[8] = (rnd[8] & 0x3f) | 0x80;
        rnd = rnd.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
        rnd.shift();
        return rnd.join('-');
    }

    /**
     * Static method that creates an account and save it.
     * This supposed to happen after user have filled registration form and clicked submit.
     *
     * @param {string} currency as string
     * @param {string} password as string
     * @param {string} salt as string
     * @return {Ambisafe.Account} return the generated account object
     */
    static generateAccount (password, salt) {
        const _salt = salt || this.generateSalt();
        if (!password) {
            throw Error('ERR: password are required');
        }

        let key = this.deriveKey(password, _salt);

        let account = new Account();
        account.set('key', key);
        account.set('salt', _salt);

        var keyPair = this.generateKeyPair();
        account.set('private_key', keyPair.private_key);
        account.set('public_key', keyPair.public_key);
        var iv = this.generateRandomValue(16);
        account.set('iv', iv);

        account.set('data', this.encrypt(
            new Buffer(account.get('private_key'), 'hex'),
            iv,
            key
        ));

        return account;
    };

    static fromPrivateKey(privateKey, password, salt) {
        const _salt = salt || this.generateSalt();
        let key = this.deriveKey(password, _salt);
        let account = new Account();
        account.set('private_key', privateKey);
        account.set('public_key', (new bitcoin.ECKey(BigInteger.fromBuffer(new Buffer(privateKey, 'hex')))).pub.toHex());
        const iv = this.generateRandomValue(16);
        account.set('iv', iv);
        account.set('salt', _salt);
        account.set('data', this.encrypt(
            new Buffer(account.get('private_key'), 'hex'),
            iv,
            key
        ));
        return account;
    }

    static generateKeyPair() {
        var privateKey;
        if (this.rng)
            privateKey = this.rng.randomBytes(32).
        else
            privateKey = crypto.randomBytes(32)
        var publicKey = secp256k1.publicKeyCreate(privateKey);
        return {
            private_key: privateKey.toString('hex'),
            public_key: publicKey.toString('hex')
        };
    };


    /**
     * Static method that signs a transaction.
     *
     * @param {object} tx unsigned transaction: {hex:'...', fee:'...', sighashes:['...', '...']}.
     * @param {string} private_key.
     * @return {object} signed transaction.
     */
    static signTransaction(tx, private_key) {

        if (!(tx.sighashes) || !(tx.sighashes instanceof Array)) {
            throw new Error('ERR: The "sighashes" attribute is required.');
            return;
        }

        tx.user_signatures = [];
        const buffer = new Buffer(private_key, 'hex');
        const d = BigInteger.fromBuffer(buffer);
        let keyPair = new bitcoin.ECKey(d, true);

        tx.sighashes.forEach(function (sighash) {
            const sign = keyPair.sign(new Buffer(sighash, 'hex')).toDER().toString('hex');
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
    static generateRandomValue(length) {
        if (!length)
            length = 32;
        if (this.rng)
            return this.rng.randomBytes(length).toString('hex');
        else
            return crypto.randomBytes(Math.ceil(length)).toString('hex');
    };

    /**
     * Static method that derives a key from a password
     *
     * @param {string} password
     * @param {string} salt
     * @param {number} depth
     * @return {string} key
     */
    static deriveKey(password, salt, depth) {
        if (!depth)
            depth = 1000;

        const key = crypto.pbkdf2Sync(password, salt, depth, 32, 'sha512');
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
    static encrypt(cleardata, iv, cryptkey) {
        const bufferCryptKey = new Buffer(cryptkey, 'hex');

        let encipher = crypto.createCipheriv('aes-256-cbc', bufferCryptKey, new Buffer(iv, 'hex'));
        let encryptData  = encipher.update(cleardata, 'utf8', 'binary');

        encryptData += encipher.final('binary');
        return new Buffer(encryptData, 'binary').toString('hex');
    };

    /**
     * Static method that decrypts an input based on the Advanced Encryption Standard (AES)
     *
     * @param {string} encryptdata
     * @param {string} iv
     * @param {string} cryptkey
     * @return {string} decrypted text
     */
    static decrypt(encryptdata, iv, cryptkey) {

        const bufferCryptKey = new Buffer(cryptkey, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', bufferCryptKey, new Buffer(iv, 'hex'));

        return Buffer.concat([decipher.update(new Buffer(encryptdata, 'hex')), decipher.final()]);
    };

    /**
     * Static method that gets the SHA1 hash of a string
     *
     * @param {string} input
     * @return {string} SHA1 hash
     */
    static SHA1(input) {
        return crypto.createHash('sha1').update(input).digest('hex');
    };

}
