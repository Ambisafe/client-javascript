'use strict';
import Tx from 'ethereumjs-tx';
import ethUtil from 'ethereumjs-util';
import Promise from 'bluebird';
import SmartContractClient from './smart-contract-client';


export default class ETokenClient extends SmartContractClient {
    static get abi() {
        return [{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_symbol","type":"bytes32"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_symbol","type":"bytes32"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"}],"name":"recover","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_symbol","type":"bytes32"}],"name":"name","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":false,"inputs":[{"name":"_symbol","type":"bytes32"},{"name":"_value","type":"uint256"},{"name":"_name","type":"bytes32"},{"name":"_description","type":"bytes32"},{"name":"_baseUnit","type":"uint8"},{"name":"_isReissuable","type":"bool"}],"name":"issueAsset","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_symbol","type":"bytes32"},{"name":"_value","type":"uint256"}],"name":"issue","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_symbol","type":"bytes32"}],"name":"totalSupply","outputs":[{"name":"supply","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_symbol","type":"bytes32"},{"name":"_value","type":"uint256"}],"name":"revoke","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_symbol","type":"bytes32"}],"name":"description","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"assetIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"assets","outputs":[{"name":"symbol","type":"bytes32"},{"name":"baseUnit","type":"uint8"},{"name":"name","type":"bytes32"},{"name":"description","type":"bytes32"},{"name":"isReissuable","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"symbol","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"status","type":"uint256"}],"name":"OperationFailed","type":"event"}];
    }

    get contract() {
        if (!this._contract) {
            this._contract = this.web3.eth.contract(ETokenClient.abi).at(this.contractAddress);
        }
        return this._contract;
    }

    issueAsset(symbol, value, name, description, baseUnit, isReissuable) {
        let encodedData = this.contract.issueAsset.getData(symbol, value, name, description, baseUnit, isReissuable);
        return this.sendTransaction(encodedData);
    }

    totalSupply(symbol=this.currencySymbol) {
        let totalSupply = Promise.promisify(this.contract.totalSupply);
        return totalSupply(symbol);
    }

    balanceOf(address, symbol=this.currencySymbol) {
        let balanceOf = Promise.promisify(this.contract.balanceOf);
        return balanceOf(address, symbol);
    }

    transfer(to, value, symbol=this.currencySymbol) {
        let encodedData = this.contract.transfer.getData(to, value, symbol);
        return this.sendTransaction(encodedData);
    }
}