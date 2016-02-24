'use strict';
import Web3 from 'web3';

var web3;

export function getWeb3(url) {
    url = url || "http://localhost:8545";
    if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
    } else {
        // set the provider you want from Web3.providers
        web3 = new Web3(new Web3.providers.HttpProvider(url));
    }
    return web3;
}