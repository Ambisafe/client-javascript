
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





Ambisafe.Container.toBase64 = function() {

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

/**
 * @returns base64 encoded string
 */
Ambisafe.Container.serialize = function() {

}


module.exports = Ambisafe

