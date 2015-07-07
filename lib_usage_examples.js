var Ambisafe = require('ambisafe')



// usage examples (not implemented yet):

// EXAMPLE 1: create account & save:
// this supposed to happen after user have filled registration form and clicked submit
account = Ambisafe.generateAccount(salt, currency, password)
container = account.toString() // Returns JSON as single string. Resulting object should be transmitted to server & passed to server side SDK
jQuery.find('#walletContainer').val(container) // setting value to hidden input
// the rest is done on server side. We don't need username and other details here.


// EXAMPLE 2: sign in & create transaction

// container with account json should be fetched from a server after successful login.
// The most optimal way to fetch it depends client application and therefore delegated to it

// 1. decrypting account with private key
// container json as it returned by Server + password, entered during authentication. Password should never be transmitted to server
// Exception can be thrown here if password is incorrect
account = new Ambisafe.Account(containerJsonAsString, password)


// 2. constructing transaction & validating against business logic rules
// like with account, creation and validation of transaction is out of scope of this library
// 3. signing transaction with customer key
signedTransactionHex = account.signTransaction(currency, unsignedTransactionHex);
// 4. signed hex should be submitted to server for co-signing and broadcasting


// EXAMPLE 3: change password (different from recovery because old user container decryption key is still known)
account = new Ambisafe.Account(containerJsonAsString, password)
account.setNewPassword(new_encryption_key)
container = account.toString() // Returns JSON as single string. Resulting object should be transmitted to server & passed to server side SDK
jQuery.find('#walletContainer').val(container) // setting value to hidden input


