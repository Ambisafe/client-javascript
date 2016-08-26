'use strict';
import Web3 from 'web3';

var web3;

/**
 * Defines the Ethereum constructor.
 */
var Ethereum = function (url) {
    url = url || "http://localhost:8545";
    if (typeof web3 !== 'undefined') {
        this.web3 = new Web3(web3.currentProvider);
    } else {
        // set the provider you want from Web3.providers
        this.web3 = new Web3(new Web3.providers.HttpProvider(url));
    }
    return web3;
};

Ethereum.getWeb3 = function () {
    return this.web3;
};

/**
 * exports the created Ethereum object.
 */
var exports = module.exports = Ethereum;
