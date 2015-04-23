#!/usr/bin/env node

var CoinKey = require('coinkey')
var Script = require('btc-script')
var ecdsa = require('ecdsa')
var path = require('path')
var Transaction = require('btc-transaction').Transaction
var TransactionIn = require('btc-transaction').TransactionIn
var opcodes = require('btc-opcode')
var convBin = require('binstring')


var privateKeyHex = '7bb7ecaa16a68d22646455d50593129f869fe769a2b4b9a7f0b84c84fa0fd613'

var key = new CoinKey(new Buffer(privateKeyHex, 'hex'))
console.log("WIF key: " + key.privateWif)

//var tx = Transaction.deserialize(new Buffer('01000000012b892ad0b660025af2381a0e1d892426e5892e892e595db7ce2a54f37bfbe8a601000000b3000000004cad532103832abbe9737befa67ea259fe06541c2585ba29462bc86f4fc67ac8235600984a2103dd0cc537865c5f04eadd58812b63a2fcf39fcb8158673ef794608af57ebd58c721029db58dbf054452422f0b51d68f93b8ff4160f2f7a44edc2a7f3103ec3d872e222103fc035bc6f1336c82ac1cb6d6928f3d21cf3c0610f577551b8d565a001297ab4b2102d89857b54f59b58726560c6de7db15c787fbd2b2bb0c0b615351366de96b917155aeffffffff04ac02000000000000475121030c28fe5f18c699a30b62b7d67de92b7493658f2bab2a1806fbf5f0ea7f28e8db21023246bc0ea437c8e1ff4839efd9d6bf57820343b89dba8c7d520a318fdaf0692252ae22020000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac22020000000000001976a9149e0070a1aaa842e95f5fb4639d26802526c6304a88ac381c00000000000017a91469c714cd1c9bfb9c11d042e251ba25b40ece28078700000000', 'hex'))
var tx = Transaction.deserialize(new Buffer('01000000019c1c878eff34fb9262a02b8490fd0efb59bbd8b083170dc24ff10e99c742ffda03000000b3000000004cad532103832abbe9737befa67ea259fe06541c2585ba29462bc86f4fc67ac8235600984a2103dd0cc537865c5f04eadd58812b63a2fcf39fcb8158673ef794608af57ebd58c721029db58dbf054452422f0b51d68f93b8ff4160f2f7a44edc2a7f3103ec3d872e222102d89857b54f59b58726560c6de7db15c787fbd2b2bb0c0b615351366de96b91712103fc035bc6f1336c82ac1cb6d6928f3d21cf3c0610f577551b8d565a001297ab4b55aeffffffff04ac02000000000000475121030c28fe5f18c699a30b62b7d67de92b7493658f2bab2a1806fbf5f0ea7f28e8db21022ac1c2aa5600b2e8e68126945bf9ac83aa663357c8018fdea271a4886e2e2b6852ae22020000000000001976a914946cb2e08075bcbaf157e47bcb67eb2b2339d24288ac22020000000000001976a9149e0070a1aaa842e95f5fb4639d26802526c6304a88ac601100000000000017a9146d73e76d90cfdf438f6b394fb6ff8f08b6bf2d198700000000', 'hex'))
tx.ins.forEach(function(input, index) {
    signInput(tx, index, key)
})

var hex = convBin(tx.serialize(), { in : 'bytes', out: 'hex'})
console.log(hex)



function signInput(tx, index, keyPair) {

    var hash = tx.hashTransactionForSignature(tx.ins[index].script, index, Transaction.SIGHASH_ALL)
    var signature = ecdsa.serializeSig(ecdsa.sign(new Buffer(hash), keyPair.privateKey))
    signature.push(Transaction.SIGHASH_ALL) // ?

    //console.log("signature: %j", signature)
    //console.log("tx.ins[index]: %j", tx.ins[index])
    tx.ins[index].script = Script.fromChunks([signature, tx.ins[index].script.buffer])
}


