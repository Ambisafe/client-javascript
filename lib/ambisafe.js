var Ambisafe = {
    currencies: {}
};

Ambisafe.Container = function (serializedContainer) {
    if (!(this instanceof Container)) return new Container()
}

Ambisafe.Account = function (serializedContainer, password) { // should extend Container
    if (!(this instanceof Account)) return new Account()
}


/**
 *
 * @param raw transaction hex
 * @returns signed transaction hex
 */
Ambisafe.Account.prototype.signTransaction = function(currency, unsignedTransactionHex)) {
    // BitcoinJS hardcore comes here
}


/**
 *
 * @param currency
 * @param password
 * @returns Ambisafe.Account
 */
Ambisafe.generateNewAccount = function (salt, currency, password) {

}

module.exports = Ambisafe

