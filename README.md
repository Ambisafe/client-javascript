# Ambisafe Javascript Lib (ambisafe-lib)
Javascript library used by Ambisafe.co for general purposes.

## Installation

```
npm install -g browserify
npm install -g uglifyjs
npm install -g jshint

npm install
```

## Library Generation
`browserify app.js | uglifyjs > ambisafe.min.js`

## Examples
##### Example 1: create account & save
This supposed to happen after user have filled registration form and clicked submit:

* Create an account with the `Ambisafe.generateAccount` function. 
	* The **currency** value has to be selected from the `Ambisafe.currency` object (eg: `Ambisafe.currency.BITCOIN`)
	* The **password** value is required.
	* The **salt** value is not required.

	Example: 
	```
	account = Ambisafe.generateAccount(
				currency, 
				password, 
				salt);
	```
* To convert the **account** attributes to a JSON string, execute the following line: `accountSerialized = account.toString();`
* The rest is done on server side. We don't need username and other details here.


##### Example 2: sign in & create transaction
Container with account JSON should be fetched from a server after successful login.The most optimal way to fetch it depends client application and therefore delegated to it.

* Decrypting account with private key: account json as it returned by **Server + password**, entered during authentication. Password should **never** be transmitted to server. Exception can be thrown here if password is incorrect.
	```
	account = new Ambisafe.Account(
				containerJson, 
				password
	);
	```
* Constructing transaction & validating against business logic rules like with account, creation and validation of transaction is out of scope of this library.
* Signing transaction with customer key:
	```
	signedTransaction = Ambisafe.signTransaction(
				transaction, 
				privateKey);
	```
* Signed transaction should be submitted to server for co-signing and broadcasting.

##### Example 3: change password
To change the password of a created account the user has to call to the `setNewPassword` function:

* Based on a created account: 
	```
	account = new Ambisafe.Account(
				containerJson, 
				password);
	```
* Call the **setNewPassword** function with the **newEncryptionKey** attribute: 
	```
	account.setNewPassword(newEncryptionKey);
	```

## License

See LICENSE
