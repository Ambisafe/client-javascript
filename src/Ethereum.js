import Web3 from 'web3';

export default class Ethereum {

    constructor(url) {
        const _url = url || "http://localhost:8545";
        this.web3 = new Web3(new Web3.providers.HttpProvider(_url));
        this.url = _url;
    }
    
}
