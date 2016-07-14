var assert = require("assert"),
    Ambisafe = require('../src/index'),
    sinon = require('sinon');

describe('Ambisafe', function () {
    describe('#generateAccount()', function () {
        it('generate account', function () {
            Ambisafe.generateRandomValue = sinon.stub().returns('ff55e03b11dc43adf839c3aee3632b36');
            Ambisafe.generateKeyPair = sinon.stub().returns({
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
        });
    });
    describe('#deriveKey()', function () {
        it('derive key', function () {
            var password = 'test',
                salt = 'ca20faef-ac3f-40a6-99c0-500855c03207';
            assert.equal(Ambisafe.deriveKey(password, salt),
                '58c91a89a2329e2b5ea3c1b115f15f2cad011af505ed4a7c7439c18bcda119b7');
        });
    });
    describe('#fromPrivateKey', function () {
        it('create account from private key', function () {
            Ambisafe.generateRandomValue = sinon.stub().returns('ff55e03b11dc43adf839c3aee3632b36');
            var account = Ambisafe.fromPrivateKey('8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd', 'test', 'ca20faef-ac3f-40a6-99c0-500855c03207');
            assert.deepEqual(account.getContainer(), {
                public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
                data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
                salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
                iv: "ff55e03b11dc43adf839c3aee3632b36"
            });
        });
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

    it('change password', function () {
        account = new Ambisafe.Account(container, password);
        account.setNewPassword('new');
        account = new Ambisafe.Account(account.getContainer(), 'new');
        assert.equal(account.get('public_key'), '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        assert.equal(account.get('private_key'), '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        assert.equal(account.get('salt'), 'ca20faef-ac3f-40a6-99c0-500855c03207');
        assert.equal(account.get('iv'), 'ff55e03b11dc43adf839c3aee3632b36');
    });
});
