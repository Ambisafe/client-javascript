
import Ambisafe from './Ambisafe';

export default class Account {

    /**
     * Defines the Account constructor.
     *
     * @param {object} container.
     * @param {string} password.
     * @return none.
     */
    constructor(container, password) {

        this.data = {};

        for (var property in container) {
            if (container.hasOwnProperty(property)) {
                this.set(property, container[property]);
            }
        }

        if (this.get('salt') && this.get('data') && this.get('iv') && password) {
            let key = Ambisafe.deriveKey(password, this.get('salt'));
            this.set('key', key);

            let privateKey = Ambisafe.decrypt(
                this.get('data'),
                this.get('iv'),
                this.get('key')
            ).toString('hex');

            this.set('private_key', privateKey);
        }
    };

    /**
     * Instance method that signs a transaction.
     *
     * @param {object} tx unsigned transaction: {hex:'...', fee:'...', sighashes:['...', '...']}.
     * @return {object} signed transaction.
     */
    signTransaction(tx) {
        if (this.get('private_key'))
            return Ambisafe.signTransaction(tx, privateKey);
        else
            throw new Error('ERR: The transaction was not signed. The "private_key" attribute is not defined');
    };

    /**
     * Instance method that set a new password
     *
     * @param {string} password
     * @return none.
     */
    setNewPassword(password) {

        if (!this.get('salt') || !this.get('data') || !this.get('iv')) {
            throw new Error('ERR: The following attributes are required: salt, data and iv.');
            return;
        }

        const curKey = this.get('key');
        const curData = this.get('data');

        const privateKey = Ambisafe.decrypt(curData, this.get('iv'), curKey);

        const newKey = Ambisafe.deriveKey(password, this.get('salt'));

        this.set('iv', Ambisafe.generateRandomValue(16));
        const newData = Ambisafe.encrypt(privateKey, this.get('iv'), newKey);

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
    get(name) {
        return this.data[name];
    };

    /**
     * Instance method that sets the value of an indicated attribute.
     *
     * @param {string} name attribute name.
     * @param {object} value attribute value.
     * @return none.
     */
    set(name, value) {
        this.data[name] = value;
    };

    /**
     * Intance method that returns the Account's data in a JSON format
     *
     * @return {string} return the account data as string.
     */
    stringify () {
        return JSON.stringify(this.data);
    };

    /**
     * Intance method that parse the Account's data
     *
     * @param {string} data return the account data as string
     * @return none.
     */
    parse(data) {
        if (typeof data !== 'string') {
            throw new Error('ERR: The account data to parse has to be string');
            return;
        }

        this.data = JSON.parse(data);
    };

    /**
     * Intance method that get the Account's container as a Javascript object
     *
     * @return {object}
     */
    getContainer() {
        const container = {};

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
    getStringContainer() {
        return JSON.stringify(this.getContainer());
    };
}
