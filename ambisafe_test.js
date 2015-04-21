var Ambisafe = require('ambisafe')


// make it work
var account = new Ambisafe(accountId, password); // should load all containers and decrypt them
account.createTransaction(Ambisafe.Currency.Bitcoin, destination, amount);


// create account:
var accountData = Ambisafe.generateNewAccount(Ambisafe.Currency.Bitcoin)

