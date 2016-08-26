'use strict';

import assert from "assert";
import AmbiClient from '../src';
import sinon from 'sinon';

console.log(AmbiClient);

describe('Ambisafe', function () {
    describe('#generateAccount()', function () {
        it('generate account', function () {
            AmbiClient.Ambisafe.generateRandomValue = sinon.stub().returns('ff55e03b11dc43adf839c3aee3632b36');
            AmbiClient.Ambisafe.generateKeyPair = sinon.stub().returns({
                private_key: '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd',
                public_key: '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e'
            });
            var password = 'test',
                salt = 'ca20faef-ac3f-40a6-99c0-500855c03207',
                account = AmbiClient.Ambisafe.generateAccount(AmbiClient.Ambisafe.currency.BITCOIN, password, salt);
            assert.deepEqual(account.getContainer(), {
                public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
                data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
                salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
                iv: "ff55e03b11dc43adf839c3aee3632b36"
            });
        });
    });
    describe('#deriveKey()', function () {
        it('derive key', function () {
            var password = 'test',
                salt = 'ca20faef-ac3f-40a6-99c0-500855c03207';
            assert.equal(AmbiClient.Ambisafe.deriveKey(password, salt),
                '58c91a89a2329e2b5ea3c1b115f15f2cad011af505ed4a7c7439c18bcda119b7');
        });
    });
    describe('#fromPrivateKey', function () {
        it('create account from private key', function () {
            AmbiClient.Ambisafe.generateRandomValue = sinon.stub().returns('ff55e03b11dc43adf839c3aee3632b36');
            var account = AmbiClient.Ambisafe.fromPrivateKey('8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd', 'test', 'ca20faef-ac3f-40a6-99c0-500855c03207');
            assert.deepEqual(account.getContainer(), {
                public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
                data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
                salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
                iv: "ff55e03b11dc43adf839c3aee3632b36"
            });
        });
    });

});

describe('AmbiClient.Ambisafe.Account', function () {
    var container = {
            public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
            data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
            salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
            iv: "ff55e03b11dc43adf839c3aee3632b36"
        },
        password = 'test',
        account;

    it('create Account instance', function () {
        account = new AmbiClient.Ambisafe.Account(container, password);
        assert.equal(account.get('public_key'), '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        assert.equal(account.get('private_key'), '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        assert.equal(account.get('salt'), 'ca20faef-ac3f-40a6-99c0-500855c03207');
        assert.equal(account.get('iv'), 'ff55e03b11dc43adf839c3aee3632b36');
    });

    it('change password', function () {
        account = new AmbiClient.Ambisafe.Account(container, password);
        account.setNewPassword('new');
        account = new AmbiClient.Ambisafe.Account(account.getContainer(), 'new');
        assert.equal(account.get('public_key'), '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        assert.equal(account.get('private_key'), '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        assert.equal(account.get('salt'), 'ca20faef-ac3f-40a6-99c0-500855c03207');
        assert.equal(account.get('iv'), 'ff55e03b11dc43adf839c3aee3632b36');
    });
});

describe('Ambisafe.ethereum', function () {
    it('should create web3 instance', function () {
        let EthereumClient = new AmbiClient.Ethereum();
        let web3 = EthereumClient.web3;
        assert.equal(typeof web3, 'object');
    });
});

/*

import ETokenClient from '../src/e-token-client';

describe('Ambisafe.e-token-client', function () {
    let at = '0xac9d1b54e446a64e19cf4adffbc1948dc2ab8f0c',
        abi = [{
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}, {"name": "_symbol", "type": "bytes32"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
        }, {
            "constant": false,
            "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}, {
                "name": "_symbol",
                "type": "bytes32"
            }],
            "name": "transfer",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        }, {
            "constant": false,
            "inputs": [{"name": "_from", "type": "address"}, {"name": "_to", "type": "address"}],
            "name": "recover",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        }, {
            "constant": true,
            "inputs": [{"name": "_symbol", "type": "bytes32"}],
            "name": "name",
            "outputs": [{"name": "", "type": "bytes32"}],
            "type": "function"
        }, {
            "constant": false,
            "inputs": [{"name": "_symbol", "type": "bytes32"}, {"name": "_value", "type": "uint256"}, {
                "name": "_name",
                "type": "bytes32"
            }, {"name": "_description", "type": "bytes32"}, {
                "name": "_baseUnit",
                "type": "uint8"
            }, {"name": "_isReissuable", "type": "bool"}],
            "name": "issueAsset",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        }, {
            "constant": false,
            "inputs": [{"name": "_symbol", "type": "bytes32"}, {"name": "_value", "type": "uint256"}],
            "name": "issue",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        }, {
            "constant": true,
            "inputs": [{"name": "_symbol", "type": "bytes32"}],
            "name": "totalSupply",
            "outputs": [{"name": "supply", "type": "uint256"}],
            "type": "function"
        }, {
            "constant": false,
            "inputs": [{"name": "_symbol", "type": "bytes32"}, {"name": "_value", "type": "uint256"}],
            "name": "revoke",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        }, {
            "constant": true,
            "inputs": [{"name": "_symbol", "type": "bytes32"}],
            "name": "description",
            "outputs": [{"name": "", "type": "bytes32"}],
            "type": "function"
        }, {
            "constant": true,
            "inputs": [{"name": "", "type": "bytes32"}],
            "name": "assetIndex",
            "outputs": [{"name": "", "type": "uint256"}],
            "type": "function"
        }, {
            "constant": true,
            "inputs": [{"name": "", "type": "uint256"}],
            "name": "assets",
            "outputs": [{"name": "symbol", "type": "bytes32"}, {"name": "baseUnit", "type": "uint8"}, {
                "name": "name",
                "type": "bytes32"
            }, {"name": "description", "type": "bytes32"}, {"name": "isReissuable", "type": "bool"}],
            "type": "function"
        }, {"inputs": [], "type": "constructor"}, {
            "anonymous": false,
            "inputs": [{"indexed": true, "name": "from", "type": "address"}, {
                "indexed": true,
                "name": "to",
                "type": "address"
            }, {"indexed": true, "name": "symbol", "type": "bytes32"}, {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }],
            "name": "Transfer",
            "type": "event"
        }, {
            "anonymous": false,
            "inputs": [{"indexed": false, "name": "status", "type": "uint256"}],
            "name": "OperationFailed",
            "type": "event"
        }],
        web3 = Ambisafe.ethereum.getWeb3(),
        client = new ETokenClient(at, 'c459603474e561b5cb54b8fdf2e65913c621c2473cf650c92c9daa97a830400e');
    client.web3 = web3;

    it('should issue token', function (done) {
        return client.issueAsset("ANT44", 100, "ToxaCoin", "comment", 1, true)
            .then(hash => {
                console.log(hash);
                done();
            });
    });

    it('should show total supply', function (done) {
        return client.totalSupply("ANT44").then(totalSupply => {
            assert.equal(totalSupply, 100);
            done();
        });
    });

    it('should return balance of creator', function (done) {
        client.currencySymbol = 'ANT44';
        return client.balanceOf(client.signerAddress)
            .then(balance => {
                assert.equal(balance, 100);
                done();
            });
    });

    it('should transfer coins', function (done) {
        client.currencySymbol = 'ANT44';
        return client.transfer('0xd94440b42e32a98da08dba34884e8c35485ba551', 1)
            .then(hash => {
                console.log(hash);
                done();
            });
    });
});

*/
