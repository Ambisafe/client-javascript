
import assert from "assert";
import AmbiClient from '../src';

describe('AmbiClient.Ambisafe', function () {
    describe('#generateAccount()', function () {
        it('generate account', function () {
            const password = 'test';
            const salt = 'ca20faef-ac3f-40a6-99c0-500855c03207';
            let account = AmbiClient.Ambisafe.generateAccount(password, salt);
            assert.equal(true, new RegExp("^[a-z0-9]{66}$").test(account.get('public_key')));
            assert.equal(true, new RegExp("^[a-z0-9]{64}$").test(account.get('private_key')));
            assert.equal(true, new RegExp("^[a-z0-9]{32}$").test(account.get('iv')));
            assert.equal('ca20faef-ac3f-40a6-99c0-500855c03207', account.get('salt'));
            console.log('Account generated: ', account.getContainer());
        });
    });
    describe('#deriveKey()', function () {
        it('derive key', function () {
            const password = 'test';
            const salt = 'ca20faef-ac3f-40a6-99c0-500855c03207';
            assert.equal(AmbiClient.Ambisafe.deriveKey(password, salt),
                '58c91a89a2329e2b5ea3c1b115f15f2cad011af505ed4a7c7439c18bcda119b7');
        });
    });
    describe('#fromPrivateKey', function () {
        it('create account from private key', function () {
            let account = AmbiClient.Ambisafe.fromPrivateKey('8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd', 'test', 'ca20faef-ac3f-40a6-99c0-500855c03207');
            assert.equal("034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e", account.get('public_key'));
            assert.equal(true, new RegExp("^[a-z0-9]{64}$").test(account.get('private_key')));
            assert.equal(true, new RegExp("^[a-z0-9]{32}$").test(account.get('iv')));
            assert.equal('ca20faef-ac3f-40a6-99c0-500855c03207', account.get('salt'));
        });
    });

});

describe('AmbiClient.Account', function () {
    const container = {
        public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
        data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
        salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
        iv: "ff55e03b11dc43adf839c3aee3632b36"
    };
    const password = 'test';
    let account;

    it('create Account instance', function () {
        account = new AmbiClient.Account(container, password);
        assert.equal(account.get('public_key'), '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        assert.equal(account.get('private_key'), '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        assert.equal(account.get('salt'), 'ca20faef-ac3f-40a6-99c0-500855c03207');
        assert.equal(account.get('iv'), 'ff55e03b11dc43adf839c3aee3632b36');
    });

    it('change password', function () {
        account = new AmbiClient.Account(container, password);
        account.setNewPassword('new');
        account = new AmbiClient.Account(account.getContainer(), 'new');
        assert.equal(account.get('public_key'), '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        assert.equal(account.get('private_key'), '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        assert.equal(account.get('salt'), 'ca20faef-ac3f-40a6-99c0-500855c03207');
        assert.equal(true, new RegExp("^[a-z0-9]{32}$").test(account.get('iv')));
    });
});

describe('AmbiClient.Random', function () {
    let randomGen;

    it('should create Random instance', function (done) {
        randomGen = new AmbiClient.Random(function(){
            assert.equal(true, (randomGen.getProgress() >= 1));
            done();
        });
    });

    it('should create random 32 bytes hex string', function () {
        const randomHex = randomGen.randomBytes(32).toString('hex');
        console.log('Random: '+randomHex);
        assert.equal(randomHex.length, 64);
    });

    it('generate account using client random gen', function () {
        const password = 'testPassword';
        const salt = 'c7dd0279-b2f8-41df-b87c-8af082eec7cb';
        let account  = AmbiClient.Ambisafe.setRandom(randomGen).generateAccount(password);
        assert.equal(typeof account.getContainer(), 'object');
        console.log('Account generated with client random gen: ', account.getContainer());
    });

});
