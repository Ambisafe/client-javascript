const Ambisafe = require('../src/index');
const bitcoin = require('bitcoinjs-lib');
// const BigInteger = require('bigi');

describe('Ambisafe', function () {
    it('should not cut leading zeroes from private key', function () {
        var d = Buffer.from('8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd', 'hex');
        bitcoin.ECPair.makeRandom = jest.fn().mockReturnValueOnce(bitcoin.ECPair.fromPrivateKey(d));
        expect(Ambisafe.generateKeyPair()).toMatchObject({
            private_key: "8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd",
            public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e"
        });
    });

    it('generate account', function () {
        Ambisafe.generateRandomValue = jest.fn().mockReturnValueOnce('ff55e03b11dc43adf839c3aee3632b36');
        Ambisafe.generateKeyPair = jest.fn().mockReturnValueOnce({
            private_key: '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd',
            public_key: '034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e'
        });
        const password = 'test';
        const salt = 'ca20faef-ac3f-40a6-99c0-500855c03207';
        const account = Ambisafe.generateAccount(Ambisafe.currency.BITCOIN, password, salt);

        expect(account.getContainer()).toMatchObject({
            public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
            data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
            salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
            iv: "ff55e03b11dc43adf839c3aee3632b36"
        });
    });

    it('derive key', function () {
        const password = 'test';
        const salt = 'ca20faef-ac3f-40a6-99c0-500855c03207';
        expect(Ambisafe.deriveKey(password, salt)).toBe(
            '58c91a89a2329e2b5ea3c1b115f15f2cad011af505ed4a7c7439c18bcda119b7'
        );
    });

    it('create account from private key', function () {
        Ambisafe.generateRandomValue = jest.fn().mockReturnValueOnce('ff55e03b11dc43adf839c3aee3632b36');
        const account = Ambisafe.fromPrivateKey(
            '8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd',
            'test',
            'ca20faef-ac3f-40a6-99c0-500855c03207'
        );
        expect(account.getContainer()).toMatchObject({
            public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
            data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
            salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
            iv: "ff55e03b11dc43adf839c3aee3632b36"
        });
    });
});

describe('Ambisafe.Account', function () {
    const container = {
        public_key: "034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e",
        data: "a0b0cbf2c2697f5141041da8a012149dc4cd82df6f43be8cfc58342ba8e663722178509b667217f2c990ec24ffaeb2ed",
        salt: "ca20faef-ac3f-40a6-99c0-500855c03207",
        iv: "ff55e03b11dc43adf839c3aee3632b36"
    };
    const password = 'test';
    let account;

    it('create Account instance', function () {
        account = new Ambisafe.Account(container, password);
        expect(account.get('public_key')).toBe('034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        expect(account.get('private_key')).toBe('8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        expect(account.get('salt')).toBe('ca20faef-ac3f-40a6-99c0-500855c03207');
        expect(account.get('iv')).toBe('ff55e03b11dc43adf839c3aee3632b36');
    });

    it('change password', function () {
        Ambisafe.generateRandomValue = jest.fn().mockReturnValueOnce('ff55e03b11dc43adf839c3aee3632b36');
        account = new Ambisafe.Account(container, password);
        account.setNewPassword('new');
        account = new Ambisafe.Account(account.getContainer(), 'new');
        expect(account.get('public_key')).toBe('034a94cacac4327feb793047c514b256b326c3c474d73c861407a8709f9901039e');
        expect(account.get('private_key')).toBe('8a3167b6032285a9fd89fcf9110d51ce1cffaf0eb21bc316560d0e510ebac7cd');
        expect(account.get('salt')).toBe('ca20faef-ac3f-40a6-99c0-500855c03207');
        expect(account.get('iv')).toBe('ff55e03b11dc43adf839c3aee3632b36');
    });
});
