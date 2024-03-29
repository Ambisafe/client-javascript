var assert = require("assert"),
    Ambisafe = require('../src/index'),
    bitcoin = require('bitcoinjs-lib'),
    sinon = require('sinon');

describe('Ambisafe', function () {
    describe('#generateAccount()', function () {
        it('generate account', sinon.test(function () {
            this.stub(Ambisafe, 'generateRandomValue').returns('ff55e03b11dc43adf839c3aee3632b36');
            this.stub(Ambisafe, 'generateKeyPair').returns({
                private_key: '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd',
                public_key: '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e'
            });
            var password = 'test',
                salt = 'ca20faef-ac3f-40a6-99c0-500855c03207',
                account = Ambisafe.generateAccount(Ambisafe.currency.BITCOIN, password, salt);
            assert.deepEqual(account.getContainer(), {
                public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
                data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
                salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
                iv: "ff55e03b11dc43adf839c3aee3632b36"
            });
        }));
    });
    describe('#deriveKey()', function () {
        it('derive key', function () {
            var password = 'test',
                salt = 'ca20faef-ac3f-40a6-99c0-500855c03207';
            assert.equal(Ambisafe.deriveKey(password, salt),
                '58c91a89a2329e2b5ea3c1b115f15f2cad011af505ed4a7c7439c18bcda119b7');
        });
    });
    describe('#fromPrivateKey()', function () {
        it('create account from private key', sinon.test(function () {
            this.stub(Ambisafe, 'generateRandomValue').returns('ff55e03b11dc43adf839c3aee3632b36');
            var account = Ambisafe.fromPrivateKey(
                '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd',
                'test',
                'ca20faef-ac3f-40a6-99c0-500855c03207'
            );
            assert.deepEqual(account.getContainer(), {
                public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
                data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
                salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
                iv: "ff55e03b11dc43adf839c3aee3632b36"
            });
        }));
    });
    describe('#generateKeyPair()', function () {
        it('should not cut leading zeroes from private key', sinon.test(function () {
            var d = Buffer.from('00e1ba4622d55086e1741ecb3cd87a96349c73402752eb7d09964c5f38c8f107', 'hex');
            this.stub(bitcoin.ECPair, 'makeRandom').returns(bitcoin.ECPair.fromPrivateKey(d));
            assert.deepEqual(Ambisafe.generateKeyPair(), {
                public_key: "0354eb9796cbfdc6d068b001ea58d4679709b0895ce0b9b24c61a33f9bca696bfe",
                private_key: "00e1ba4622d55086e1741ecb3cd87a96349c73402752eb7d09964c5f38c8f107"
            });
        }));
    });
});

describe('Ambisafe.Account', function () {
    var container = {
            public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
            data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
            salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
            iv: "ff55e03b11dc43adf839c3aee3632b36"
        },
        password = 'test',
        account;

    it('create Account instance', function () {
        account = new Ambisafe.Account(container, password);
        assert.equal(account.get('public_key'), '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        assert.equal(account.get('private_key'), '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        assert.equal(account.get('salt'), 'ca20faef-ac3f-40a6-99c0-500855c03207');
        assert.equal(account.get('iv'), 'ff55e03b11dc43adf839c3aee3632b36');
    });

    it('change password', sinon.test(function () {
        this.stub(Ambisafe, 'generateRandomValue').returns('ff55e03b11dc43adf839c3aee3632b36');
        account = new Ambisafe.Account(container, password);
        account.setNewPassword('new');
        account = new Ambisafe.Account(account.getContainer(), 'new');
        assert.equal(account.get('public_key'), '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        assert.equal(account.get('private_key'), '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        assert.equal(account.get('salt'), 'ca20faef-ac3f-40a6-99c0-500855c03207');
        assert.equal(account.get('iv'), 'ff55e03b11dc43adf839c3aee3632b36');
    }));
});
