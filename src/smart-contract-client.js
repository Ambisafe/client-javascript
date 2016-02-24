'use strict';
import Tx from 'ethereumjs-tx';
import ethUtil from 'ethereumjs-util';
import Promise from 'bluebird';


export default class SmartContractClient {
    constructor(contractAddress, privateKey=undefined) {
        this.contractAddress = contractAddress;
        this.privateKey = privateKey;
        this.gasLimit = 350000;
        this.gasPrice = '50000000000';
    }

    set privateKey(privateKey) {
        if (privateKey) {
            privateKey = new Buffer(privateKey, 'hex');
        }
        this._privateKey = privateKey;
    }

    get privateKey() {
        if (!this._privateKey) {
            throw 'You must set privateKey first';
        }
        return this._privateKey;
    }

    set gasLimit(gasLimit) {
        this._gasLimit = gasLimit;
    }

    get gasLimit() {
        return this._gasLimit;
    }

    set gasPrice(gasPrice) {
        this._gasPrice = gasPrice;
    }

    get gasPrice() {
        return this._gasPrice;
    }

    set web3(web3) {
        this._web3 = web3;
    }

    get web3() {
        if (!this._web3) {
            throw 'You must set web3 first!';
        }
        return this._web3;
    }

    set currencySymbol(symbol) {
        this._symbol = symbol;
    }

    get currencySymbol() {
        if (!this._symbol) {
            throw 'You must set symbol first';
        }
        return this._symbol;
    }

    get signerAddress() {
        return '0x' + new Buffer(ethUtil.privateToAddress(this.privateKey)).toString('hex');
    }

    getNonce() {
        let getTransactionCount = Promise.promisify(this.web3.eth.getTransactionCount);
        return getTransactionCount(this.signerAddress, 'pending');
    }

    sendTransaction(data) {
        let contract = this.contract;
        let web3 = this.web3;
        return this.getNonce().then(nonce => {
            let rawTx = {
                nonce: nonce,
                gasPrice: web3.toHex(this.gasPrice),
                gasLimit: web3.toHex(this.gasLimit),
                gas: web3.toHex(this.gas),
                to: this.contractAddress,
                value: '0x0',
                data: data
            };
            let tx = new Tx(rawTx);
            tx.sign(this.privateKey);

            let serializedTx = tx.serialize();
            let sendTransaction = Promise.promisify(web3.eth.sendRawTransaction);
            return sendTransaction(serializedTx.toString('hex'));
        });
    }
}