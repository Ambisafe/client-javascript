
function Ambisafe (accountId, password) {
    if (!(this instanceof Ambisafe)) return new Ambisafe()
}

Ambisafe.Container = function (role, publicKey, data) {
    if (!(this instanceof Container)) return new Container()
}

Ambisafe.Account = function () { // should extend Container
    if (!(this instanceof Account)) return new Account()
}

Ambisafe.Transaction = function () {
    if (!(this instanceof Transaction)) return new Transaction()
}

Ambisafe.KeyPair = function () {
    if (!(this instanceof KeyPair)) return new KeyPair()
}


Ambisafe.sendTransaction = function (currency, destination, amount) {
    var txHex = this.buildTransaction(currency, destination, amount);
    var signedTxHex = this.currentAccount.signTransaction(txHex);
    this.apiPost("transactions/submit/" + this.currentAccount.id + "/" + currency);
}

Ambisafe.apiGet = function(url, callback) {

}

Ambisafe.apiPost = function(url, callback) {

}

Ambisafe.apiPut = function(url, callback) {

}


/**
 *
 * @param raw transaction hex
 * @returns signed transaction hex
 */
Ambisafe.Account.prototype.signTransaction = function(hex) {
}

/**
 * @returns base64 encoded transaction, ready to be sent to server
 */
Ambisafe.Transaction.prototype.toBase64 = function() {

}

/**
 * @returns base64 encoded container, ready to be sent to server
 */
Ambisafe.Container.prototype.toBase64 = function() {

}

/**
 * @returns Ambisafe.Container
 */
Ambisafe.containerFromBase64 = function(base64string) {

}


/**
 *
 * @param currency
 * @param password
 * @returns Ambisafe.Account
 */
Ambisafe.generateNewAccount = function (currency, password) {

}



module.exports = Ambisafe

