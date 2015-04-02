var CoinKey = require('coinkey') //1.3.0

var ck = new CoinKey.createRandom()

// make it work
var wallet = new Ambisafe(accountId, password);
wallet.createTransaction(Ambisafe.CURRENCY.Bitcoin, destination, amount);

console.log("Private Key (Wallet Import Format): " + ck.privateWif)
console.log("Private Key (Hex): " + ck.privateKey.toString('hex'))
console.log("Address: " + ck.publicAddress)