var Ambisafe =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Ambisafe = __webpack_require__(1);

	__webpack_require__(115);
	__webpack_require__(116);

	module.exports = Ambisafe;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/**
	 * Copyright (c) 2015 Ambisafe Inc.
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including the rights to use, copy, modify,
	 * merge, publish, distribute, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	/**
	 * @file ambisafe.js
	 * Ambisafe class used to define the functions of the library
	 * @author Charlie Fontana <charlie@ambisafe.co>
	 * @date 07/13/2015
	 */
	'use strict';
	/**
	 * This section defines the required libraries
	 */

	var bitcoin = __webpack_require__(6),
	    crypto = __webpack_require__(84),
	    BigInteger = __webpack_require__(61),
	    uuid4 = __webpack_require__(113),
	    utils = __webpack_require__(114);

	/**
	 * Defines the Ambisafe constructor.
	 */
	var Ambisafe = function Ambisafe() {};

	/**
	 * Defines the static constants
	 */
	Ambisafe.currency = {};
	Ambisafe.currency.BITCOIN = 'BTC';

	/**
	 * Static method that creates an account and save it.
	 * This supposed to happen after user have filled registration form and clicked submit.
	 *
	 * @param {string} currency as string
	 * @param {string} password as string
	 * @param {string} salt as string
	 * @return {Ambisafe.Account} return the generated account object
	 */
	Ambisafe.generateAccount = function (currency, password, salt) {
	    var account, key, keyPair, iv;

	    salt = salt || uuid4();

	    if (!password) {
	        throw Error('ERR: password are required');
	    }

	    key = Ambisafe.deriveKey(password, salt);

	    account = new Ambisafe.Account();
	    account.set('key', key);
	    account.set('salt', salt);

	    keyPair = Ambisafe.generateKeyPair();
	    account.set('private_key', keyPair.private_key);
	    account.set('public_key', keyPair.public_key);
	    iv = Ambisafe.generateRandomValue(16);
	    account.set('iv', iv);

	    account.set('data', Ambisafe.encrypt(new Buffer(account.get('private_key'), 'hex'), iv, key));

	    return account;
	};

	Ambisafe.fromPrivateKey = function (privateKey, password, salt) {
	    var iv, key, account;
	    salt = salt || uuid4();
	    key = Ambisafe.deriveKey(password, salt);
	    account = new Ambisafe.Account();
	    account.set('private_key', privateKey);
	    account.set('public_key', new bitcoin.ECKey(BigInteger.fromBuffer(new Buffer(privateKey, 'hex'))).pub.toHex());
	    iv = Ambisafe.generateRandomValue(16);
	    account.set('iv', iv);
	    account.set('salt', salt);
	    account.set('data', Ambisafe.encrypt(new Buffer(account.get('private_key'), 'hex'), iv, key));
	    return account;
	};

	Ambisafe.generateKeyPair = function () {
	    var eckey = bitcoin.ECKey.makeRandom(),
	        privateKey = utils.zpad(eckey.d.toHex(), 64),
	        publicKey = utils.zpad(eckey.pub.toHex(), 64);
	    return {
	        private_key: privateKey,
	        public_key: publicKey
	    };
	};

	/**
	 * Static method that signs a transaction.
	 *
	 * @param {object} tx unsigned transaction: {hex:'...', fee:'...', sighashes:['...', '...']}.
	 * @param {string} private_key.
	 * @return {object} signed transaction.
	 */
	Ambisafe.signTransaction = function (tx, private_key) {
	    var keyPair, sign, buffer, d;

	    if (!tx.sighashes || !(tx.sighashes instanceof Array)) {
	        console.log('ERR: The "sighashes" attribute is required.');
	        return;
	    }

	    tx.user_signatures = [];
	    buffer = new Buffer(private_key, 'hex');
	    d = BigInteger.fromBuffer(buffer);
	    keyPair = new bitcoin.ECKey(d, true);

	    tx.sighashes.forEach(function (sighash) {
	        sign = keyPair.sign(new Buffer(sighash, 'hex')).toDER().toString('hex');
	        tx.user_signatures.push(sign);
	    });

	    return tx;
	};

	/**
	 * Static method that generates random values
	 *
	 * @param {number} length An integer
	 * @return {string} return random value
	 */
	Ambisafe.generateRandomValue = function (length) {
	    var randomBytes;

	    if (!length) {
	        length = 256 / 16;
	    }

	    randomBytes = crypto.randomBytes(Math.ceil(length));
	    return randomBytes.toString('hex');
	};

	/**
	 * Static method that derives a key from a password
	 *
	 * @param {string} password
	 * @param {string} salt
	 * @param {number} depth
	 * @return {string} key
	 */
	Ambisafe.deriveKey = function (password, salt, depth) {
	    var key;

	    if (!depth) {
	        depth = 1000;
	    }

	    key = crypto.pbkdf2Sync(password, salt, depth, 32, 'sha512');

	    return key.toString('hex');
	};

	/**
	 * Static method that encrypts an input based on the Advanced Encryption Standard (AES)
	 *
	 * @param {string} cleardata
	 * @param {string} iv
	 * @param {string} cryptkey
	 * @return {string} encrypted data
	 */
	Ambisafe.encrypt = function (cleardata, iv, cryptkey) {
	    var encipher, encryptData, encodeEncryptData, bufferCryptKey;

	    bufferCryptKey = new Buffer(cryptkey, 'hex');

	    encipher = crypto.createCipheriv('aes-256-cbc', bufferCryptKey, new Buffer(iv, 'hex'));
	    encryptData = encipher.update(cleardata, 'utf8', 'binary');

	    encryptData += encipher.final('binary');
	    encodeEncryptData = new Buffer(encryptData, 'binary').toString('hex');

	    return encodeEncryptData;
	};

	/**
	 * Static method that decrypts an input based on the Advanced Encryption Standard (AES)
	 *
	 * @param {string} encryptdata
	 * @param {string} iv
	 * @param {string} cryptkey
	 * @return {string} decrypted text
	 */
	Ambisafe.decrypt = function (encryptdata, iv, cryptkey) {
	    var decipher, decoded, bufferCryptKey;

	    bufferCryptKey = new Buffer(cryptkey, 'hex');

	    decipher = crypto.createDecipheriv('aes-256-cbc', bufferCryptKey, new Buffer(iv, 'hex'));
	    decoded = Buffer.concat([decipher.update(new Buffer(encryptdata, 'hex')), decipher.final()]);
	    return decoded;
	};

	/**
	 * Static method that gets the SHA1 hash of a string
	 *
	 * @param {string} input
	 * @return {string} SHA1 hash
	 */
	Ambisafe.SHA1 = function (input) {
	    var shasum = crypto.createHash('sha1');

	    shasum.update(input);

	    return shasum.digest('hex');
	};

	/**
	 * exports the created Ambisafe object.
	 */
	var _exports = module.exports = Ambisafe;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(3)
	var ieee754 = __webpack_require__(4)
	var isArray = __webpack_require__(5)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	/*
	 * Export kMaxLength after typed array support is determined.
	 */
	exports.kMaxLength = kMaxLength()

	function typedArraySupport () {
	  try {
	    var arr = new Uint8Array(1)
	    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
	    return arr.foo() === 42 && // typed array instances can be augmented
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length)
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer(length)
	    }
	    that.length = length
	  }

	  return that
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer (arg, encodingOrOffset, length) {
	  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
	    return new Buffer(arg, encodingOrOffset, length)
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from(this, arg, encodingOrOffset, length)
	}

	Buffer.poolSize = 8192 // not used by this implementation

	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer._augment = function (arr) {
	  arr.__proto__ = Buffer.prototype
	  return arr
	}

	function from (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }

	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }

	  return fromObject(that, value)
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(null, value, encodingOrOffset, length)
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	  if (typeof Symbol !== 'undefined' && Symbol.species &&
	      Buffer[Symbol.species] === Buffer) {
	    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
	    Object.defineProperty(Buffer, Symbol.species, {
	      value: null,
	      configurable: true
	    })
	  }
	}

	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}

	function alloc (that, size, fill, encoding) {
	  assertSize(size)
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	}

	function allocUnsafe (that, size) {
	  assertSize(size)
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	}
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8'
	  }

	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }

	  var length = byteLength(string, encoding) | 0
	  that = createBuffer(that, length)

	  var actual = that.write(string, encoding)

	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual)
	  }

	  return that
	}

	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0
	  that = createBuffer(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength // this throws if `array` is not a valid ArrayBuffer

	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }

	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array)
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset)
	  } else {
	    array = new Uint8Array(array, byteOffset, length)
	  }

	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array)
	  }
	  return that
	}

	function fromObject (that, obj) {
	  if (Buffer.isBuffer(obj)) {
	    var len = checked(obj.length) | 0
	    that = createBuffer(that, len)

	    if (that.length === 0) {
	      return that
	    }

	    obj.copy(that, 0, 0, len)
	    return that
	  }

	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }

	    if (obj.type === 'Buffer' && isArray(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
	    length = 0
	  }
	  return Buffer.alloc(+length)
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i]
	      y = b[i]
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length
	    }
	  }

	  var buffer = Buffer.allocUnsafe(length)
	  var pos = 0
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i]
	    if (!Buffer.isBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos)
	    pos += buf.length
	  }
	  return buffer
	}

	function byteLength (string, encoding) {
	  if (Buffer.isBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string
	  }

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }

	  if (end === undefined || end > this.length) {
	    end = this.length
	  }

	  if (end <= 0) {
	    return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0
	  start >>>= 0

	  if (end <= start) {
	    return ''
	  }

	  if (!encoding) encoding = 'utf8'

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer.prototype._isBuffer = true

	function swap (b, n, m) {
	  var i = b[n]
	  b[n] = b[m]
	  b[m] = i
	}

	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1)
	  }
	  return this
	}

	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3)
	    swap(this, i + 1, i + 2)
	  }
	  return this
	}

	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7)
	    swap(this, i + 1, i + 6)
	    swap(this, i + 2, i + 5)
	    swap(this, i + 3, i + 4)
	  }
	  return this
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!Buffer.isBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }

	  if (start === undefined) {
	    start = 0
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0
	  }
	  if (thisStart === undefined) {
	    thisStart = 0
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }

	  start >>>= 0
	  end >>>= 0
	  thisStart >>>= 0
	  thisEnd >>>= 0

	  if (this === target) return 0

	  var x = thisEnd - thisStart
	  var y = end - start
	  var len = Math.min(x, y)

	  var thisCopy = this.slice(thisStart, thisEnd)
	  var targetCopy = target.slice(start, end)

	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i]
	      y = targetCopy[i]
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset
	    byteOffset = 0
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000
	  }
	  byteOffset = +byteOffset  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1)
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0
	    else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding)
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (Buffer.isBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF // Search for a byte value [0-255]
	    if (Buffer.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1
	  var arrLength = arr.length
	  var valLength = val.length

	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase()
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2
	      arrLength /= 2
	      valLength /= 2
	      byteOffset /= 2
	    }
	  }

	  function read (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }

	  var i
	  if (dir) {
	    var foundIndex = -1
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex
	        foundIndex = -1
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true
	      for (var j = 0; j < valLength; j++) {
	        if (read(arr, i + j) !== read(val, j)) {
	          found = false
	          break
	        }
	      }
	      if (found) return i
	    }
	  }

	  return -1
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	}

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end)
	    newBuf.__proto__ = Buffer.prototype
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    )
	  }

	  return len
	}

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start
	      start = 0
	      end = this.length
	    } else if (typeof end === 'string') {
	      encoding = end
	      end = this.length
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0)
	      if (code < 256) {
	        val = code
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
	    return this
	  }

	  start = start >>> 0
	  end = end === undefined ? this.length : end >>> 0

	  if (!val) val = 0

	  var i
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val
	    }
	  } else {
	    var bytes = Buffer.isBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer(val, encoding).toString())
	    var len = bytes.length
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len]
	    }
	  }

	  return this
	}

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict'

	exports.byteLength = byteLength
	exports.toByteArray = toByteArray
	exports.fromByteArray = fromByteArray

	var lookup = []
	var revLookup = []
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i]
	  revLookup[code.charCodeAt(i)] = i
	}

	revLookup['-'.charCodeAt(0)] = 62
	revLookup['_'.charCodeAt(0)] = 63

	function placeHoldersCount (b64) {
	  var len = b64.length
	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
	}

	function byteLength (b64) {
	  // base64 is 4/3 + up to two characters of the original data
	  return b64.length * 3 / 4 - placeHoldersCount(b64)
	}

	function toByteArray (b64) {
	  var i, j, l, tmp, placeHolders, arr
	  var len = b64.length
	  placeHolders = placeHoldersCount(b64)

	  arr = new Arr(len * 3 / 4 - placeHolders)

	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len

	  var L = 0

	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
	    arr[L++] = (tmp >> 16) & 0xFF
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }

	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
	    arr[L++] = tmp & 0xFF
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp
	  var output = []
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
	    output.push(tripletToBase64(tmp))
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp
	  var len = uint8.length
	  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
	  var output = ''
	  var parts = []
	  var maxChunkLength = 16383 // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1]
	    output += lookup[tmp >> 2]
	    output += lookup[(tmp << 4) & 0x3F]
	    output += '=='
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
	    output += lookup[tmp >> 10]
	    output += lookup[(tmp >> 4) & 0x3F]
	    output += lookup[(tmp << 2) & 0x3F]
	    output += '='
	  }

	  parts.push(output)

	  return parts.join('')
	}


/***/ },
/* 4 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  Address: __webpack_require__(7),
	  base58check: __webpack_require__(73),
	  Block: __webpack_require__(74),
	  bufferutils: __webpack_require__(70),
	  crypto: __webpack_require__(71),
	  ecdsa: __webpack_require__(76),
	  ECKey: __webpack_require__(77),
	  ECPubKey: __webpack_require__(79),
	  ECSignature: __webpack_require__(68),
	  Message: __webpack_require__(80),
	  opcodes: __webpack_require__(58),
	  HDNode: __webpack_require__(81),
	  Script: __webpack_require__(69),
	  scripts: __webpack_require__(57),
	  Transaction: __webpack_require__(75),
	  TransactionBuilder: __webpack_require__(82),
	  networks: __webpack_require__(56),
	  Wallet: __webpack_require__(83)
	}


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var base58check = __webpack_require__(13)
	var typeForce = __webpack_require__(52)
	var networks = __webpack_require__(56)
	var scripts = __webpack_require__(57)

	function findScriptTypeByVersion (version) {
	  for (var networkName in networks) {
	    var network = networks[networkName]

	    if (version === network.pubKeyHash) return 'pubkeyhash'
	    if (version === network.scriptHash) return 'scripthash'
	  }
	}

	function Address (hash, version) {
	  typeForce('Buffer', hash)

	  assert.strictEqual(hash.length, 20, 'Invalid hash length')
	  assert.strictEqual(version & 0xff, version, 'Invalid version byte')

	  this.hash = hash
	  this.version = version
	}

	Address.fromBase58Check = function (string) {
	  var payload = base58check.decode(string)
	  var version = payload.readUInt8(0)
	  var hash = payload.slice(1)

	  return new Address(hash, version)
	}

	Address.fromOutputScript = function (script, network) {
	  network = network || networks.bitcoin

	  if (scripts.isPubKeyHashOutput(script)) return new Address(script.chunks[2], network.pubKeyHash)
	  if (scripts.isScriptHashOutput(script)) return new Address(script.chunks[1], network.scriptHash)

	  assert(false, script.toASM() + ' has no matching Address')
	}

	Address.prototype.toBase58Check = function () {
	  var payload = new Buffer(21)
	  payload.writeUInt8(this.version, 0)
	  this.hash.copy(payload, 1)

	  return base58check.encode(payload)
	}

	Address.prototype.toOutputScript = function () {
	  var scriptType = findScriptTypeByVersion(this.version)

	  if (scriptType === 'pubkeyhash') return scripts.pubKeyHashOutput(this.hash)
	  if (scriptType === 'scripthash') return scripts.scriptHashOutput(this.hash)

	  assert(false, this.toString() + ' has no matching Script')
	}

	Address.prototype.toString = Address.prototype.toBase58Check

	module.exports = Address

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';

	// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
	// original notice:

	/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	function compare(a, b) {
	  if (a === b) {
	    return 0;
	  }

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break;
	    }
	  }

	  if (x < y) {
	    return -1;
	  }
	  if (y < x) {
	    return 1;
	  }
	  return 0;
	}
	function isBuffer(b) {
	  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
	    return global.Buffer.isBuffer(b);
	  }
	  return !!(b != null && b._isBuffer);
	}

	// based on node assert, original notice:

	// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
	//
	// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
	//
	// Originally from narwhal.js (http://narwhaljs.org)
	// Copyright (c) 2009 Thomas Robinson <280north.com>
	//
	// Permission is hereby granted, free of charge, to any person obtaining a copy
	// of this software and associated documentation files (the 'Software'), to
	// deal in the Software without restriction, including without limitation the
	// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	// sell copies of the Software, and to permit persons to whom the Software is
	// furnished to do so, subject to the following conditions:
	//
	// The above copyright notice and this permission notice shall be included in
	// all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
	// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	var util = __webpack_require__(9);
	var hasOwn = Object.prototype.hasOwnProperty;
	var pSlice = Array.prototype.slice;
	var functionsHaveNames = (function () {
	  return function foo() {}.name === 'foo';
	}());
	function pToString (obj) {
	  return Object.prototype.toString.call(obj);
	}
	function isView(arrbuf) {
	  if (isBuffer(arrbuf)) {
	    return false;
	  }
	  if (typeof global.ArrayBuffer !== 'function') {
	    return false;
	  }
	  if (typeof ArrayBuffer.isView === 'function') {
	    return ArrayBuffer.isView(arrbuf);
	  }
	  if (!arrbuf) {
	    return false;
	  }
	  if (arrbuf instanceof DataView) {
	    return true;
	  }
	  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
	    return true;
	  }
	  return false;
	}
	// 1. The assert module provides functions that throw
	// AssertionError's when particular conditions are not met. The
	// assert module must conform to the following interface.

	var assert = module.exports = ok;

	// 2. The AssertionError is defined in assert.
	// new assert.AssertionError({ message: message,
	//                             actual: actual,
	//                             expected: expected })

	var regex = /\s*function\s+([^\(\s]*)\s*/;
	// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
	function getName(func) {
	  if (!util.isFunction(func)) {
	    return;
	  }
	  if (functionsHaveNames) {
	    return func.name;
	  }
	  var str = func.toString();
	  var match = str.match(regex);
	  return match && match[1];
	}
	assert.AssertionError = function AssertionError(options) {
	  this.name = 'AssertionError';
	  this.actual = options.actual;
	  this.expected = options.expected;
	  this.operator = options.operator;
	  if (options.message) {
	    this.message = options.message;
	    this.generatedMessage = false;
	  } else {
	    this.message = getMessage(this);
	    this.generatedMessage = true;
	  }
	  var stackStartFunction = options.stackStartFunction || fail;
	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, stackStartFunction);
	  } else {
	    // non v8 browsers so we can have a stacktrace
	    var err = new Error();
	    if (err.stack) {
	      var out = err.stack;

	      // try to strip useless frames
	      var fn_name = getName(stackStartFunction);
	      var idx = out.indexOf('\n' + fn_name);
	      if (idx >= 0) {
	        // once we have located the function frame
	        // we need to strip out everything before it (and its line)
	        var next_line = out.indexOf('\n', idx + 1);
	        out = out.substring(next_line + 1);
	      }

	      this.stack = out;
	    }
	  }
	};

	// assert.AssertionError instanceof Error
	util.inherits(assert.AssertionError, Error);

	function truncate(s, n) {
	  if (typeof s === 'string') {
	    return s.length < n ? s : s.slice(0, n);
	  } else {
	    return s;
	  }
	}
	function inspect(something) {
	  if (functionsHaveNames || !util.isFunction(something)) {
	    return util.inspect(something);
	  }
	  var rawname = getName(something);
	  var name = rawname ? ': ' + rawname : '';
	  return '[Function' +  name + ']';
	}
	function getMessage(self) {
	  return truncate(inspect(self.actual), 128) + ' ' +
	         self.operator + ' ' +
	         truncate(inspect(self.expected), 128);
	}

	// At present only the three keys mentioned above are used and
	// understood by the spec. Implementations or sub modules can pass
	// other keys to the AssertionError's constructor - they will be
	// ignored.

	// 3. All of the following functions must throw an AssertionError
	// when a corresponding condition is not met, with a message that
	// may be undefined if not provided.  All assertion methods provide
	// both the actual and expected values to the assertion error for
	// display purposes.

	function fail(actual, expected, message, operator, stackStartFunction) {
	  throw new assert.AssertionError({
	    message: message,
	    actual: actual,
	    expected: expected,
	    operator: operator,
	    stackStartFunction: stackStartFunction
	  });
	}

	// EXTENSION! allows for well behaved errors defined elsewhere.
	assert.fail = fail;

	// 4. Pure assertion tests whether a value is truthy, as determined
	// by !!guard.
	// assert.ok(guard, message_opt);
	// This statement is equivalent to assert.equal(true, !!guard,
	// message_opt);. To test strictly for the value true, use
	// assert.strictEqual(true, guard, message_opt);.

	function ok(value, message) {
	  if (!value) fail(value, true, message, '==', assert.ok);
	}
	assert.ok = ok;

	// 5. The equality assertion tests shallow, coercive equality with
	// ==.
	// assert.equal(actual, expected, message_opt);

	assert.equal = function equal(actual, expected, message) {
	  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
	};

	// 6. The non-equality assertion tests for whether two objects are not equal
	// with != assert.notEqual(actual, expected, message_opt);

	assert.notEqual = function notEqual(actual, expected, message) {
	  if (actual == expected) {
	    fail(actual, expected, message, '!=', assert.notEqual);
	  }
	};

	// 7. The equivalence assertion tests a deep equality relation.
	// assert.deepEqual(actual, expected, message_opt);

	assert.deepEqual = function deepEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
	  }
	};

	assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
	  }
	};

	function _deepEqual(actual, expected, strict, memos) {
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;
	  } else if (isBuffer(actual) && isBuffer(expected)) {
	    return compare(actual, expected) === 0;

	  // 7.2. If the expected value is a Date object, the actual value is
	  // equivalent if it is also a Date object that refers to the same time.
	  } else if (util.isDate(actual) && util.isDate(expected)) {
	    return actual.getTime() === expected.getTime();

	  // 7.3 If the expected value is a RegExp object, the actual value is
	  // equivalent if it is also a RegExp object with the same source and
	  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
	  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
	    return actual.source === expected.source &&
	           actual.global === expected.global &&
	           actual.multiline === expected.multiline &&
	           actual.lastIndex === expected.lastIndex &&
	           actual.ignoreCase === expected.ignoreCase;

	  // 7.4. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if ((actual === null || typeof actual !== 'object') &&
	             (expected === null || typeof expected !== 'object')) {
	    return strict ? actual === expected : actual == expected;

	  // If both values are instances of typed arrays, wrap their underlying
	  // ArrayBuffers in a Buffer each to increase performance
	  // This optimization requires the arrays to have the same type as checked by
	  // Object.prototype.toString (aka pToString). Never perform binary
	  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
	  // bit patterns are not identical.
	  } else if (isView(actual) && isView(expected) &&
	             pToString(actual) === pToString(expected) &&
	             !(actual instanceof Float32Array ||
	               actual instanceof Float64Array)) {
	    return compare(new Uint8Array(actual.buffer),
	                   new Uint8Array(expected.buffer)) === 0;

	  // 7.5 For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else if (isBuffer(actual) !== isBuffer(expected)) {
	    return false;
	  } else {
	    memos = memos || {actual: [], expected: []};

	    var actualIndex = memos.actual.indexOf(actual);
	    if (actualIndex !== -1) {
	      if (actualIndex === memos.expected.indexOf(expected)) {
	        return true;
	      }
	    }

	    memos.actual.push(actual);
	    memos.expected.push(expected);

	    return objEquiv(actual, expected, strict, memos);
	  }
	}

	function isArguments(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	}

	function objEquiv(a, b, strict, actualVisitedObjects) {
	  if (a === null || a === undefined || b === null || b === undefined)
	    return false;
	  // if one is a primitive, the other must be same
	  if (util.isPrimitive(a) || util.isPrimitive(b))
	    return a === b;
	  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
	    return false;
	  var aIsArgs = isArguments(a);
	  var bIsArgs = isArguments(b);
	  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
	    return false;
	  if (aIsArgs) {
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return _deepEqual(a, b, strict);
	  }
	  var ka = objectKeys(a);
	  var kb = objectKeys(b);
	  var key, i;
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length !== kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] !== kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
	      return false;
	  }
	  return true;
	}

	// 8. The non-equivalence assertion tests for any deep inequality.
	// assert.notDeepEqual(actual, expected, message_opt);

	assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
	  }
	};

	assert.notDeepStrictEqual = notDeepStrictEqual;
	function notDeepStrictEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
	  }
	}


	// 9. The strict equality assertion tests strict equality, as determined by ===.
	// assert.strictEqual(actual, expected, message_opt);

	assert.strictEqual = function strictEqual(actual, expected, message) {
	  if (actual !== expected) {
	    fail(actual, expected, message, '===', assert.strictEqual);
	  }
	};

	// 10. The strict non-equality assertion tests for strict inequality, as
	// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

	assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
	  if (actual === expected) {
	    fail(actual, expected, message, '!==', assert.notStrictEqual);
	  }
	};

	function expectedException(actual, expected) {
	  if (!actual || !expected) {
	    return false;
	  }

	  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
	    return expected.test(actual);
	  }

	  try {
	    if (actual instanceof expected) {
	      return true;
	    }
	  } catch (e) {
	    // Ignore.  The instanceof check doesn't work for arrow functions.
	  }

	  if (Error.isPrototypeOf(expected)) {
	    return false;
	  }

	  return expected.call({}, actual) === true;
	}

	function _tryBlock(block) {
	  var error;
	  try {
	    block();
	  } catch (e) {
	    error = e;
	  }
	  return error;
	}

	function _throws(shouldThrow, block, expected, message) {
	  var actual;

	  if (typeof block !== 'function') {
	    throw new TypeError('"block" argument must be a function');
	  }

	  if (typeof expected === 'string') {
	    message = expected;
	    expected = null;
	  }

	  actual = _tryBlock(block);

	  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
	            (message ? ' ' + message : '.');

	  if (shouldThrow && !actual) {
	    fail(actual, expected, 'Missing expected exception' + message);
	  }

	  var userProvidedMessage = typeof message === 'string';
	  var isUnwantedException = !shouldThrow && util.isError(actual);
	  var isUnexpectedException = !shouldThrow && actual && !expected;

	  if ((isUnwantedException &&
	      userProvidedMessage &&
	      expectedException(actual, expected)) ||
	      isUnexpectedException) {
	    fail(actual, expected, 'Got unwanted exception' + message);
	  }

	  if ((shouldThrow && actual && expected &&
	      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
	    throw actual;
	  }
	}

	// 11. Expected to throw an error:
	// assert.throws(block, Error_opt, message_opt);

	assert.throws = function(block, /*optional*/error, /*optional*/message) {
	  _throws(true, block, error, message);
	};

	// EXTENSION! This is annoying to write outside this module.
	assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
	  _throws(false, block, error, message);
	};

	assert.ifError = function(err) { if (err) throw err; };

	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    if (hasOwn.call(obj, key)) keys.push(key);
	  }
	  return keys;
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(11);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(12);

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(10)))

/***/ },
/* 10 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 12 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict'

	var base58 = __webpack_require__(14)
	var createHash = __webpack_require__(16)

	// SHA256(SHA256(buffer))
	function sha256x2 (buffer) {
	  var tmp = createHash('sha256').update(buffer).digest()
	  return createHash('sha256').update(tmp).digest()
	}

	// Encode a buffer as a base58-check encoded string
	function encode (payload) {
	  var checksum = sha256x2(payload)

	  return base58.encode(Buffer.concat([
	    payload,
	    checksum
	  ], payload.length + 4))
	}

	function decodeRaw (buffer) {
	  var payload = buffer.slice(0, -4)
	  var checksum = buffer.slice(-4)
	  var newChecksum = sha256x2(payload)

	  if (checksum[0] ^ newChecksum[0] |
	      checksum[1] ^ newChecksum[1] |
	      checksum[2] ^ newChecksum[2] |
	      checksum[3] ^ newChecksum[3]) return

	  return payload
	}

	// Decode a base58-check encoded string to a buffer, no result if checksum is wrong
	function decodeUnsafe (string) {
	  var array = base58.decodeUnsafe(string)
	  if (!array) return

	  var buffer = new Buffer(array)
	  return decodeRaw(buffer)
	}

	function decode (string) {
	  var array = base58.decode(string)
	  var buffer = new Buffer(array)
	  var payload = decodeRaw(buffer)
	  if (!payload) throw new Error('Invalid checksum')
	  return payload
	}

	module.exports = {
	  encode: encode,
	  decode: decode,
	  decodeUnsafe: decodeUnsafe,

	  // FIXME: remove in 2.0.0
	  decodeRaw: decodeUnsafe
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var basex = __webpack_require__(15)
	var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

	module.exports = basex(ALPHABET)


/***/ },
/* 15 */
/***/ function(module, exports) {

	// base-x encoding
	// Forked from https://github.com/cryptocoinjs/bs58
	// Originally written by Mike Hearn for BitcoinJ
	// Copyright (c) 2011 Google Inc
	// Ported to JavaScript by Stefan Thomas
	// Merged Buffer refactorings from base58-native by Stephen Pair
	// Copyright (c) 2013 BitPay Inc

	module.exports = function base (ALPHABET) {
	  var ALPHABET_MAP = {}
	  var BASE = ALPHABET.length
	  var LEADER = ALPHABET.charAt(0)

	  // pre-compute lookup table
	  for (var i = 0; i < ALPHABET.length; i++) {
	    ALPHABET_MAP[ALPHABET.charAt(i)] = i
	  }

	  function encode (source) {
	    if (source.length === 0) return ''

	    var digits = [0]
	    for (var i = 0; i < source.length; ++i) {
	      for (var j = 0, carry = source[i]; j < digits.length; ++j) {
	        carry += digits[j] << 8
	        digits[j] = carry % BASE
	        carry = (carry / BASE) | 0
	      }

	      while (carry > 0) {
	        digits.push(carry % BASE)
	        carry = (carry / BASE) | 0
	      }
	    }

	    var string = ''

	    // deal with leading zeros
	    for (var k = 0; source[k] === 0 && k < source.length - 1; ++k) string += ALPHABET[0]
	    // convert digits to a string
	    for (var q = digits.length - 1; q >= 0; --q) string += ALPHABET[digits[q]]

	    return string
	  }

	  function decodeUnsafe (string) {
	    if (string.length === 0) return []

	    var bytes = [0]
	    for (var i = 0; i < string.length; i++) {
	      var value = ALPHABET_MAP[string[i]]
	      if (value === undefined) return

	      for (var j = 0, carry = value; j < bytes.length; ++j) {
	        carry += bytes[j] * BASE
	        bytes[j] = carry & 0xff
	        carry >>= 8
	      }

	      while (carry > 0) {
	        bytes.push(carry & 0xff)
	        carry >>= 8
	      }
	    }

	    // deal with leading zeros
	    for (var k = 0; string[k] === LEADER && k < string.length - 1; ++k) {
	      bytes.push(0)
	    }

	    return bytes.reverse()
	  }

	  function decode (string) {
	    var array = decodeUnsafe(string)
	    if (array) return array

	    throw new Error('Non-base' + BASE + ' character')
	  }

	  return {
	    encode: encode,
	    decodeUnsafe: decodeUnsafe,
	    decode: decode
	  }
	}


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';
	var inherits = __webpack_require__(17)
	var md5 = __webpack_require__(18)
	var rmd160 = __webpack_require__(20)
	var sha = __webpack_require__(21)

	var Base = __webpack_require__(29)

	function HashNoConstructor(hash) {
	  Base.call(this, 'digest')

	  this._hash = hash
	  this.buffers = []
	}

	inherits(HashNoConstructor, Base)

	HashNoConstructor.prototype._update = function (data) {
	  this.buffers.push(data)
	}

	HashNoConstructor.prototype._final = function () {
	  var buf = Buffer.concat(this.buffers)
	  var r = this._hash(buf)
	  this.buffers = null

	  return r
	}

	function Hash(hash) {
	  Base.call(this, 'digest')

	  this._hash = hash
	}

	inherits(Hash, Base)

	Hash.prototype._update = function (data) {
	  this._hash.update(data)
	}

	Hash.prototype._final = function () {
	  return this._hash.digest()
	}

	module.exports = function createHash (alg) {
	  alg = alg.toLowerCase()
	  if ('md5' === alg) return new HashNoConstructor(md5)
	  if ('rmd160' === alg || 'ripemd160' === alg) return new HashNoConstructor(rmd160)

	  return new Hash(sha(alg))
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 17 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	/*
	 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
	 * Digest Algorithm, as defined in RFC 1321.
	 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for more info.
	 */

	var helpers = __webpack_require__(19);

	/*
	 * Calculate the MD5 of an array of little-endian words, and a bit length
	 */
	function core_md5(x, len)
	{
	  /* append padding */
	  x[len >> 5] |= 0x80 << ((len) % 32);
	  x[(((len + 64) >>> 9) << 4) + 14] = len;

	  var a =  1732584193;
	  var b = -271733879;
	  var c = -1732584194;
	  var d =  271733878;

	  for(var i = 0; i < x.length; i += 16)
	  {
	    var olda = a;
	    var oldb = b;
	    var oldc = c;
	    var oldd = d;

	    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
	    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
	    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
	    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
	    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
	    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
	    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
	    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
	    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
	    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
	    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
	    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
	    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
	    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
	    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
	    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

	    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
	    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
	    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
	    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
	    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
	    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
	    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
	    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
	    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
	    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
	    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
	    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
	    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
	    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
	    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
	    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

	    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
	    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
	    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
	    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
	    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
	    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
	    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
	    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
	    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
	    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
	    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
	    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
	    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
	    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
	    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
	    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

	    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
	    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
	    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
	    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
	    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
	    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
	    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
	    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
	    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
	    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
	    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
	    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
	    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
	    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
	    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
	    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

	    a = safe_add(a, olda);
	    b = safe_add(b, oldb);
	    c = safe_add(c, oldc);
	    d = safe_add(d, oldd);
	  }
	  return Array(a, b, c, d);

	}

	/*
	 * These functions implement the four basic operations the algorithm uses.
	 */
	function md5_cmn(q, a, b, x, s, t)
	{
	  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
	}
	function md5_ff(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}
	function md5_gg(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}
	function md5_hh(a, b, c, d, x, s, t)
	{
	  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5_ii(a, b, c, d, x, s, t)
	{
	  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	/*
	 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	 * to work around bugs in some JS interpreters.
	 */
	function safe_add(x, y)
	{
	  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  return (msw << 16) | (lsw & 0xFFFF);
	}

	/*
	 * Bitwise rotate a 32-bit number to the left.
	 */
	function bit_rol(num, cnt)
	{
	  return (num << cnt) | (num >>> (32 - cnt));
	}

	module.exports = function md5(buf) {
	  return helpers.hash(buf, core_md5, 16);
	};

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';
	var intSize = 4;
	var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
	var chrsz = 8;

	function toArray(buf, bigEndian) {
	  if ((buf.length % intSize) !== 0) {
	    var len = buf.length + (intSize - (buf.length % intSize));
	    buf = Buffer.concat([buf, zeroBuffer], len);
	  }

	  var arr = [];
	  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
	  for (var i = 0; i < buf.length; i += intSize) {
	    arr.push(fn.call(buf, i));
	  }
	  return arr;
	}

	function toBuffer(arr, size, bigEndian) {
	  var buf = new Buffer(size);
	  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
	  for (var i = 0; i < arr.length; i++) {
	    fn.call(buf, arr[i], i * 4, true);
	  }
	  return buf;
	}

	function hash(buf, fn, hashSize, bigEndian) {
	  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
	  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
	  return toBuffer(arr, hashSize, bigEndian);
	}
	exports.hash = hash;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/*
	CryptoJS v3.1.2
	code.google.com/p/crypto-js
	(c) 2009-2013 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	/** @preserve
	(c) 2012 by Cédric Mesnil. All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/

	// constants table
	var zl = [
	  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
	  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
	  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
	  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
	  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
	]

	var zr = [
	  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
	  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
	  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
	  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
	  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
	]

	var sl = [
	  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
	  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
	  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
	  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
	  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
	]

	var sr = [
	  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
	  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
	  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
	  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
	  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
	]

	var hl = [0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]
	var hr = [0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]

	function bytesToWords (bytes) {
	  var words = []
	  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
	    words[b >>> 5] |= bytes[i] << (24 - b % 32)
	  }
	  return words
	}

	function wordsToBytes (words) {
	  var bytes = []
	  for (var b = 0; b < words.length * 32; b += 8) {
	    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF)
	  }
	  return bytes
	}

	function processBlock (H, M, offset) {
	  // swap endian
	  for (var i = 0; i < 16; i++) {
	    var offset_i = offset + i
	    var M_offset_i = M[offset_i]

	    // Swap
	    M[offset_i] = (
	      (((M_offset_i << 8) | (M_offset_i >>> 24)) & 0x00ff00ff) |
	      (((M_offset_i << 24) | (M_offset_i >>> 8)) & 0xff00ff00)
	    )
	  }

	  // Working variables
	  var al, bl, cl, dl, el
	  var ar, br, cr, dr, er

	  ar = al = H[0]
	  br = bl = H[1]
	  cr = cl = H[2]
	  dr = dl = H[3]
	  er = el = H[4]

	  // computation
	  var t
	  for (i = 0; i < 80; i += 1) {
	    t = (al + M[offset + zl[i]]) | 0
	    if (i < 16) {
	      t += f1(bl, cl, dl) + hl[0]
	    } else if (i < 32) {
	      t += f2(bl, cl, dl) + hl[1]
	    } else if (i < 48) {
	      t += f3(bl, cl, dl) + hl[2]
	    } else if (i < 64) {
	      t += f4(bl, cl, dl) + hl[3]
	    } else {// if (i<80) {
	      t += f5(bl, cl, dl) + hl[4]
	    }
	    t = t | 0
	    t = rotl(t, sl[i])
	    t = (t + el) | 0
	    al = el
	    el = dl
	    dl = rotl(cl, 10)
	    cl = bl
	    bl = t

	    t = (ar + M[offset + zr[i]]) | 0
	    if (i < 16) {
	      t += f5(br, cr, dr) + hr[0]
	    } else if (i < 32) {
	      t += f4(br, cr, dr) + hr[1]
	    } else if (i < 48) {
	      t += f3(br, cr, dr) + hr[2]
	    } else if (i < 64) {
	      t += f2(br, cr, dr) + hr[3]
	    } else {// if (i<80) {
	      t += f1(br, cr, dr) + hr[4]
	    }

	    t = t | 0
	    t = rotl(t, sr[i])
	    t = (t + er) | 0
	    ar = er
	    er = dr
	    dr = rotl(cr, 10)
	    cr = br
	    br = t
	  }

	  // intermediate hash value
	  t = (H[1] + cl + dr) | 0
	  H[1] = (H[2] + dl + er) | 0
	  H[2] = (H[3] + el + ar) | 0
	  H[3] = (H[4] + al + br) | 0
	  H[4] = (H[0] + bl + cr) | 0
	  H[0] = t
	}

	function f1 (x, y, z) {
	  return ((x) ^ (y) ^ (z))
	}

	function f2 (x, y, z) {
	  return (((x) & (y)) | ((~x) & (z)))
	}

	function f3 (x, y, z) {
	  return (((x) | (~(y))) ^ (z))
	}

	function f4 (x, y, z) {
	  return (((x) & (z)) | ((y) & (~(z))))
	}

	function f5 (x, y, z) {
	  return ((x) ^ ((y) | (~(z))))
	}

	function rotl (x, n) {
	  return (x << n) | (x >>> (32 - n))
	}

	function ripemd160 (message) {
	  var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]

	  if (typeof message === 'string') {
	    message = new Buffer(message, 'utf8')
	  }

	  var m = bytesToWords(message)

	  var nBitsLeft = message.length * 8
	  var nBitsTotal = message.length * 8

	  // Add padding
	  m[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32)
	  m[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	    (((nBitsTotal << 8) | (nBitsTotal >>> 24)) & 0x00ff00ff) |
	    (((nBitsTotal << 24) | (nBitsTotal >>> 8)) & 0xff00ff00)
	  )

	  for (var i = 0; i < m.length; i += 16) {
	    processBlock(H, m, i)
	  }

	  // swap endian
	  for (i = 0; i < 5; i++) {
	    // shortcut
	    var H_i = H[i]

	    // Swap
	    H[i] = (((H_i << 8) | (H_i >>> 24)) & 0x00ff00ff) |
	      (((H_i << 24) | (H_i >>> 8)) & 0xff00ff00)
	  }

	  var digestbytes = wordsToBytes(H)
	  return new Buffer(digestbytes)
	}

	module.exports = ripemd160

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var exports = module.exports = function SHA (algorithm) {
	  algorithm = algorithm.toLowerCase()

	  var Algorithm = exports[algorithm]
	  if (!Algorithm) throw new Error(algorithm + ' is not supported (we accept pull requests)')

	  return new Algorithm()
	}

	exports.sha = __webpack_require__(22)
	exports.sha1 = __webpack_require__(24)
	exports.sha224 = __webpack_require__(25)
	exports.sha256 = __webpack_require__(26)
	exports.sha384 = __webpack_require__(27)
	exports.sha512 = __webpack_require__(28)


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/*
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-0, as defined
	 * in FIPS PUB 180-1
	 * This source code is derived from sha1.js of the same repository.
	 * The difference between SHA-0 and SHA-1 is just a bitwise rotate left
	 * operation was added.
	 */

	var inherits = __webpack_require__(17)
	var Hash = __webpack_require__(23)

	var K = [
	  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
	]

	var W = new Array(80)

	function Sha () {
	  this.init()
	  this._w = W

	  Hash.call(this, 64, 56)
	}

	inherits(Sha, Hash)

	Sha.prototype.init = function () {
	  this._a = 0x67452301
	  this._b = 0xefcdab89
	  this._c = 0x98badcfe
	  this._d = 0x10325476
	  this._e = 0xc3d2e1f0

	  return this
	}

	function rotl5 (num) {
	  return (num << 5) | (num >>> 27)
	}

	function rotl30 (num) {
	  return (num << 30) | (num >>> 2)
	}

	function ft (s, b, c, d) {
	  if (s === 0) return (b & c) | ((~b) & d)
	  if (s === 2) return (b & c) | (b & d) | (c & d)
	  return b ^ c ^ d
	}

	Sha.prototype._update = function (M) {
	  var W = this._w

	  var a = this._a | 0
	  var b = this._b | 0
	  var c = this._c | 0
	  var d = this._d | 0
	  var e = this._e | 0

	  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
	  for (; i < 80; ++i) W[i] = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]

	  for (var j = 0; j < 80; ++j) {
	    var s = ~~(j / 20)
	    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

	    e = d
	    d = c
	    c = rotl30(b)
	    b = a
	    a = t
	  }

	  this._a = (a + this._a) | 0
	  this._b = (b + this._b) | 0
	  this._c = (c + this._c) | 0
	  this._d = (d + this._d) | 0
	  this._e = (e + this._e) | 0
	}

	Sha.prototype._hash = function () {
	  var H = new Buffer(20)

	  H.writeInt32BE(this._a | 0, 0)
	  H.writeInt32BE(this._b | 0, 4)
	  H.writeInt32BE(this._c | 0, 8)
	  H.writeInt32BE(this._d | 0, 12)
	  H.writeInt32BE(this._e | 0, 16)

	  return H
	}

	module.exports = Sha

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// prototype class for hash functions
	function Hash (blockSize, finalSize) {
	  this._block = new Buffer(blockSize)
	  this._finalSize = finalSize
	  this._blockSize = blockSize
	  this._len = 0
	  this._s = 0
	}

	Hash.prototype.update = function (data, enc) {
	  if (typeof data === 'string') {
	    enc = enc || 'utf8'
	    data = new Buffer(data, enc)
	  }

	  var l = this._len += data.length
	  var s = this._s || 0
	  var f = 0
	  var buffer = this._block

	  while (s < l) {
	    var t = Math.min(data.length, f + this._blockSize - (s % this._blockSize))
	    var ch = (t - f)

	    for (var i = 0; i < ch; i++) {
	      buffer[(s % this._blockSize) + i] = data[i + f]
	    }

	    s += ch
	    f += ch

	    if ((s % this._blockSize) === 0) {
	      this._update(buffer)
	    }
	  }
	  this._s = s

	  return this
	}

	Hash.prototype.digest = function (enc) {
	  // Suppose the length of the message M, in bits, is l
	  var l = this._len * 8

	  // Append the bit 1 to the end of the message
	  this._block[this._len % this._blockSize] = 0x80

	  // and then k zero bits, where k is the smallest non-negative solution to the equation (l + 1 + k) === finalSize mod blockSize
	  this._block.fill(0, this._len % this._blockSize + 1)

	  if (l % (this._blockSize * 8) >= this._finalSize * 8) {
	    this._update(this._block)
	    this._block.fill(0)
	  }

	  // to this append the block which is equal to the number l written in binary
	  // TODO: handle case where l is > Math.pow(2, 29)
	  this._block.writeInt32BE(l, this._blockSize - 4)

	  var hash = this._update(this._block) || this._hash()

	  return enc ? hash.toString(enc) : hash
	}

	Hash.prototype._update = function () {
	  throw new Error('_update must be implemented by subclass')
	}

	module.exports = Hash

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/*
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
	 * in FIPS PUB 180-1
	 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for details.
	 */

	var inherits = __webpack_require__(17)
	var Hash = __webpack_require__(23)

	var K = [
	  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
	]

	var W = new Array(80)

	function Sha1 () {
	  this.init()
	  this._w = W

	  Hash.call(this, 64, 56)
	}

	inherits(Sha1, Hash)

	Sha1.prototype.init = function () {
	  this._a = 0x67452301
	  this._b = 0xefcdab89
	  this._c = 0x98badcfe
	  this._d = 0x10325476
	  this._e = 0xc3d2e1f0

	  return this
	}

	function rotl1 (num) {
	  return (num << 1) | (num >>> 31)
	}

	function rotl5 (num) {
	  return (num << 5) | (num >>> 27)
	}

	function rotl30 (num) {
	  return (num << 30) | (num >>> 2)
	}

	function ft (s, b, c, d) {
	  if (s === 0) return (b & c) | ((~b) & d)
	  if (s === 2) return (b & c) | (b & d) | (c & d)
	  return b ^ c ^ d
	}

	Sha1.prototype._update = function (M) {
	  var W = this._w

	  var a = this._a | 0
	  var b = this._b | 0
	  var c = this._c | 0
	  var d = this._d | 0
	  var e = this._e | 0

	  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
	  for (; i < 80; ++i) W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16])

	  for (var j = 0; j < 80; ++j) {
	    var s = ~~(j / 20)
	    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

	    e = d
	    d = c
	    c = rotl30(b)
	    b = a
	    a = t
	  }

	  this._a = (a + this._a) | 0
	  this._b = (b + this._b) | 0
	  this._c = (c + this._c) | 0
	  this._d = (d + this._d) | 0
	  this._e = (e + this._e) | 0
	}

	Sha1.prototype._hash = function () {
	  var H = new Buffer(20)

	  H.writeInt32BE(this._a | 0, 0)
	  H.writeInt32BE(this._b | 0, 4)
	  H.writeInt32BE(this._c | 0, 8)
	  H.writeInt32BE(this._d | 0, 12)
	  H.writeInt32BE(this._e | 0, 16)

	  return H
	}

	module.exports = Sha1

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/**
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
	 * in FIPS 180-2
	 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 *
	 */

	var inherits = __webpack_require__(17)
	var Sha256 = __webpack_require__(26)
	var Hash = __webpack_require__(23)

	var W = new Array(64)

	function Sha224 () {
	  this.init()

	  this._w = W // new Array(64)

	  Hash.call(this, 64, 56)
	}

	inherits(Sha224, Sha256)

	Sha224.prototype.init = function () {
	  this._a = 0xc1059ed8
	  this._b = 0x367cd507
	  this._c = 0x3070dd17
	  this._d = 0xf70e5939
	  this._e = 0xffc00b31
	  this._f = 0x68581511
	  this._g = 0x64f98fa7
	  this._h = 0xbefa4fa4

	  return this
	}

	Sha224.prototype._hash = function () {
	  var H = new Buffer(28)

	  H.writeInt32BE(this._a, 0)
	  H.writeInt32BE(this._b, 4)
	  H.writeInt32BE(this._c, 8)
	  H.writeInt32BE(this._d, 12)
	  H.writeInt32BE(this._e, 16)
	  H.writeInt32BE(this._f, 20)
	  H.writeInt32BE(this._g, 24)

	  return H
	}

	module.exports = Sha224

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/**
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
	 * in FIPS 180-2
	 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 *
	 */

	var inherits = __webpack_require__(17)
	var Hash = __webpack_require__(23)

	var K = [
	  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
	  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
	  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
	  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
	  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
	  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
	  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
	  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
	  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
	  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
	  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
	  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
	  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
	  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
	  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
	  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
	]

	var W = new Array(64)

	function Sha256 () {
	  this.init()

	  this._w = W // new Array(64)

	  Hash.call(this, 64, 56)
	}

	inherits(Sha256, Hash)

	Sha256.prototype.init = function () {
	  this._a = 0x6a09e667
	  this._b = 0xbb67ae85
	  this._c = 0x3c6ef372
	  this._d = 0xa54ff53a
	  this._e = 0x510e527f
	  this._f = 0x9b05688c
	  this._g = 0x1f83d9ab
	  this._h = 0x5be0cd19

	  return this
	}

	function ch (x, y, z) {
	  return z ^ (x & (y ^ z))
	}

	function maj (x, y, z) {
	  return (x & y) | (z & (x | y))
	}

	function sigma0 (x) {
	  return (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10)
	}

	function sigma1 (x) {
	  return (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7)
	}

	function gamma0 (x) {
	  return (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)
	}

	function gamma1 (x) {
	  return (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ (x >>> 10)
	}

	Sha256.prototype._update = function (M) {
	  var W = this._w

	  var a = this._a | 0
	  var b = this._b | 0
	  var c = this._c | 0
	  var d = this._d | 0
	  var e = this._e | 0
	  var f = this._f | 0
	  var g = this._g | 0
	  var h = this._h | 0

	  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
	  for (; i < 64; ++i) W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0

	  for (var j = 0; j < 64; ++j) {
	    var T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) | 0
	    var T2 = (sigma0(a) + maj(a, b, c)) | 0

	    h = g
	    g = f
	    f = e
	    e = (d + T1) | 0
	    d = c
	    c = b
	    b = a
	    a = (T1 + T2) | 0
	  }

	  this._a = (a + this._a) | 0
	  this._b = (b + this._b) | 0
	  this._c = (c + this._c) | 0
	  this._d = (d + this._d) | 0
	  this._e = (e + this._e) | 0
	  this._f = (f + this._f) | 0
	  this._g = (g + this._g) | 0
	  this._h = (h + this._h) | 0
	}

	Sha256.prototype._hash = function () {
	  var H = new Buffer(32)

	  H.writeInt32BE(this._a, 0)
	  H.writeInt32BE(this._b, 4)
	  H.writeInt32BE(this._c, 8)
	  H.writeInt32BE(this._d, 12)
	  H.writeInt32BE(this._e, 16)
	  H.writeInt32BE(this._f, 20)
	  H.writeInt32BE(this._g, 24)
	  H.writeInt32BE(this._h, 28)

	  return H
	}

	module.exports = Sha256

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var inherits = __webpack_require__(17)
	var SHA512 = __webpack_require__(28)
	var Hash = __webpack_require__(23)

	var W = new Array(160)

	function Sha384 () {
	  this.init()
	  this._w = W

	  Hash.call(this, 128, 112)
	}

	inherits(Sha384, SHA512)

	Sha384.prototype.init = function () {
	  this._ah = 0xcbbb9d5d
	  this._bh = 0x629a292a
	  this._ch = 0x9159015a
	  this._dh = 0x152fecd8
	  this._eh = 0x67332667
	  this._fh = 0x8eb44a87
	  this._gh = 0xdb0c2e0d
	  this._hh = 0x47b5481d

	  this._al = 0xc1059ed8
	  this._bl = 0x367cd507
	  this._cl = 0x3070dd17
	  this._dl = 0xf70e5939
	  this._el = 0xffc00b31
	  this._fl = 0x68581511
	  this._gl = 0x64f98fa7
	  this._hl = 0xbefa4fa4

	  return this
	}

	Sha384.prototype._hash = function () {
	  var H = new Buffer(48)

	  function writeInt64BE (h, l, offset) {
	    H.writeInt32BE(h, offset)
	    H.writeInt32BE(l, offset + 4)
	  }

	  writeInt64BE(this._ah, this._al, 0)
	  writeInt64BE(this._bh, this._bl, 8)
	  writeInt64BE(this._ch, this._cl, 16)
	  writeInt64BE(this._dh, this._dl, 24)
	  writeInt64BE(this._eh, this._el, 32)
	  writeInt64BE(this._fh, this._fl, 40)

	  return H
	}

	module.exports = Sha384

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var inherits = __webpack_require__(17)
	var Hash = __webpack_require__(23)

	var K = [
	  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
	  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
	  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
	  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
	  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
	  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
	  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
	  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
	  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
	  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
	  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
	  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
	  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
	  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
	  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
	  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
	  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
	  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
	  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
	  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
	  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
	  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
	  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
	  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
	  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
	  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
	  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
	  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
	  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
	  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
	  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
	  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
	  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
	  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
	  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
	  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
	  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
	  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
	  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
	  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
	]

	var W = new Array(160)

	function Sha512 () {
	  this.init()
	  this._w = W

	  Hash.call(this, 128, 112)
	}

	inherits(Sha512, Hash)

	Sha512.prototype.init = function () {
	  this._ah = 0x6a09e667
	  this._bh = 0xbb67ae85
	  this._ch = 0x3c6ef372
	  this._dh = 0xa54ff53a
	  this._eh = 0x510e527f
	  this._fh = 0x9b05688c
	  this._gh = 0x1f83d9ab
	  this._hh = 0x5be0cd19

	  this._al = 0xf3bcc908
	  this._bl = 0x84caa73b
	  this._cl = 0xfe94f82b
	  this._dl = 0x5f1d36f1
	  this._el = 0xade682d1
	  this._fl = 0x2b3e6c1f
	  this._gl = 0xfb41bd6b
	  this._hl = 0x137e2179

	  return this
	}

	function Ch (x, y, z) {
	  return z ^ (x & (y ^ z))
	}

	function maj (x, y, z) {
	  return (x & y) | (z & (x | y))
	}

	function sigma0 (x, xl) {
	  return (x >>> 28 | xl << 4) ^ (xl >>> 2 | x << 30) ^ (xl >>> 7 | x << 25)
	}

	function sigma1 (x, xl) {
	  return (x >>> 14 | xl << 18) ^ (x >>> 18 | xl << 14) ^ (xl >>> 9 | x << 23)
	}

	function Gamma0 (x, xl) {
	  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7)
	}

	function Gamma0l (x, xl) {
	  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7 | xl << 25)
	}

	function Gamma1 (x, xl) {
	  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6)
	}

	function Gamma1l (x, xl) {
	  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6 | xl << 26)
	}

	function getCarry (a, b) {
	  return (a >>> 0) < (b >>> 0) ? 1 : 0
	}

	Sha512.prototype._update = function (M) {
	  var W = this._w

	  var ah = this._ah | 0
	  var bh = this._bh | 0
	  var ch = this._ch | 0
	  var dh = this._dh | 0
	  var eh = this._eh | 0
	  var fh = this._fh | 0
	  var gh = this._gh | 0
	  var hh = this._hh | 0

	  var al = this._al | 0
	  var bl = this._bl | 0
	  var cl = this._cl | 0
	  var dl = this._dl | 0
	  var el = this._el | 0
	  var fl = this._fl | 0
	  var gl = this._gl | 0
	  var hl = this._hl | 0

	  for (var i = 0; i < 32; i += 2) {
	    W[i] = M.readInt32BE(i * 4)
	    W[i + 1] = M.readInt32BE(i * 4 + 4)
	  }
	  for (; i < 160; i += 2) {
	    var xh = W[i - 15 * 2]
	    var xl = W[i - 15 * 2 + 1]
	    var gamma0 = Gamma0(xh, xl)
	    var gamma0l = Gamma0l(xl, xh)

	    xh = W[i - 2 * 2]
	    xl = W[i - 2 * 2 + 1]
	    var gamma1 = Gamma1(xh, xl)
	    var gamma1l = Gamma1l(xl, xh)

	    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
	    var Wi7h = W[i - 7 * 2]
	    var Wi7l = W[i - 7 * 2 + 1]

	    var Wi16h = W[i - 16 * 2]
	    var Wi16l = W[i - 16 * 2 + 1]

	    var Wil = (gamma0l + Wi7l) | 0
	    var Wih = (gamma0 + Wi7h + getCarry(Wil, gamma0l)) | 0
	    Wil = (Wil + gamma1l) | 0
	    Wih = (Wih + gamma1 + getCarry(Wil, gamma1l)) | 0
	    Wil = (Wil + Wi16l) | 0
	    Wih = (Wih + Wi16h + getCarry(Wil, Wi16l)) | 0

	    W[i] = Wih
	    W[i + 1] = Wil
	  }

	  for (var j = 0; j < 160; j += 2) {
	    Wih = W[j]
	    Wil = W[j + 1]

	    var majh = maj(ah, bh, ch)
	    var majl = maj(al, bl, cl)

	    var sigma0h = sigma0(ah, al)
	    var sigma0l = sigma0(al, ah)
	    var sigma1h = sigma1(eh, el)
	    var sigma1l = sigma1(el, eh)

	    // t1 = h + sigma1 + ch + K[j] + W[j]
	    var Kih = K[j]
	    var Kil = K[j + 1]

	    var chh = Ch(eh, fh, gh)
	    var chl = Ch(el, fl, gl)

	    var t1l = (hl + sigma1l) | 0
	    var t1h = (hh + sigma1h + getCarry(t1l, hl)) | 0
	    t1l = (t1l + chl) | 0
	    t1h = (t1h + chh + getCarry(t1l, chl)) | 0
	    t1l = (t1l + Kil) | 0
	    t1h = (t1h + Kih + getCarry(t1l, Kil)) | 0
	    t1l = (t1l + Wil) | 0
	    t1h = (t1h + Wih + getCarry(t1l, Wil)) | 0

	    // t2 = sigma0 + maj
	    var t2l = (sigma0l + majl) | 0
	    var t2h = (sigma0h + majh + getCarry(t2l, sigma0l)) | 0

	    hh = gh
	    hl = gl
	    gh = fh
	    gl = fl
	    fh = eh
	    fl = el
	    el = (dl + t1l) | 0
	    eh = (dh + t1h + getCarry(el, dl)) | 0
	    dh = ch
	    dl = cl
	    ch = bh
	    cl = bl
	    bh = ah
	    bl = al
	    al = (t1l + t2l) | 0
	    ah = (t1h + t2h + getCarry(al, t1l)) | 0
	  }

	  this._al = (this._al + al) | 0
	  this._bl = (this._bl + bl) | 0
	  this._cl = (this._cl + cl) | 0
	  this._dl = (this._dl + dl) | 0
	  this._el = (this._el + el) | 0
	  this._fl = (this._fl + fl) | 0
	  this._gl = (this._gl + gl) | 0
	  this._hl = (this._hl + hl) | 0

	  this._ah = (this._ah + ah + getCarry(this._al, al)) | 0
	  this._bh = (this._bh + bh + getCarry(this._bl, bl)) | 0
	  this._ch = (this._ch + ch + getCarry(this._cl, cl)) | 0
	  this._dh = (this._dh + dh + getCarry(this._dl, dl)) | 0
	  this._eh = (this._eh + eh + getCarry(this._el, el)) | 0
	  this._fh = (this._fh + fh + getCarry(this._fl, fl)) | 0
	  this._gh = (this._gh + gh + getCarry(this._gl, gl)) | 0
	  this._hh = (this._hh + hh + getCarry(this._hl, hl)) | 0
	}

	Sha512.prototype._hash = function () {
	  var H = new Buffer(64)

	  function writeInt64BE (h, l, offset) {
	    H.writeInt32BE(h, offset)
	    H.writeInt32BE(l, offset + 4)
	  }

	  writeInt64BE(this._ah, this._al, 0)
	  writeInt64BE(this._bh, this._bl, 8)
	  writeInt64BE(this._ch, this._cl, 16)
	  writeInt64BE(this._dh, this._dl, 24)
	  writeInt64BE(this._eh, this._el, 32)
	  writeInt64BE(this._fh, this._fl, 40)
	  writeInt64BE(this._gh, this._gl, 48)
	  writeInt64BE(this._hh, this._hl, 56)

	  return H
	}

	module.exports = Sha512

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var Transform = __webpack_require__(30).Transform
	var inherits = __webpack_require__(17)
	var StringDecoder = __webpack_require__(45).StringDecoder
	module.exports = CipherBase
	inherits(CipherBase, Transform)
	function CipherBase (hashMode) {
	  Transform.call(this)
	  this.hashMode = typeof hashMode === 'string'
	  if (this.hashMode) {
	    this[hashMode] = this._finalOrDigest
	  } else {
	    this.final = this._finalOrDigest
	  }
	  this._decoder = null
	  this._encoding = null
	}
	CipherBase.prototype.update = function (data, inputEnc, outputEnc) {
	  if (typeof data === 'string') {
	    data = new Buffer(data, inputEnc)
	  }
	  var outData = this._update(data)
	  if (this.hashMode) {
	    return this
	  }
	  if (outputEnc) {
	    outData = this._toString(outData, outputEnc)
	  }
	  return outData
	}

	CipherBase.prototype.setAutoPadding = function () {}

	CipherBase.prototype.getAuthTag = function () {
	  throw new Error('trying to get auth tag in unsupported state')
	}

	CipherBase.prototype.setAuthTag = function () {
	  throw new Error('trying to set auth tag in unsupported state')
	}

	CipherBase.prototype.setAAD = function () {
	  throw new Error('trying to set aad in unsupported state')
	}

	CipherBase.prototype._transform = function (data, _, next) {
	  var err
	  try {
	    if (this.hashMode) {
	      this._update(data)
	    } else {
	      this.push(this._update(data))
	    }
	  } catch (e) {
	    err = e
	  } finally {
	    next(err)
	  }
	}
	CipherBase.prototype._flush = function (done) {
	  var err
	  try {
	    this.push(this._final())
	  } catch (e) {
	    err = e
	  } finally {
	    done(err)
	  }
	}
	CipherBase.prototype._finalOrDigest = function (outputEnc) {
	  var outData = this._final() || new Buffer('')
	  if (outputEnc) {
	    outData = this._toString(outData, outputEnc, true)
	  }
	  return outData
	}

	CipherBase.prototype._toString = function (value, enc, fin) {
	  if (!this._decoder) {
	    this._decoder = new StringDecoder(enc)
	    this._encoding = enc
	  }
	  if (this._encoding !== enc) {
	    throw new Error('can\'t switch encodings')
	  }
	  var out = this._decoder.write(value)
	  if (fin) {
	    out += this._decoder.end()
	  }
	  return out
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	module.exports = Stream;

	var EE = __webpack_require__(31).EventEmitter;
	var inherits = __webpack_require__(17);

	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(32);
	Stream.Writable = __webpack_require__(48);
	Stream.Duplex = __webpack_require__(49);
	Stream.Transform = __webpack_require__(50);
	Stream.PassThrough = __webpack_require__(51);

	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;



	// old-style streams.  Note that the pipe method (the only relevant
	// part of this class) is overridden in the Readable class.

	function Stream() {
	  EE.call(this);
	}

	Stream.prototype.pipe = function(dest, options) {
	  var source = this;

	  function ondata(chunk) {
	    if (dest.writable) {
	      if (false === dest.write(chunk) && source.pause) {
	        source.pause();
	      }
	    }
	  }

	  source.on('data', ondata);

	  function ondrain() {
	    if (source.readable && source.resume) {
	      source.resume();
	    }
	  }

	  dest.on('drain', ondrain);

	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
	    source.on('end', onend);
	    source.on('close', onclose);
	  }

	  var didOnEnd = false;
	  function onend() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    dest.end();
	  }


	  function onclose() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    if (typeof dest.destroy === 'function') dest.destroy();
	  }

	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
	    cleanup();
	    if (EE.listenerCount(this, 'error') === 0) {
	      throw er; // Unhandled stream error in pipe.
	    }
	  }

	  source.on('error', onerror);
	  dest.on('error', onerror);

	  // remove all the event listeners that were added.
	  function cleanup() {
	    source.removeListener('data', ondata);
	    dest.removeListener('drain', ondrain);

	    source.removeListener('end', onend);
	    source.removeListener('close', onclose);

	    source.removeListener('error', onerror);
	    dest.removeListener('error', onerror);

	    source.removeListener('end', cleanup);
	    source.removeListener('close', cleanup);

	    dest.removeListener('close', cleanup);
	  }

	  source.on('end', cleanup);
	  source.on('close', cleanup);

	  dest.on('close', cleanup);

	  dest.emit('pipe', source);

	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};


/***/ },
/* 31 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];

	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(33);
	exports.Stream = exports;
	exports.Readable = exports;
	exports.Writable = __webpack_require__(41);
	exports.Duplex = __webpack_require__(40);
	exports.Transform = __webpack_require__(46);
	exports.PassThrough = __webpack_require__(47);


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	module.exports = Readable;

	/*<replacement>*/
	var processNextTick = __webpack_require__(34);
	/*</replacement>*/

	/*<replacement>*/
	var isArray = __webpack_require__(5);
	/*</replacement>*/

	/*<replacement>*/
	var Duplex;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	/*<replacement>*/
	var EE = __webpack_require__(31).EventEmitter;

	var EElistenerCount = function (emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream = __webpack_require__(35);
	/*</replacement>*/

	var Buffer = __webpack_require__(2).Buffer;
	/*<replacement>*/
	var bufferShim = __webpack_require__(36);
	/*</replacement>*/

	/*<replacement>*/
	var util = __webpack_require__(37);
	util.inherits = __webpack_require__(17);
	/*</replacement>*/

	/*<replacement>*/
	var debugUtil = __webpack_require__(38);
	var debug = void 0;
	if (debugUtil && debugUtil.debuglog) {
	  debug = debugUtil.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/

	var BufferList = __webpack_require__(39);
	var StringDecoder;

	util.inherits(Readable, Stream);

	var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

	function prependListener(emitter, event, fn) {
	  // Sadly this is not cacheable as some libraries bundle their own
	  // event emitter implementation with them.
	  if (typeof emitter.prependListener === 'function') {
	    return emitter.prependListener(event, fn);
	  } else {
	    // This is a hack to make sure that our error handler is attached before any
	    // userland ones.  NEVER DO THIS. This is here only because this code needs
	    // to continue to work with older versions of Node.js that do not include
	    // the prependListener() method. The goal is to eventually remove this hack.
	    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
	  }
	}

	function ReadableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(40);

	  options = options || {};

	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;

	  // A linked list is used to store data chunks instead of an array because the
	  // linked list can remove elements from the beginning faster than
	  // array.shift()
	  this.buffer = new BufferList();
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	  this.resumeScheduled = false;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // when piping, we only care about 'readable' events that happen
	  // after read()ing all the bytes and not getting any pushback.
	  this.ranOut = false;

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder) StringDecoder = __webpack_require__(45).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  Duplex = Duplex || __webpack_require__(40);

	  if (!(this instanceof Readable)) return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  if (options && typeof options.read === 'function') this._read = options.read;

	  Stream.call(this);
	}

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function (chunk, encoding) {
	  var state = this._readableState;

	  if (!state.objectMode && typeof chunk === 'string') {
	    encoding = encoding || state.defaultEncoding;
	    if (encoding !== state.encoding) {
	      chunk = bufferShim.from(chunk, encoding);
	      encoding = '';
	    }
	  }

	  return readableAddChunk(this, state, chunk, encoding, false);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function (chunk) {
	  var state = this._readableState;
	  return readableAddChunk(this, state, chunk, '', true);
	};

	Readable.prototype.isPaused = function () {
	  return this._readableState.flowing === false;
	};

	function readableAddChunk(stream, state, chunk, encoding, addToFront) {
	  var er = chunkInvalid(state, chunk);
	  if (er) {
	    stream.emit('error', er);
	  } else if (chunk === null) {
	    state.reading = false;
	    onEofChunk(stream, state);
	  } else if (state.objectMode || chunk && chunk.length > 0) {
	    if (state.ended && !addToFront) {
	      var e = new Error('stream.push() after EOF');
	      stream.emit('error', e);
	    } else if (state.endEmitted && addToFront) {
	      var _e = new Error('stream.unshift() after end event');
	      stream.emit('error', _e);
	    } else {
	      var skipAdd;
	      if (state.decoder && !addToFront && !encoding) {
	        chunk = state.decoder.write(chunk);
	        skipAdd = !state.objectMode && chunk.length === 0;
	      }

	      if (!addToFront) state.reading = false;

	      // Don't add to the buffer if we've decoded to an empty string chunk and
	      // we're not in object mode
	      if (!skipAdd) {
	        // if we want the data now, just emit it.
	        if (state.flowing && state.length === 0 && !state.sync) {
	          stream.emit('data', chunk);
	          stream.read(0);
	        } else {
	          // update the buffer info.
	          state.length += state.objectMode ? 1 : chunk.length;
	          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

	          if (state.needReadable) emitReadable(stream);
	        }
	      }

	      maybeReadMore(stream, state);
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	  }

	  return needMoreData(state);
	}

	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
	}

	// backwards compatibility.
	Readable.prototype.setEncoding = function (enc) {
	  if (!StringDecoder) StringDecoder = __webpack_require__(45).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 8MB
	var MAX_HWM = 0x800000;
	function computeNewHighWaterMark(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2 to prevent increasing hwm excessively in
	    // tiny amounts
	    n--;
	    n |= n >>> 1;
	    n |= n >>> 2;
	    n |= n >>> 4;
	    n |= n >>> 8;
	    n |= n >>> 16;
	    n++;
	  }
	  return n;
	}

	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function howMuchToRead(n, state) {
	  if (n <= 0 || state.length === 0 && state.ended) return 0;
	  if (state.objectMode) return 1;
	  if (n !== n) {
	    // Only flow one buffer at a time
	    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
	  }
	  // If we're asking for more than the current hwm, then raise the hwm.
	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
	  if (n <= state.length) return n;
	  // Don't have enough
	  if (!state.ended) {
	    state.needReadable = true;
	    return 0;
	  }
	  return state.length;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function (n) {
	  debug('read', n);
	  n = parseInt(n, 10);
	  var state = this._readableState;
	  var nOrig = n;

	  if (n !== 0) state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0) endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  } else if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0) state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	    // If _read pushed data synchronously, then `reading` will be false,
	    // and we need to re-evaluate how much data we can return to the user.
	    if (!state.reading) n = howMuchToRead(nOrig, state);
	  }

	  var ret;
	  if (n > 0) ret = fromList(n, state);else ret = null;

	  if (ret === null) {
	    state.needReadable = true;
	    n = 0;
	  } else {
	    state.length -= n;
	  }

	  if (state.length === 0) {
	    // If we have nothing in the buffer, then we want to know
	    // as soon as we *do* get something into the buffer.
	    if (!state.ended) state.needReadable = true;

	    // If we tried to read() past the EOF, then emit end on the next tick.
	    if (nOrig !== n && state.ended) endReadable(this);
	  }

	  if (ret !== null) this.emit('data', ret);

	  return ret;
	};

	function chunkInvalid(state, chunk) {
	  var er = null;
	  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}

	function onEofChunk(stream, state) {
	  if (state.ended) return;
	  if (state.decoder) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}

	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    processNextTick(maybeReadMore_, stream, state);
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;else len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function (n) {
	  this.emit('error', new Error('_read() is not implemented'));
	};

	Readable.prototype.pipe = function (dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

	  var endFn = doEnd ? onend : cleanup;
	  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable) {
	    debug('onunpipe');
	    if (readable === src) {
	      cleanup();
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  var cleanedUp = false;
	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', cleanup);
	    src.removeListener('data', ondata);

	    cleanedUp = true;

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
	  }

	  // If the user pushes more data while we're writing to dest then we'll end up
	  // in ondata again. However, we only want to increase awaitDrain once because
	  // dest will only emit one 'drain' event for the multiple writes.
	  // => Introduce a guard on increasing awaitDrain.
	  var increasedAwaitDrain = false;
	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    increasedAwaitDrain = false;
	    var ret = dest.write(chunk);
	    if (false === ret && !increasedAwaitDrain) {
	      // If the user unpiped during `dest.write()`, it is possible
	      // to get stuck in a permanently paused state if that write
	      // also returned false.
	      // => Check whether `dest` is still a piping destination.
	      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
	        debug('false write response, pause', src._readableState.awaitDrain);
	        src._readableState.awaitDrain++;
	        increasedAwaitDrain = true;
	      }
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
	  }

	  // Make sure our error handler is attached before userland ones.
	  prependListener(dest, 'error', onerror);

	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function () {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain) state.awaitDrain--;
	    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}

	Readable.prototype.unpipe = function (dest) {
	  var state = this._readableState;

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0) return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes) return this;

	    if (!dest) dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest) dest.emit('unpipe', this);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var i = 0; i < len; i++) {
	      dests[i].emit('unpipe', this);
	    }return this;
	  }

	  // try to find the right one.
	  var index = indexOf(state.pipes, dest);
	  if (index === -1) return this;

	  state.pipes.splice(index, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1) state.pipes = state.pipes[0];

	  dest.emit('unpipe', this);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function (ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);

	  if (ev === 'data') {
	    // Start flowing on next tick if stream isn't explicitly paused
	    if (this._readableState.flowing !== false) this.resume();
	  } else if (ev === 'readable') {
	    var state = this._readableState;
	    if (!state.endEmitted && !state.readableListening) {
	      state.readableListening = state.needReadable = true;
	      state.emittedReadable = false;
	      if (!state.reading) {
	        processNextTick(nReadingNextTick, this);
	      } else if (state.length) {
	        emitReadable(this, state);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	function nReadingNextTick(self) {
	  debug('readable nexttick read 0');
	  self.read(0);
	}

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function () {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    processNextTick(resume_, stream, state);
	  }
	}

	function resume_(stream, state) {
	  if (!state.reading) {
	    debug('resume read 0');
	    stream.read(0);
	  }

	  state.resumeScheduled = false;
	  state.awaitDrain = 0;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading) stream.read(0);
	}

	Readable.prototype.pause = function () {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  while (state.flowing && stream.read() !== null) {}
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function (stream) {
	  var state = this._readableState;
	  var paused = false;

	  var self = this;
	  stream.on('end', function () {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length) self.push(chunk);
	    }

	    self.push(null);
	  });

	  stream.on('data', function (chunk) {
	    debug('wrapped data');
	    if (state.decoder) chunk = state.decoder.write(chunk);

	    // don't skip over falsy values in objectMode
	    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

	    var ret = self.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (this[i] === undefined && typeof stream[i] === 'function') {
	      this[i] = function (method) {
	        return function () {
	          return stream[method].apply(stream, arguments);
	        };
	      }(i);
	    }
	  }

	  // proxy certain important events.
	  for (var n = 0; n < kProxyEvents.length; n++) {
	    stream.on(kProxyEvents[n], self.emit.bind(self, kProxyEvents[n]));
	  }

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  self._read = function (n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return self;
	};

	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromList(n, state) {
	  // nothing buffered
	  if (state.length === 0) return null;

	  var ret;
	  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
	    // read it all, truncate the list
	    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
	    state.buffer.clear();
	  } else {
	    // read part of list
	    ret = fromListPartial(n, state.buffer, state.decoder);
	  }

	  return ret;
	}

	// Extracts only enough buffered data to satisfy the amount requested.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromListPartial(n, list, hasStrings) {
	  var ret;
	  if (n < list.head.data.length) {
	    // slice is the same for buffers and strings
	    ret = list.head.data.slice(0, n);
	    list.head.data = list.head.data.slice(n);
	  } else if (n === list.head.data.length) {
	    // first chunk is a perfect match
	    ret = list.shift();
	  } else {
	    // result spans more than one buffer
	    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
	  }
	  return ret;
	}

	// Copies a specified amount of characters from the list of buffered data
	// chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBufferString(n, list) {
	  var p = list.head;
	  var c = 1;
	  var ret = p.data;
	  n -= ret.length;
	  while (p = p.next) {
	    var str = p.data;
	    var nb = n > str.length ? str.length : n;
	    if (nb === str.length) ret += str;else ret += str.slice(0, n);
	    n -= nb;
	    if (n === 0) {
	      if (nb === str.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = str.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	// Copies a specified amount of bytes from the list of buffered data chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBuffer(n, list) {
	  var ret = bufferShim.allocUnsafe(n);
	  var p = list.head;
	  var c = 1;
	  p.data.copy(ret);
	  n -= p.data.length;
	  while (p = p.next) {
	    var buf = p.data;
	    var nb = n > buf.length ? buf.length : n;
	    buf.copy(ret, ret.length - n, 0, nb);
	    n -= nb;
	    if (n === 0) {
	      if (nb === buf.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = buf.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    processNextTick(endReadableNT, state, stream);
	  }
	}

	function endReadableNT(state, stream) {
	  // Check that we didn't get one last unshift.
	  if (!state.endEmitted && state.length === 0) {
	    state.endEmitted = true;
	    stream.readable = false;
	    stream.emit('end');
	  }
	}

	function forEach(xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	function indexOf(xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	if (!process.version ||
	    process.version.indexOf('v0.') === 0 ||
	    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
	  module.exports = nextTick;
	} else {
	  module.exports = process.nextTick;
	}

	function nextTick(fn, arg1, arg2, arg3) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('"callback" argument must be a function');
	  }
	  var len = arguments.length;
	  var args, i;
	  switch (len) {
	  case 0:
	  case 1:
	    return process.nextTick(fn);
	  case 2:
	    return process.nextTick(function afterTickOne() {
	      fn.call(null, arg1);
	    });
	  case 3:
	    return process.nextTick(function afterTickTwo() {
	      fn.call(null, arg1, arg2);
	    });
	  case 4:
	    return process.nextTick(function afterTickThree() {
	      fn.call(null, arg1, arg2, arg3);
	    });
	  default:
	    args = new Array(len - 1);
	    i = 0;
	    while (i < args.length) {
	      args[i++] = arguments[i];
	    }
	    return process.nextTick(function afterTick() {
	      fn.apply(null, args);
	    });
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(31).EventEmitter;


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';

	var buffer = __webpack_require__(2);
	var Buffer = buffer.Buffer;
	var SlowBuffer = buffer.SlowBuffer;
	var MAX_LEN = buffer.kMaxLength || 2147483647;
	exports.alloc = function alloc(size, fill, encoding) {
	  if (typeof Buffer.alloc === 'function') {
	    return Buffer.alloc(size, fill, encoding);
	  }
	  if (typeof encoding === 'number') {
	    throw new TypeError('encoding must not be number');
	  }
	  if (typeof size !== 'number') {
	    throw new TypeError('size must be a number');
	  }
	  if (size > MAX_LEN) {
	    throw new RangeError('size is too large');
	  }
	  var enc = encoding;
	  var _fill = fill;
	  if (_fill === undefined) {
	    enc = undefined;
	    _fill = 0;
	  }
	  var buf = new Buffer(size);
	  if (typeof _fill === 'string') {
	    var fillBuf = new Buffer(_fill, enc);
	    var flen = fillBuf.length;
	    var i = -1;
	    while (++i < size) {
	      buf[i] = fillBuf[i % flen];
	    }
	  } else {
	    buf.fill(_fill);
	  }
	  return buf;
	}
	exports.allocUnsafe = function allocUnsafe(size) {
	  if (typeof Buffer.allocUnsafe === 'function') {
	    return Buffer.allocUnsafe(size);
	  }
	  if (typeof size !== 'number') {
	    throw new TypeError('size must be a number');
	  }
	  if (size > MAX_LEN) {
	    throw new RangeError('size is too large');
	  }
	  return new Buffer(size);
	}
	exports.from = function from(value, encodingOrOffset, length) {
	  if (typeof Buffer.from === 'function' && (!global.Uint8Array || Uint8Array.from !== Buffer.from)) {
	    return Buffer.from(value, encodingOrOffset, length);
	  }
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number');
	  }
	  if (typeof value === 'string') {
	    return new Buffer(value, encodingOrOffset);
	  }
	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    var offset = encodingOrOffset;
	    if (arguments.length === 1) {
	      return new Buffer(value);
	    }
	    if (typeof offset === 'undefined') {
	      offset = 0;
	    }
	    var len = length;
	    if (typeof len === 'undefined') {
	      len = value.byteLength - offset;
	    }
	    if (offset >= value.byteLength) {
	      throw new RangeError('\'offset\' is out of bounds');
	    }
	    if (len > value.byteLength - offset) {
	      throw new RangeError('\'length\' is out of bounds');
	    }
	    return new Buffer(value.slice(offset, offset + len));
	  }
	  if (Buffer.isBuffer(value)) {
	    var out = new Buffer(value.length);
	    value.copy(out, 0, 0, value.length);
	    return out;
	  }
	  if (value) {
	    if (Array.isArray(value) || (typeof ArrayBuffer !== 'undefined' && value.buffer instanceof ArrayBuffer) || 'length' in value) {
	      return new Buffer(value);
	    }
	    if (value.type === 'Buffer' && Array.isArray(value.data)) {
	      return new Buffer(value.data);
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ' + 'ArrayBuffer, Array, or array-like object.');
	}
	exports.allocUnsafeSlow = function allocUnsafeSlow(size) {
	  if (typeof Buffer.allocUnsafeSlow === 'function') {
	    return Buffer.allocUnsafeSlow(size);
	  }
	  if (typeof size !== 'number') {
	    throw new TypeError('size must be a number');
	  }
	  if (size >= MAX_LEN) {
	    throw new RangeError('size is too large');
	  }
	  return new SlowBuffer(size);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.

	function isArray(arg) {
	  if (Array.isArray) {
	    return Array.isArray(arg);
	  }
	  return objectToString(arg) === '[object Array]';
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = Buffer.isBuffer;

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 38 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Buffer = __webpack_require__(2).Buffer;
	/*<replacement>*/
	var bufferShim = __webpack_require__(36);
	/*</replacement>*/

	module.exports = BufferList;

	function BufferList() {
	  this.head = null;
	  this.tail = null;
	  this.length = 0;
	}

	BufferList.prototype.push = function (v) {
	  var entry = { data: v, next: null };
	  if (this.length > 0) this.tail.next = entry;else this.head = entry;
	  this.tail = entry;
	  ++this.length;
	};

	BufferList.prototype.unshift = function (v) {
	  var entry = { data: v, next: this.head };
	  if (this.length === 0) this.tail = entry;
	  this.head = entry;
	  ++this.length;
	};

	BufferList.prototype.shift = function () {
	  if (this.length === 0) return;
	  var ret = this.head.data;
	  if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
	  --this.length;
	  return ret;
	};

	BufferList.prototype.clear = function () {
	  this.head = this.tail = null;
	  this.length = 0;
	};

	BufferList.prototype.join = function (s) {
	  if (this.length === 0) return '';
	  var p = this.head;
	  var ret = '' + p.data;
	  while (p = p.next) {
	    ret += s + p.data;
	  }return ret;
	};

	BufferList.prototype.concat = function (n) {
	  if (this.length === 0) return bufferShim.alloc(0);
	  if (this.length === 1) return this.head.data;
	  var ret = bufferShim.allocUnsafe(n >>> 0);
	  var p = this.head;
	  var i = 0;
	  while (p) {
	    p.data.copy(ret, i);
	    i += p.data.length;
	    p = p.next;
	  }
	  return ret;
	};

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.

	'use strict';

	/*<replacement>*/

	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    keys.push(key);
	  }return keys;
	};
	/*</replacement>*/

	module.exports = Duplex;

	/*<replacement>*/
	var processNextTick = __webpack_require__(34);
	/*</replacement>*/

	/*<replacement>*/
	var util = __webpack_require__(37);
	util.inherits = __webpack_require__(17);
	/*</replacement>*/

	var Readable = __webpack_require__(33);
	var Writable = __webpack_require__(41);

	util.inherits(Duplex, Readable);

	var keys = objectKeys(Writable.prototype);
	for (var v = 0; v < keys.length; v++) {
	  var method = keys[v];
	  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	}

	function Duplex(options) {
	  if (!(this instanceof Duplex)) return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false) this.readable = false;

	  if (options && options.writable === false) this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended) return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  processNextTick(onEndNT, this);
	}

	function onEndNT(self) {
	  self.end();
	}

	function forEach(xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, setImmediate) {// A bit simpler than readable streams.
	// Implement an async ._write(chunk, encoding, cb), and it'll handle all
	// the drain event emission and buffering.

	'use strict';

	module.exports = Writable;

	/*<replacement>*/
	var processNextTick = __webpack_require__(34);
	/*</replacement>*/

	/*<replacement>*/
	var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
	/*</replacement>*/

	/*<replacement>*/
	var Duplex;
	/*</replacement>*/

	Writable.WritableState = WritableState;

	/*<replacement>*/
	var util = __webpack_require__(37);
	util.inherits = __webpack_require__(17);
	/*</replacement>*/

	/*<replacement>*/
	var internalUtil = {
	  deprecate: __webpack_require__(44)
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream = __webpack_require__(35);
	/*</replacement>*/

	var Buffer = __webpack_require__(2).Buffer;
	/*<replacement>*/
	var bufferShim = __webpack_require__(36);
	/*</replacement>*/

	util.inherits(Writable, Stream);

	function nop() {}

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	  this.next = null;
	}

	function WritableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(40);

	  options = options || {};

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;

	  // drain event flag.
	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function (er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.bufferedRequest = null;
	  this.lastBufferedRequest = null;

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;

	  // count buffered requests
	  this.bufferedRequestCount = 0;

	  // allocate the first CorkedRequest, there is always
	  // one allocated and free to use, and we maintain at most two
	  this.corkedRequestsFree = new CorkedRequest(this);
	}

	WritableState.prototype.getBuffer = function getBuffer() {
	  var current = this.bufferedRequest;
	  var out = [];
	  while (current) {
	    out.push(current);
	    current = current.next;
	  }
	  return out;
	};

	(function () {
	  try {
	    Object.defineProperty(WritableState.prototype, 'buffer', {
	      get: internalUtil.deprecate(function () {
	        return this.getBuffer();
	      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
	    });
	  } catch (_) {}
	})();

	// Test _writableState for inheritance to account for Duplex streams,
	// whose prototype chain only points to Readable.
	var realHasInstance;
	if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
	  realHasInstance = Function.prototype[Symbol.hasInstance];
	  Object.defineProperty(Writable, Symbol.hasInstance, {
	    value: function (object) {
	      if (realHasInstance.call(this, object)) return true;

	      return object && object._writableState instanceof WritableState;
	    }
	  });
	} else {
	  realHasInstance = function (object) {
	    return object instanceof this;
	  };
	}

	function Writable(options) {
	  Duplex = Duplex || __webpack_require__(40);

	  // Writable ctor is applied to Duplexes, too.
	  // `realHasInstance` is necessary because using plain `instanceof`
	  // would return false, as no `_writableState` property is attached.

	  // Trying to use the custom `instanceof` for Writable here will also break the
	  // Node.js LazyTransform implementation, which has a non-trivial getter for
	  // `_writableState` that would lead to infinite recursion.
	  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
	    return new Writable(options);
	  }

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  if (options) {
	    if (typeof options.write === 'function') this._write = options.write;

	    if (typeof options.writev === 'function') this._writev = options.writev;
	  }

	  Stream.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function () {
	  this.emit('error', new Error('Cannot pipe, not readable'));
	};

	function writeAfterEnd(stream, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  processNextTick(cb, er);
	}

	// Checks that a user-supplied chunk is valid, especially for the particular
	// mode the stream is in. Currently this means that `null` is never accepted
	// and undefined/non-string values are only allowed in object mode.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  var er = false;

	  if (chunk === null) {
	    er = new TypeError('May not write null values to stream');
	  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  if (er) {
	    stream.emit('error', er);
	    processNextTick(cb, er);
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function (chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;
	  var isBuf = Buffer.isBuffer(chunk);

	  if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

	  if (typeof cb !== 'function') cb = nop;

	  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function () {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function () {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
	  }
	};

	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
	  // node::ParseEncoding() requires lower case.
	  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
	  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
	  this._writableState.defaultEncoding = encoding;
	  return this;
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
	    chunk = bufferShim.from(chunk, encoding);
	  }
	  return chunk;
	}

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
	  if (!isBuf) {
	    chunk = decodeChunk(state, chunk, encoding);
	    if (Buffer.isBuffer(chunk)) encoding = 'buffer';
	  }
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret) state.needDrain = true;

	  if (state.writing || state.corked) {
	    var last = state.lastBufferedRequest;
	    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
	    if (last) {
	      last.next = state.lastBufferedRequest;
	    } else {
	      state.bufferedRequest = state.lastBufferedRequest;
	    }
	    state.bufferedRequestCount += 1;
	  } else {
	    doWrite(stream, state, false, len, chunk, encoding, cb);
	  }

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  --state.pendingcb;
	  if (sync) processNextTick(cb, er);else cb(er);

	  stream._writableState.errorEmitted = true;
	  stream.emit('error', er);
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er) onwriteError(stream, state, sync, er, cb);else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(state);

	    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      /*<replacement>*/
	      asyncWrite(afterWrite, stream, state, finished, cb);
	      /*</replacement>*/
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished) onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}

	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;
	  var entry = state.bufferedRequest;

	  if (stream._writev && entry && entry.next) {
	    // Fast case, write everything using _writev()
	    var l = state.bufferedRequestCount;
	    var buffer = new Array(l);
	    var holder = state.corkedRequestsFree;
	    holder.entry = entry;

	    var count = 0;
	    while (entry) {
	      buffer[count] = entry;
	      entry = entry.next;
	      count += 1;
	    }

	    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

	    // doWrite is almost always async, defer these to save a bit of time
	    // as the hot path ends with doWrite
	    state.pendingcb++;
	    state.lastBufferedRequest = null;
	    if (holder.next) {
	      state.corkedRequestsFree = holder.next;
	      holder.next = null;
	    } else {
	      state.corkedRequestsFree = new CorkedRequest(state);
	    }
	  } else {
	    // Slow case, write chunks one-by-one
	    while (entry) {
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);
	      entry = entry.next;
	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        break;
	      }
	    }

	    if (entry === null) state.lastBufferedRequest = null;
	  }

	  state.bufferedRequestCount = 0;
	  state.bufferedRequest = entry;
	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function (chunk, encoding, cb) {
	  cb(new Error('_write() is not implemented'));
	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function (chunk, encoding, cb) {
	  var state = this._writableState;

	  if (typeof chunk === 'function') {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished) endWritable(this, state, cb);
	};

	function needFinish(state) {
	  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
	}

	function prefinish(stream, state) {
	  if (!state.prefinished) {
	    state.prefinished = true;
	    stream.emit('prefinish');
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(state);
	  if (need) {
	    if (state.pendingcb === 0) {
	      prefinish(stream, state);
	      state.finished = true;
	      stream.emit('finish');
	    } else {
	      prefinish(stream, state);
	    }
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
	  }
	  state.ended = true;
	  stream.writable = false;
	}

	// It seems a linked list but it is not
	// there will be only 2 of these for each stream
	function CorkedRequest(state) {
	  var _this = this;

	  this.next = null;
	  this.entry = null;
	  this.finish = function (err) {
	    var entry = _this.entry;
	    _this.entry = null;
	    while (entry) {
	      var cb = entry.callback;
	      state.pendingcb--;
	      cb(err);
	      entry = entry.next;
	    }
	    if (state.corkedRequestsFree) {
	      state.corkedRequestsFree.next = _this;
	    } else {
	      state.corkedRequestsFree = _this;
	    }
	  };
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10), __webpack_require__(42).setImmediate))

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var apply = Function.prototype.apply;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) {
	  if (timeout) {
	    timeout.close();
	  }
	};

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// setimmediate attaches itself to the global object
	__webpack_require__(43);
	exports.setImmediate = setImmediate;
	exports.clearImmediate = clearImmediate;


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
	    "use strict";

	    if (global.setImmediate) {
	        return;
	    }

	    var nextHandle = 1; // Spec says greater than zero
	    var tasksByHandle = {};
	    var currentlyRunningATask = false;
	    var doc = global.document;
	    var registerImmediate;

	    function setImmediate(callback) {
	      // Callback can either be a function or a string
	      if (typeof callback !== "function") {
	        callback = new Function("" + callback);
	      }
	      // Copy function arguments
	      var args = new Array(arguments.length - 1);
	      for (var i = 0; i < args.length; i++) {
	          args[i] = arguments[i + 1];
	      }
	      // Store and register the task
	      var task = { callback: callback, args: args };
	      tasksByHandle[nextHandle] = task;
	      registerImmediate(nextHandle);
	      return nextHandle++;
	    }

	    function clearImmediate(handle) {
	        delete tasksByHandle[handle];
	    }

	    function run(task) {
	        var callback = task.callback;
	        var args = task.args;
	        switch (args.length) {
	        case 0:
	            callback();
	            break;
	        case 1:
	            callback(args[0]);
	            break;
	        case 2:
	            callback(args[0], args[1]);
	            break;
	        case 3:
	            callback(args[0], args[1], args[2]);
	            break;
	        default:
	            callback.apply(undefined, args);
	            break;
	        }
	    }

	    function runIfPresent(handle) {
	        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
	        // So if we're currently running a task, we'll need to delay this invocation.
	        if (currentlyRunningATask) {
	            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
	            // "too much recursion" error.
	            setTimeout(runIfPresent, 0, handle);
	        } else {
	            var task = tasksByHandle[handle];
	            if (task) {
	                currentlyRunningATask = true;
	                try {
	                    run(task);
	                } finally {
	                    clearImmediate(handle);
	                    currentlyRunningATask = false;
	                }
	            }
	        }
	    }

	    function installNextTickImplementation() {
	        registerImmediate = function(handle) {
	            process.nextTick(function () { runIfPresent(handle); });
	        };
	    }

	    function canUsePostMessage() {
	        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
	        // where `global.postMessage` means something completely different and can't be used for this purpose.
	        if (global.postMessage && !global.importScripts) {
	            var postMessageIsAsynchronous = true;
	            var oldOnMessage = global.onmessage;
	            global.onmessage = function() {
	                postMessageIsAsynchronous = false;
	            };
	            global.postMessage("", "*");
	            global.onmessage = oldOnMessage;
	            return postMessageIsAsynchronous;
	        }
	    }

	    function installPostMessageImplementation() {
	        // Installs an event handler on `global` for the `message` event: see
	        // * https://developer.mozilla.org/en/DOM/window.postMessage
	        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

	        var messagePrefix = "setImmediate$" + Math.random() + "$";
	        var onGlobalMessage = function(event) {
	            if (event.source === global &&
	                typeof event.data === "string" &&
	                event.data.indexOf(messagePrefix) === 0) {
	                runIfPresent(+event.data.slice(messagePrefix.length));
	            }
	        };

	        if (global.addEventListener) {
	            global.addEventListener("message", onGlobalMessage, false);
	        } else {
	            global.attachEvent("onmessage", onGlobalMessage);
	        }

	        registerImmediate = function(handle) {
	            global.postMessage(messagePrefix + handle, "*");
	        };
	    }

	    function installMessageChannelImplementation() {
	        var channel = new MessageChannel();
	        channel.port1.onmessage = function(event) {
	            var handle = event.data;
	            runIfPresent(handle);
	        };

	        registerImmediate = function(handle) {
	            channel.port2.postMessage(handle);
	        };
	    }

	    function installReadyStateChangeImplementation() {
	        var html = doc.documentElement;
	        registerImmediate = function(handle) {
	            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	            var script = doc.createElement("script");
	            script.onreadystatechange = function () {
	                runIfPresent(handle);
	                script.onreadystatechange = null;
	                html.removeChild(script);
	                script = null;
	            };
	            html.appendChild(script);
	        };
	    }

	    function installSetTimeoutImplementation() {
	        registerImmediate = function(handle) {
	            setTimeout(runIfPresent, 0, handle);
	        };
	    }

	    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
	    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

	    // Don't get fooled by e.g. browserify environments.
	    if ({}.toString.call(global.process) === "[object process]") {
	        // For Node.js before 0.9
	        installNextTickImplementation();

	    } else if (canUsePostMessage()) {
	        // For non-IE10 modern browsers
	        installPostMessageImplementation();

	    } else if (global.MessageChannel) {
	        // For web workers, where supported
	        installMessageChannelImplementation();

	    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
	        // For IE 6–8
	        installReadyStateChangeImplementation();

	    } else {
	        // For older browsers
	        installSetTimeoutImplementation();
	    }

	    attachTo.setImmediate = setImmediate;
	    attachTo.clearImmediate = clearImmediate;
	}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(10)))

/***/ },
/* 44 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {
	/**
	 * Module exports.
	 */

	module.exports = deprecate;

	/**
	 * Mark that a method should not be used.
	 * Returns a modified function which warns once by default.
	 *
	 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
	 *
	 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
	 * will throw an Error when invoked.
	 *
	 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
	 * will invoke `console.trace()` instead of `console.error()`.
	 *
	 * @param {Function} fn - the function to deprecate
	 * @param {String} msg - the string to print to the console when `fn` is invoked
	 * @returns {Function} a new "deprecated" version of `fn`
	 * @api public
	 */

	function deprecate (fn, msg) {
	  if (config('noDeprecation')) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (config('throwDeprecation')) {
	        throw new Error(msg);
	      } else if (config('traceDeprecation')) {
	        console.trace(msg);
	      } else {
	        console.warn(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	}

	/**
	 * Checks `localStorage` for boolean values for the given `name`.
	 *
	 * @param {String} name
	 * @returns {Boolean}
	 * @api private
	 */

	function config (name) {
	  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
	  try {
	    if (!global.localStorage) return false;
	  } catch (_) {
	    return false;
	  }
	  var val = global.localStorage[name];
	  if (null == val) return false;
	  return String(val).toLowerCase() === 'true';
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Buffer = __webpack_require__(2).Buffer;
	var bufferShim = __webpack_require__(36);

	var isEncoding = Buffer.isEncoding || function (encoding) {
	  encoding = '' + encoding;
	  switch (encoding && encoding.toLowerCase()) {
	    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
	      return true;
	    default:
	      return false;
	  }
	};

	function _normalizeEncoding(enc) {
	  if (!enc) return 'utf8';
	  var retried;
	  while (true) {
	    switch (enc) {
	      case 'utf8':
	      case 'utf-8':
	        return 'utf8';
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return 'utf16le';
	      case 'latin1':
	      case 'binary':
	        return 'latin1';
	      case 'base64':
	      case 'ascii':
	      case 'hex':
	        return enc;
	      default:
	        if (retried) return; // undefined
	        enc = ('' + enc).toLowerCase();
	        retried = true;
	    }
	  }
	};

	// Do not cache `Buffer.isEncoding` when checking encoding names as some
	// modules monkey-patch it to support additional encodings
	function normalizeEncoding(enc) {
	  var nenc = _normalizeEncoding(enc);
	  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
	  return nenc || enc;
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters.
	exports.StringDecoder = StringDecoder;
	function StringDecoder(encoding) {
	  this.encoding = normalizeEncoding(encoding);
	  var nb;
	  switch (this.encoding) {
	    case 'utf16le':
	      this.text = utf16Text;
	      this.end = utf16End;
	      nb = 4;
	      break;
	    case 'utf8':
	      this.fillLast = utf8FillLast;
	      nb = 4;
	      break;
	    case 'base64':
	      this.text = base64Text;
	      this.end = base64End;
	      nb = 3;
	      break;
	    default:
	      this.write = simpleWrite;
	      this.end = simpleEnd;
	      return;
	  }
	  this.lastNeed = 0;
	  this.lastTotal = 0;
	  this.lastChar = bufferShim.allocUnsafe(nb);
	}

	StringDecoder.prototype.write = function (buf) {
	  if (buf.length === 0) return '';
	  var r;
	  var i;
	  if (this.lastNeed) {
	    r = this.fillLast(buf);
	    if (r === undefined) return '';
	    i = this.lastNeed;
	    this.lastNeed = 0;
	  } else {
	    i = 0;
	  }
	  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
	  return r || '';
	};

	StringDecoder.prototype.end = utf8End;

	// Returns only complete characters in a Buffer
	StringDecoder.prototype.text = utf8Text;

	// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
	StringDecoder.prototype.fillLast = function (buf) {
	  if (this.lastNeed <= buf.length) {
	    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
	  }
	  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
	  this.lastNeed -= buf.length;
	};

	// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
	// continuation byte.
	function utf8CheckByte(byte) {
	  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
	  return -1;
	}

	// Checks at most 3 bytes at the end of a Buffer in order to detect an
	// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
	// needed to complete the UTF-8 character (if applicable) are returned.
	function utf8CheckIncomplete(self, buf, i) {
	  var j = buf.length - 1;
	  if (j < i) return 0;
	  var nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) self.lastNeed = nb - 1;
	    return nb;
	  }
	  if (--j < i) return 0;
	  nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) self.lastNeed = nb - 2;
	    return nb;
	  }
	  if (--j < i) return 0;
	  nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) {
	      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
	    }
	    return nb;
	  }
	  return 0;
	}

	// Validates as many continuation bytes for a multi-byte UTF-8 character as
	// needed or are available. If we see a non-continuation byte where we expect
	// one, we "replace" the validated continuation bytes we've seen so far with
	// UTF-8 replacement characters ('\ufffd'), to match v8's UTF-8 decoding
	// behavior. The continuation byte check is included three times in the case
	// where all of the continuation bytes for a character exist in the same buffer.
	// It is also done this way as a slight performance increase instead of using a
	// loop.
	function utf8CheckExtraBytes(self, buf, p) {
	  if ((buf[0] & 0xC0) !== 0x80) {
	    self.lastNeed = 0;
	    return '\ufffd'.repeat(p);
	  }
	  if (self.lastNeed > 1 && buf.length > 1) {
	    if ((buf[1] & 0xC0) !== 0x80) {
	      self.lastNeed = 1;
	      return '\ufffd'.repeat(p + 1);
	    }
	    if (self.lastNeed > 2 && buf.length > 2) {
	      if ((buf[2] & 0xC0) !== 0x80) {
	        self.lastNeed = 2;
	        return '\ufffd'.repeat(p + 2);
	      }
	    }
	  }
	}

	// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
	function utf8FillLast(buf) {
	  var p = this.lastTotal - this.lastNeed;
	  var r = utf8CheckExtraBytes(this, buf, p);
	  if (r !== undefined) return r;
	  if (this.lastNeed <= buf.length) {
	    buf.copy(this.lastChar, p, 0, this.lastNeed);
	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
	  }
	  buf.copy(this.lastChar, p, 0, buf.length);
	  this.lastNeed -= buf.length;
	}

	// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
	// partial character, the character's bytes are buffered until the required
	// number of bytes are available.
	function utf8Text(buf, i) {
	  var total = utf8CheckIncomplete(this, buf, i);
	  if (!this.lastNeed) return buf.toString('utf8', i);
	  this.lastTotal = total;
	  var end = buf.length - (total - this.lastNeed);
	  buf.copy(this.lastChar, 0, end);
	  return buf.toString('utf8', i, end);
	}

	// For UTF-8, a replacement character for each buffered byte of a (partial)
	// character needs to be added to the output.
	function utf8End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) return r + '\ufffd'.repeat(this.lastTotal - this.lastNeed);
	  return r;
	}

	// UTF-16LE typically needs two bytes per character, but even if we have an even
	// number of bytes available, we need to check if we end on a leading/high
	// surrogate. In that case, we need to wait for the next two bytes in order to
	// decode the last character properly.
	function utf16Text(buf, i) {
	  if ((buf.length - i) % 2 === 0) {
	    var r = buf.toString('utf16le', i);
	    if (r) {
	      var c = r.charCodeAt(r.length - 1);
	      if (c >= 0xD800 && c <= 0xDBFF) {
	        this.lastNeed = 2;
	        this.lastTotal = 4;
	        this.lastChar[0] = buf[buf.length - 2];
	        this.lastChar[1] = buf[buf.length - 1];
	        return r.slice(0, -1);
	      }
	    }
	    return r;
	  }
	  this.lastNeed = 1;
	  this.lastTotal = 2;
	  this.lastChar[0] = buf[buf.length - 1];
	  return buf.toString('utf16le', i, buf.length - 1);
	}

	// For UTF-16LE we do not explicitly append special replacement characters if we
	// end on a partial character, we simply let v8 handle that.
	function utf16End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) {
	    var end = this.lastTotal - this.lastNeed;
	    return r + this.lastChar.toString('utf16le', 0, end);
	  }
	  return r;
	}

	function base64Text(buf, i) {
	  var n = (buf.length - i) % 3;
	  if (n === 0) return buf.toString('base64', i);
	  this.lastNeed = 3 - n;
	  this.lastTotal = 3;
	  if (n === 1) {
	    this.lastChar[0] = buf[buf.length - 1];
	  } else {
	    this.lastChar[0] = buf[buf.length - 2];
	    this.lastChar[1] = buf[buf.length - 1];
	  }
	  return buf.toString('base64', i, buf.length - n);
	}

	function base64End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
	  return r;
	}

	// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
	function simpleWrite(buf) {
	  return buf.toString(this.encoding);
	}

	function simpleEnd(buf) {
	  return buf && buf.length ? this.write(buf) : '';
	}

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.

	'use strict';

	module.exports = Transform;

	var Duplex = __webpack_require__(40);

	/*<replacement>*/
	var util = __webpack_require__(37);
	util.inherits = __webpack_require__(17);
	/*</replacement>*/

	util.inherits(Transform, Duplex);

	function TransformState(stream) {
	  this.afterTransform = function (er, data) {
	    return afterTransform(stream, er, data);
	  };

	  this.needTransform = false;
	  this.transforming = false;
	  this.writecb = null;
	  this.writechunk = null;
	  this.writeencoding = null;
	}

	function afterTransform(stream, er, data) {
	  var ts = stream._transformState;
	  ts.transforming = false;

	  var cb = ts.writecb;

	  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

	  ts.writechunk = null;
	  ts.writecb = null;

	  if (data !== null && data !== undefined) stream.push(data);

	  cb(er);

	  var rs = stream._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    stream._read(rs.highWaterMark);
	  }
	}

	function Transform(options) {
	  if (!(this instanceof Transform)) return new Transform(options);

	  Duplex.call(this, options);

	  this._transformState = new TransformState(this);

	  var stream = this;

	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;

	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;

	  if (options) {
	    if (typeof options.transform === 'function') this._transform = options.transform;

	    if (typeof options.flush === 'function') this._flush = options.flush;
	  }

	  // When the writable side finishes, then flush out anything remaining.
	  this.once('prefinish', function () {
	    if (typeof this._flush === 'function') this._flush(function (er, data) {
	      done(stream, er, data);
	    });else done(stream);
	  });
	}

	Transform.prototype.push = function (chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};

	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function (chunk, encoding, cb) {
	  throw new Error('_transform() is not implemented');
	};

	Transform.prototype._write = function (chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
	  }
	};

	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function (n) {
	  var ts = this._transformState;

	  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};

	function done(stream, er, data) {
	  if (er) return stream.emit('error', er);

	  if (data !== null && data !== undefined) stream.push(data);

	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  var ws = stream._writableState;
	  var ts = stream._transformState;

	  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

	  if (ts.transforming) throw new Error('Calling transform done when still transforming');

	  return stream.push(null);
	}

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.

	'use strict';

	module.exports = PassThrough;

	var Transform = __webpack_require__(46);

	/*<replacement>*/
	var util = __webpack_require__(37);
	util.inherits = __webpack_require__(17);
	/*</replacement>*/

	util.inherits(PassThrough, Transform);

	function PassThrough(options) {
	  if (!(this instanceof PassThrough)) return new PassThrough(options);

	  Transform.call(this, options);
	}

	PassThrough.prototype._transform = function (chunk, encoding, cb) {
	  cb(null, chunk);
	};

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(41);


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(40);


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(32).Transform


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(32).PassThrough


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	var ERRORS = __webpack_require__(53)
	var NATIVE = __webpack_require__(54)

	// short-hand
	var tfJSON = ERRORS.tfJSON
	var TfTypeError = ERRORS.TfTypeError
	var TfPropertyTypeError = ERRORS.TfPropertyTypeError
	var tfSubError = ERRORS.tfSubError
	var getValueTypeName = ERRORS.getValueTypeName

	var TYPES = {
	  arrayOf: function arrayOf (type) {
	    type = compile(type)

	    function _arrayOf (array, strict) {
	      if (!NATIVE.Array(array)) return false

	      return array.every(function (value, i) {
	        try {
	          return typeforce(type, value, strict)
	        } catch (e) {
	          throw tfSubError(e, i)
	        }
	      })
	    }
	    _arrayOf.toJSON = function () { return '[' + tfJSON(type) + ']' }

	    return _arrayOf
	  },

	  maybe: function maybe (type) {
	    type = compile(type)

	    function _maybe (value, strict) {
	      return NATIVE.Null(value) || type(value, strict, maybe)
	    }
	    _maybe.toJSON = function () { return '?' + tfJSON(type) }

	    return _maybe
	  },

	  map: function map (propertyType, propertyKeyType) {
	    propertyType = compile(propertyType)
	    if (propertyKeyType) propertyKeyType = compile(propertyKeyType)

	    function _map (value, strict) {
	      if (!NATIVE.Object(value, strict)) return false
	      if (NATIVE.Null(value, strict)) return false

	      for (var propertyName in value) {
	        try {
	          if (propertyKeyType) {
	            typeforce(propertyKeyType, propertyName, strict)
	          }
	        } catch (e) {
	          throw tfSubError(e, propertyName, 'key')
	        }

	        try {
	          var propertyValue = value[propertyName]
	          typeforce(propertyType, propertyValue, strict)
	        } catch (e) {
	          throw tfSubError(e, propertyName)
	        }
	      }

	      return true
	    }

	    if (propertyKeyType) {
	      _map.toJSON = function () {
	        return '{' + tfJSON(propertyKeyType) + ': ' + tfJSON(propertyType) + '}'
	      }
	    } else {
	      _map.toJSON = function () { return '{' + tfJSON(propertyType) + '}' }
	    }

	    return _map
	  },

	  object: function object (uncompiled) {
	    var type = {}

	    for (var typePropertyName in uncompiled) {
	      type[typePropertyName] = compile(uncompiled[typePropertyName])
	    }

	    function _object (value, strict) {
	      if (!NATIVE.Object(value)) return false
	      if (NATIVE.Null(value)) return false

	      var propertyName

	      try {
	        for (propertyName in type) {
	          var propertyType = type[propertyName]
	          var propertyValue = value[propertyName]

	          typeforce(propertyType, propertyValue, strict)
	        }
	      } catch (e) {
	        throw tfSubError(e, propertyName)
	      }

	      if (strict) {
	        for (propertyName in value) {
	          if (type[propertyName]) continue

	          throw new TfPropertyTypeError(undefined, propertyName)
	        }
	      }

	      return true
	    }
	    _object.toJSON = function () { return tfJSON(type) }

	    return _object
	  },

	  oneOf: function oneOf () {
	    var types = [].slice.call(arguments).map(compile)

	    function _oneOf (value, strict) {
	      return types.some(function (type) {
	        try {
	          return typeforce(type, value, strict)
	        } catch (e) {
	          return false
	        }
	      })
	    }
	    _oneOf.toJSON = function () { return types.map(tfJSON).join('|') }

	    return _oneOf
	  },

	  quacksLike: function quacksLike (type) {
	    function _quacksLike (value) {
	      return type === getValueTypeName(value)
	    }
	    _quacksLike.toJSON = function () { return type }

	    return _quacksLike
	  },

	  tuple: function tuple () {
	    var types = [].slice.call(arguments).map(compile)

	    function _tuple (values, strict) {
	      return types.every(function (type, i) {
	        try {
	          return typeforce(type, values[i], strict)
	        } catch (e) {
	          throw tfSubError(e, i)
	        }
	      }) && (!strict || values.length === arguments.length)
	    }
	    _tuple.toJSON = function () { return '(' + types.map(tfJSON).join(', ') + ')' }

	    return _tuple
	  },

	  value: function value (expected) {
	    function _value (actual) {
	      return actual === expected
	    }
	    _value.toJSON = function () { return expected }

	    return _value
	  }
	}

	function compile (type) {
	  if (NATIVE.String(type)) {
	    if (type[0] === '?') return TYPES.maybe(compile(type.slice(1)))

	    return NATIVE[type] || TYPES.quacksLike(type)
	  } else if (type && NATIVE.Object(type)) {
	    if (NATIVE.Array(type)) return TYPES.arrayOf(compile(type[0]))

	    return TYPES.object(type)
	  } else if (NATIVE.Function(type)) {
	    return type
	  }

	  return TYPES.value(type)
	}

	function typeforce (type, value, strict, surrogate) {
	  if (NATIVE.Function(type)) {
	    if (type(value, strict)) return true

	    throw new TfTypeError(surrogate || type, value)
	  }

	  // JIT
	  return typeforce(compile(type), value, strict)
	}

	// assign types to typeforce function
	for (var typeName in NATIVE) {
	  typeforce[typeName] = NATIVE[typeName]
	}

	for (typeName in TYPES) {
	  typeforce[typeName] = TYPES[typeName]
	}

	var extra = __webpack_require__(55)
	for (typeName in extra) {
	  typeforce[typeName] = extra[typeName]
	}

	// async wrapper
	function __async (type, value, strict, callback) {
	  // default to falsy strict if using shorthand overload
	  if (typeof strict === 'function') return __async(type, value, false, strict)

	  try {
	    typeforce(type, value, strict)
	  } catch (e) {
	    return callback(e)
	  }

	  callback()
	}

	typeforce.async = __async
	typeforce.compile = compile
	typeforce.TfTypeError = TfTypeError
	typeforce.TfPropertyTypeError = TfPropertyTypeError

	module.exports = typeforce


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(17)
	var native = __webpack_require__(54)

	function TfTypeError (type, value, valueTypeName) {
	  this.__error = Error.call(this)
	  this.__type = type
	  this.__value = value
	  this.__valueTypeName = valueTypeName

	  var message
	  Object.defineProperty(this, 'message', {
	    enumerable: true,
	    get: function () {
	      if (message) return message

	      valueTypeName = valueTypeName || getValueTypeName(value)
	      message = tfErrorString(type, value, valueTypeName)

	      return message
	    }
	  })
	}

	function TfPropertyTypeError (type, property, label, value, error, valueTypeName) {
	  this.__error = error || Error.call(this)
	  this.__label = label
	  this.__property = property
	  this.__type = type
	  this.__value = value
	  this.__valueTypeName = valueTypeName

	  var message
	  Object.defineProperty(this, 'message', {
	    enumerable: true,
	    get: function () {
	      if (message) return message
	      if (type) {
	        valueTypeName = valueTypeName || getValueTypeName(value)
	        message = tfPropertyErrorString(type, label, property, value, valueTypeName)
	      } else {
	        message = 'Unexpected property "' + property + '"'
	      }

	      return message
	    }
	  })
	}

	// inherit from Error, assign stack
	[TfTypeError, TfPropertyTypeError].forEach(function (tfErrorType) {
	  inherits(tfErrorType, Error)
	  Object.defineProperty(tfErrorType, 'stack', {
	    get: function () { return this.__error.stack }
	  })
	})

	function tfCustomError (expected, actual) {
	  return new TfTypeError(expected, {}, actual)
	}

	function tfSubError (e, property, label) {
	  // sub child?
	  if (e instanceof TfPropertyTypeError) {
	    property = property + '.' + e.__property
	    label = e.__label

	    return new TfPropertyTypeError(
	      e.__type, property, label, e.__value, e.__error, e.__valueTypeName
	    )
	  }

	  // child?
	  if (e instanceof TfTypeError) {
	    return new TfPropertyTypeError(
	      e.__type, property, label, e.__value, e.__error, e.__valueTypeName
	    )
	  }

	  return e
	}

	function getTypeName (fn) {
	  return fn.name || fn.toString().match(/function (.*?)\s*\(/)[1]
	}

	function getValueTypeName (value) {
	  return native.Null(value) ? '' : getTypeName(value.constructor)
	}

	function getValue (value) {
	  if (native.Function(value)) return ''
	  if (native.String(value)) return JSON.stringify(value)
	  if (value && native.Object(value)) return ''
	  return value
	}

	function tfJSON (type) {
	  if (native.Function(type)) return type.toJSON ? type.toJSON() : getTypeName(type)
	  if (native.Array(type)) return 'Array'
	  if (type && native.Object(type)) return 'Object'

	  return type !== undefined ? type : ''
	}

	function tfErrorString (type, value, valueTypeName) {
	  var valueJson = getValue(value)

	  return 'Expected ' + tfJSON(type) + ', got' +
	    (valueTypeName !== '' ? ' ' + valueTypeName : '') +
	    (valueJson !== '' ? ' ' + valueJson : '')
	}

	function tfPropertyErrorString (type, label, name, value, valueTypeName) {
	  var description = '" of type '
	  if (label === 'key') description = '" with key type '

	  return tfErrorString('property "' + tfJSON(name) + description + tfJSON(type), value, valueTypeName)
	}

	module.exports = {
	  TfTypeError: TfTypeError,
	  TfPropertyTypeError: TfPropertyTypeError,
	  tfCustomError: tfCustomError,
	  tfSubError: tfSubError,
	  tfJSON: tfJSON,
	  getValueTypeName: getValueTypeName
	}


/***/ },
/* 54 */
/***/ function(module, exports) {

	var types = {
	  Array: function (value) { return value !== null && value !== undefined && value.constructor === Array },
	  Boolean: function (value) { return typeof value === 'boolean' },
	  Function: function (value) { return typeof value === 'function' },
	  Null: function (value) { return value === undefined || value === null },
	  Number: function (value) { return typeof value === 'number' },
	  Object: function (value) { return typeof value === 'object' },
	  String: function (value) { return typeof value === 'string' },
	  '': function () { return true }
	}

	for (var typeName in types) {
	  types[typeName].toJSON = function (t) {
	    return t
	  }.bind(null, typeName)
	}

	module.exports = types


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var errors = __webpack_require__(53)

	function _Buffer (value) {
	  return Buffer.isBuffer(value)
	}
	_Buffer.toJSON = function () { return 'Buffer' }

	function _BufferN (length) {
	  function BufferN (value) {
	    if (!Buffer.isBuffer(value)) return false
	    if (value.length !== length) {
	      throw errors.tfCustomError('Buffer(Length: ' + length + ')', 'Buffer(Length: ' + value.length + ')')
	    }

	    return true
	  }
	  BufferN.toJSON = function () { return 'Buffer' }

	  return BufferN
	}

	function Hex (value) {
	  return typeof value === 'string' && /^([0-9a-f]{2})+$/i.test(value)
	}

	function _HexN (length) {
	  function HexN (value) {
	    if (!Hex(value)) return false
	    if (value.length !== length) {
	      throw errors.tfCustomError('Hex(Length: ' + length + ')', 'Hex(Length: ' + value.length + ')')
	    }

	    return true
	  }
	  HexN.toJSON = function () { return 'Hex' }

	  return HexN
	}

	var UINT53_MAX = Math.pow(2, 53) - 1

	function Finite (value) {
	  return typeof value === 'number' && isFinite(value)
	}
	function Int8 (value) { return ((value << 24) >> 24) === value }
	function Int16 (value) { return ((value << 16) >> 16) === value }
	function Int32 (value) { return (value | 0) === value }
	function UInt8 (value) { return (value & 0xff) === value }
	function UInt16 (value) { return (value & 0xffff) === value }
	function UInt32 (value) { return (value >>> 0) === value }
	function UInt53 (value) {
	  return typeof value === 'number' &&
	    value >= 0 &&
	    value <= UINT53_MAX &&
	    Math.floor(value) === value
	}

	module.exports = {
	  Buffer: _Buffer,
	  BufferN: _BufferN,
	  Finite: Finite,
	  Hex: Hex,
	  HexN: _HexN,
	  Int8: Int8,
	  Int16: Int16,
	  Int32: Int32,
	  UInt8: UInt8,
	  UInt16: UInt16,
	  UInt32: UInt32,
	  UInt53: UInt53
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 56 */
/***/ function(module, exports) {

	// https://en.bitcoin.it/wiki/List_of_address_prefixes
	// Dogecoin BIP32 is a proposed standard: https://bitcointalk.org/index.php?topic=409731

	var networks = {
	  bitcoin: {
	    magicPrefix: '\x18Bitcoin Signed Message:\n',
	    bip32: {
	      public: 0x0488b21e,
	      private: 0x0488ade4
	    },
	    pubKeyHash: 0x00,
	    scriptHash: 0x05,
	    wif: 0x80,
	    dustThreshold: 546, // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
	    feePerKb: 10000, // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/main.cpp#L53
	    estimateFee: estimateFee('bitcoin')
	  },
	  testnet: {
	    magicPrefix: '\x18Bitcoin Signed Message:\n',
	    bip32: {
	      public: 0x043587cf,
	      private: 0x04358394
	    },
	    pubKeyHash: 0x6f,
	    scriptHash: 0xc4,
	    wif: 0xef,
	    dustThreshold: 546,
	    feePerKb: 10000,
	    estimateFee: estimateFee('testnet')
	  },
	  litecoin: {
	    magicPrefix: '\x19Litecoin Signed Message:\n',
	    bip32: {
	      public: 0x019da462,
	      private: 0x019d9cfe
	    },
	    pubKeyHash: 0x30,
	    scriptHash: 0x05,
	    wif: 0xb0,
	    dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
	    dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
	    feePerKb: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
	    estimateFee: estimateFee('litecoin')
	  },
	  dogecoin: {
	    magicPrefix: '\x19Dogecoin Signed Message:\n',
	    bip32: {
	      public: 0x02facafd,
	      private: 0x02fac398
	    },
	    pubKeyHash: 0x1e,
	    scriptHash: 0x16,
	    wif: 0x9e,
	    dustThreshold: 0, // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/core.h#L155-L160
	    dustSoftThreshold: 100000000, // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/main.h#L62
	    feePerKb: 100000000, // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/main.cpp#L58
	    estimateFee: estimateFee('dogecoin')
	  },
	  viacoin: {
	    magicPrefix: '\x18Viacoin Signed Message:\n',
	    bip32: {
	      public: 0x0488b21e,
	      private: 0x0488ade4
	    },
	    pubKeyHash: 0x47,
	    scriptHash: 0x21,
	    wif: 0xc7,
	    dustThreshold: 560,
	    dustSoftThreshold: 100000,
	    feePerKb: 100000, //
	    estimateFee: estimateFee('viacoin')
	  },
	  viacointestnet: {
	    magicPrefix: '\x18Viacoin Signed Message:\n',
	    bip32: {
	      public: 0x043587cf,
	      private: 0x04358394
	    },
	    pubKeyHash: 0x7f,
	    scriptHash: 0xc4,
	    wif: 0xff,
	    dustThreshold: 560,
	    dustSoftThreshold: 100000,
	    feePerKb: 100000,
	    estimateFee: estimateFee('viacointestnet')
	  },
	  gamerscoin: {
	    magicPrefix: '\x19Gamerscoin Signed Message:\n',
	    bip32: {
	      public: 0x019da462,
	      private: 0x019d9cfe
	    },
	    pubKeyHash: 0x26,
	    scriptHash: 0x05,
	    wif: 0xA6,
	    dustThreshold: 0, // https://github.com/gamers-coin/gamers-coinv3/blob/master/src/main.cpp#L358-L363
	    dustSoftThreshold: 100000, // https://github.com/gamers-coin/gamers-coinv3/blob/master/src/main.cpp#L51
	    feePerKb: 100000, // https://github.com/gamers-coin/gamers-coinv3/blob/master/src/main.cpp#L54
	    estimateFee: estimateFee('gamerscoin')
	  },
	  jumbucks: {
	    magicPrefix: '\x19Jumbucks Signed Message:\n',
	    bip32: {
	      public: 0x037a689a,
	      private: 0x037a6460
	    },
	    pubKeyHash: 0x2b,
	    scriptHash: 0x05,
	    wif: 0xab,
	    dustThreshold: 0,
	    dustSoftThreshold: 10000,
	    feePerKb: 10000,
	    estimateFee: estimateFee('jumbucks')
	  },
	  zetacoin: {
	    magicPrefix: '\x18Zetacoin Signed Message:\n',
	    bip32: {
	      public: 0x0488b21e,
	      private: 0x0488ade4
	    },
	    pubKeyHash: 0x50,
	    scriptHash: 0x09,
	    wif: 0xe0,
	    dustThreshold: 546, // https://github.com/zetacoin/zetacoin/blob/master/src/core.h#L159
	    feePerKb: 10000, // https://github.com/zetacoin/zetacoin/blob/master/src/main.cpp#L54
	    estimateFee: estimateFee('zetacoin')
	  }
	}

	function estimateFee (type) {
	  return function (tx) {
	    var network = networks[type]
	    var baseFee = network.feePerKb
	    var byteSize = tx.toBuffer().length

	    var fee = baseFee * Math.ceil(byteSize / 1000)
	    if (network.dustSoftThreshold === undefined) return fee

	    tx.outs.forEach(function (e) {
	      if (e.value < network.dustSoftThreshold) {
	        fee += baseFee
	      }
	    })

	    return fee
	  }
	}

	module.exports = networks


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var ops = __webpack_require__(58)
	var typeForce = __webpack_require__(52)

	var ecurve = __webpack_require__(59)
	var curve = ecurve.getCurveByName('secp256k1')

	var ECSignature = __webpack_require__(68)
	var Script = __webpack_require__(69)

	function isCanonicalPubKey (buffer) {
	  if (!Buffer.isBuffer(buffer)) return false

	  try {
	    ecurve.Point.decodeFrom(curve, buffer)
	  } catch (e) {
	    if (!(e.message.match(/Invalid sequence (length|tag)/)))
	      throw e

	    return false
	  }

	  return true
	}

	function isCanonicalSignature (buffer) {
	  if (!Buffer.isBuffer(buffer)) return false

	  try {
	    ECSignature.parseScriptSignature(buffer)
	  } catch (e) {
	    if (!(e.message.match(/Not a DER sequence|Invalid sequence length|Expected a DER integer|R length is zero|S length is zero|R value excessively padded|S value excessively padded|R value is negative|S value is negative|Invalid hashType/))) {
	      throw e
	    }

	    return false
	  }

	  return true
	}

	function isPubKeyHashInput (script) {
	  return script.chunks.length === 2 &&
	    isCanonicalSignature(script.chunks[0]) &&
	    isCanonicalPubKey(script.chunks[1])
	}

	function isPubKeyHashOutput (script) {
	  return script.chunks.length === 5 &&
	    script.chunks[0] === ops.OP_DUP &&
	    script.chunks[1] === ops.OP_HASH160 &&
	    Buffer.isBuffer(script.chunks[2]) &&
	    script.chunks[2].length === 20 &&
	    script.chunks[3] === ops.OP_EQUALVERIFY &&
	    script.chunks[4] === ops.OP_CHECKSIG
	}

	function isPubKeyInput (script) {
	  return script.chunks.length === 1 &&
	    isCanonicalSignature(script.chunks[0])
	}

	function isPubKeyOutput (script) {
	  return script.chunks.length === 2 &&
	    isCanonicalPubKey(script.chunks[0]) &&
	    script.chunks[1] === ops.OP_CHECKSIG
	}

	function isScriptHashInput (script, allowIncomplete) {
	  if (script.chunks.length < 2) return false

	  var lastChunk = script.chunks[script.chunks.length - 1]
	  if (!Buffer.isBuffer(lastChunk)) return false

	  var scriptSig = Script.fromChunks(script.chunks.slice(0, -1))
	  var redeemScript = Script.fromBuffer(lastChunk)

	  // is redeemScript a valid script?
	  if (redeemScript.chunks.length === 0) return false

	  return classifyInput(scriptSig, allowIncomplete) === classifyOutput(redeemScript)
	}

	function isScriptHashOutput (script) {
	  return script.chunks.length === 3 &&
	    script.chunks[0] === ops.OP_HASH160 &&
	    Buffer.isBuffer(script.chunks[1]) &&
	    script.chunks[1].length === 20 &&
	    script.chunks[2] === ops.OP_EQUAL
	}

	// allowIncomplete is to account for combining signatures
	// See https://github.com/bitcoin/bitcoin/blob/f425050546644a36b0b8e0eb2f6934a3e0f6f80f/src/script/sign.cpp#L195-L197
	function isMultisigInput (script, allowIncomplete) {
	  if (script.chunks.length < 2) return false
	  if (script.chunks[0] !== ops.OP_0) return false

	  if (allowIncomplete) {
	    return script.chunks.slice(1).every(function (chunk) {
	      return chunk === ops.OP_0 || isCanonicalSignature(chunk)
	    })
	  }

	  return script.chunks.slice(1).every(isCanonicalSignature)
	}

	function isMultisigOutput (script) {
	  if (script.chunks.length < 4) return false
	  if (script.chunks[script.chunks.length - 1] !== ops.OP_CHECKMULTISIG) return false

	  var mOp = script.chunks[0]
	  if (mOp === ops.OP_0) return false
	  if (mOp < ops.OP_1) return false
	  if (mOp > ops.OP_16) return false

	  var nOp = script.chunks[script.chunks.length - 2]
	  if (nOp === ops.OP_0) return false
	  if (nOp < ops.OP_1) return false
	  if (nOp > ops.OP_16) return false

	  var m = mOp - (ops.OP_1 - 1)
	  var n = nOp - (ops.OP_1 - 1)
	  if (n < m) return false

	  var pubKeys = script.chunks.slice(1, -2)
	  if (n < pubKeys.length) return false

	  return pubKeys.every(isCanonicalPubKey)
	}

	function isNullDataOutput (script) {
	  return script.chunks[0] === ops.OP_RETURN
	}

	function classifyOutput (script) {
	  typeForce('Script', script)

	  if (isPubKeyHashOutput(script)) {
	    return 'pubkeyhash'
	  } else if (isScriptHashOutput(script)) {
	    return 'scripthash'
	  } else if (isMultisigOutput(script)) {
	    return 'multisig'
	  } else if (isPubKeyOutput(script)) {
	    return 'pubkey'
	  } else if (isNullDataOutput(script)) {
	    return 'nulldata'
	  }

	  return 'nonstandard'
	}

	function classifyInput (script, allowIncomplete) {
	  typeForce('Script', script)

	  if (isPubKeyHashInput(script)) {
	    return 'pubkeyhash'
	  } else if (isMultisigInput(script, allowIncomplete)) {
	    return 'multisig'
	  } else if (isScriptHashInput(script, allowIncomplete)) {
	    return 'scripthash'
	  } else if (isPubKeyInput(script)) {
	    return 'pubkey'
	  }

	  return 'nonstandard'
	}

	// Standard Script Templates
	// {pubKey} OP_CHECKSIG
	function pubKeyOutput (pubKey) {
	  return Script.fromChunks([
	    pubKey.toBuffer(),
	    ops.OP_CHECKSIG
	  ])
	}

	// OP_DUP OP_HASH160 {pubKeyHash} OP_EQUALVERIFY OP_CHECKSIG
	function pubKeyHashOutput (hash) {
	  typeForce('Buffer', hash)

	  return Script.fromChunks([
	    ops.OP_DUP,
	    ops.OP_HASH160,
	    hash,
	    ops.OP_EQUALVERIFY,
	    ops.OP_CHECKSIG
	  ])
	}

	// OP_HASH160 {scriptHash} OP_EQUAL
	function scriptHashOutput (hash) {
	  typeForce('Buffer', hash)

	  return Script.fromChunks([
	    ops.OP_HASH160,
	    hash,
	    ops.OP_EQUAL
	  ])
	}

	// m [pubKeys ...] n OP_CHECKMULTISIG
	function multisigOutput (m, pubKeys) {
	  typeForce(['ECPubKey'], pubKeys)

	  assert(pubKeys.length >= m, 'Not enough pubKeys provided')

	  var pubKeyBuffers = pubKeys.map(function (pubKey) {
	    return pubKey.toBuffer()
	  })
	  var n = pubKeys.length

	  return Script.fromChunks([].concat(
	    (ops.OP_1 - 1) + m,
	    pubKeyBuffers,
	    (ops.OP_1 - 1) + n,
	    ops.OP_CHECKMULTISIG
	  ))
	}

	// {signature}
	function pubKeyInput (signature) {
	  typeForce('Buffer', signature)

	  return Script.fromChunks([signature])
	}

	// {signature} {pubKey}
	function pubKeyHashInput (signature, pubKey) {
	  typeForce('Buffer', signature)

	  return Script.fromChunks([signature, pubKey.toBuffer()])
	}

	// <scriptSig> {serialized scriptPubKey script}
	function scriptHashInput (scriptSig, scriptPubKey) {
	  return Script.fromChunks([].concat(
	    scriptSig.chunks,
	    scriptPubKey.toBuffer()
	  ))
	}

	// OP_0 [signatures ...]
	function multisigInput (signatures, scriptPubKey) {
	  if (scriptPubKey) {
	    assert(isMultisigOutput(scriptPubKey))

	    var mOp = scriptPubKey.chunks[0]
	    var nOp = scriptPubKey.chunks[scriptPubKey.chunks.length - 2]
	    var m = mOp - (ops.OP_1 - 1)
	    var n = nOp - (ops.OP_1 - 1)

	    assert(signatures.length >= m, 'Not enough signatures provided')
	    assert(signatures.length <= n, 'Too many signatures provided')
	  }

	  return Script.fromChunks([].concat(ops.OP_0, signatures))
	}

	function nullDataOutput (data) {
	  return Script.fromChunks([ops.OP_RETURN, data])
	}

	module.exports = {
	  isCanonicalPubKey: isCanonicalPubKey,
	  isCanonicalSignature: isCanonicalSignature,
	  isPubKeyHashInput: isPubKeyHashInput,
	  isPubKeyHashOutput: isPubKeyHashOutput,
	  isPubKeyInput: isPubKeyInput,
	  isPubKeyOutput: isPubKeyOutput,
	  isScriptHashInput: isScriptHashInput,
	  isScriptHashOutput: isScriptHashOutput,
	  isMultisigInput: isMultisigInput,
	  isMultisigOutput: isMultisigOutput,
	  isNullDataOutput: isNullDataOutput,
	  classifyOutput: classifyOutput,
	  classifyInput: classifyInput,
	  pubKeyOutput: pubKeyOutput,
	  pubKeyHashOutput: pubKeyHashOutput,
	  scriptHashOutput: scriptHashOutput,
	  multisigOutput: multisigOutput,
	  pubKeyInput: pubKeyInput,
	  pubKeyHashInput: pubKeyHashInput,
	  scriptHashInput: scriptHashInput,
	  multisigInput: multisigInput,
	  dataOutput: function (data) {
	    console.warn('dataOutput is deprecated, use nullDataOutput by 2.0.0')
	    return nullDataOutput(data)
	  },
	  nullDataOutput: nullDataOutput
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 58 */
/***/ function(module, exports) {

	module.exports = {
	  // push value
	  OP_FALSE: 0,
	  OP_0: 0,
	  OP_PUSHDATA1: 76,
	  OP_PUSHDATA2: 77,
	  OP_PUSHDATA4: 78,
	  OP_1NEGATE: 79,
	  OP_RESERVED: 80,
	  OP_1: 81,
	  OP_TRUE: 81,
	  OP_2: 82,
	  OP_3: 83,
	  OP_4: 84,
	  OP_5: 85,
	  OP_6: 86,
	  OP_7: 87,
	  OP_8: 88,
	  OP_9: 89,
	  OP_10: 90,
	  OP_11: 91,
	  OP_12: 92,
	  OP_13: 93,
	  OP_14: 94,
	  OP_15: 95,
	  OP_16: 96,

	  // control
	  OP_NOP: 97,
	  OP_VER: 98,
	  OP_IF: 99,
	  OP_NOTIF: 100,
	  OP_VERIF: 101,
	  OP_VERNOTIF: 102,
	  OP_ELSE: 103,
	  OP_ENDIF: 104,
	  OP_VERIFY: 105,
	  OP_RETURN: 106,

	  // stack ops
	  OP_TOALTSTACK: 107,
	  OP_FROMALTSTACK: 108,
	  OP_2DROP: 109,
	  OP_2DUP: 110,
	  OP_3DUP: 111,
	  OP_2OVER: 112,
	  OP_2ROT: 113,
	  OP_2SWAP: 114,
	  OP_IFDUP: 115,
	  OP_DEPTH: 116,
	  OP_DROP: 117,
	  OP_DUP: 118,
	  OP_NIP: 119,
	  OP_OVER: 120,
	  OP_PICK: 121,
	  OP_ROLL: 122,
	  OP_ROT: 123,
	  OP_SWAP: 124,
	  OP_TUCK: 125,

	  // splice ops
	  OP_CAT: 126,
	  OP_SUBSTR: 127,
	  OP_LEFT: 128,
	  OP_RIGHT: 129,
	  OP_SIZE: 130,

	  // bit logic
	  OP_INVERT: 131,
	  OP_AND: 132,
	  OP_OR: 133,
	  OP_XOR: 134,
	  OP_EQUAL: 135,
	  OP_EQUALVERIFY: 136,
	  OP_RESERVED1: 137,
	  OP_RESERVED2: 138,

	  // numeric
	  OP_1ADD: 139,
	  OP_1SUB: 140,
	  OP_2MUL: 141,
	  OP_2DIV: 142,
	  OP_NEGATE: 143,
	  OP_ABS: 144,
	  OP_NOT: 145,
	  OP_0NOTEQUAL: 146,

	  OP_ADD: 147,
	  OP_SUB: 148,
	  OP_MUL: 149,
	  OP_DIV: 150,
	  OP_MOD: 151,
	  OP_LSHIFT: 152,
	  OP_RSHIFT: 153,

	  OP_BOOLAND: 154,
	  OP_BOOLOR: 155,
	  OP_NUMEQUAL: 156,
	  OP_NUMEQUALVERIFY: 157,
	  OP_NUMNOTEQUAL: 158,
	  OP_LESSTHAN: 159,
	  OP_GREATERTHAN: 160,
	  OP_LESSTHANOREQUAL: 161,
	  OP_GREATERTHANOREQUAL: 162,
	  OP_MIN: 163,
	  OP_MAX: 164,

	  OP_WITHIN: 165,

	  // crypto
	  OP_RIPEMD160: 166,
	  OP_SHA1: 167,
	  OP_SHA256: 168,
	  OP_HASH160: 169,
	  OP_HASH256: 170,
	  OP_CODESEPARATOR: 171,
	  OP_CHECKSIG: 172,
	  OP_CHECKSIGVERIFY: 173,
	  OP_CHECKMULTISIG: 174,
	  OP_CHECKMULTISIGVERIFY: 175,

	  // expansion
	  OP_NOP1: 176,
	  OP_NOP2: 177,
	  OP_NOP3: 178,
	  OP_NOP4: 179,
	  OP_NOP5: 180,
	  OP_NOP6: 181,
	  OP_NOP7: 182,
	  OP_NOP8: 183,
	  OP_NOP9: 184,
	  OP_NOP10: 185,

	  // template matching params
	  OP_PUBKEYHASH: 253,
	  OP_PUBKEY: 254,
	  OP_INVALIDOPCODE: 255
	}


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var Point = __webpack_require__(60)
	var Curve = __webpack_require__(65)

	var getCurveByName = __webpack_require__(66)

	module.exports = {
	  Curve: Curve,
	  Point: Point,
	  getCurveByName: getCurveByName
	}


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var BigInteger = __webpack_require__(61)

	var THREE = BigInteger.valueOf(3)

	function Point (curve, x, y, z) {
	  assert.notStrictEqual(z, undefined, 'Missing Z coordinate')

	  this.curve = curve
	  this.x = x
	  this.y = y
	  this.z = z
	  this._zInv = null

	  this.compressed = true
	}

	Object.defineProperty(Point.prototype, 'zInv', {
	  get: function () {
	    if (this._zInv === null) {
	      this._zInv = this.z.modInverse(this.curve.p)
	    }

	    return this._zInv
	  }
	})

	Object.defineProperty(Point.prototype, 'affineX', {
	  get: function () {
	    return this.x.multiply(this.zInv).mod(this.curve.p)
	  }
	})

	Object.defineProperty(Point.prototype, 'affineY', {
	  get: function () {
	    return this.y.multiply(this.zInv).mod(this.curve.p)
	  }
	})

	Point.fromAffine = function (curve, x, y) {
	  return new Point(curve, x, y, BigInteger.ONE)
	}

	Point.prototype.equals = function (other) {
	  if (other === this) return true
	  if (this.curve.isInfinity(this)) return this.curve.isInfinity(other)
	  if (this.curve.isInfinity(other)) return this.curve.isInfinity(this)

	  // u = Y2 * Z1 - Y1 * Z2
	  var u = other.y.multiply(this.z).subtract(this.y.multiply(other.z)).mod(this.curve.p)

	  if (u.signum() !== 0) return false

	  // v = X2 * Z1 - X1 * Z2
	  var v = other.x.multiply(this.z).subtract(this.x.multiply(other.z)).mod(this.curve.p)

	  return v.signum() === 0
	}

	Point.prototype.negate = function () {
	  var y = this.curve.p.subtract(this.y)

	  return new Point(this.curve, this.x, y, this.z)
	}

	Point.prototype.add = function (b) {
	  if (this.curve.isInfinity(this)) return b
	  if (this.curve.isInfinity(b)) return this

	  var x1 = this.x
	  var y1 = this.y
	  var x2 = b.x
	  var y2 = b.y

	  // u = Y2 * Z1 - Y1 * Z2
	  var u = y2.multiply(this.z).subtract(y1.multiply(b.z)).mod(this.curve.p)
	  // v = X2 * Z1 - X1 * Z2
	  var v = x2.multiply(this.z).subtract(x1.multiply(b.z)).mod(this.curve.p)

	  if (v.signum() === 0) {
	    if (u.signum() === 0) {
	      return this.twice() // this == b, so double
	    }

	    return this.curve.infinity // this = -b, so infinity
	  }

	  var v2 = v.square()
	  var v3 = v2.multiply(v)
	  var x1v2 = x1.multiply(v2)
	  var zu2 = u.square().multiply(this.z)

	  // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
	  var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.p)
	  // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
	  var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.p)
	  // z3 = v^3 * z1 * z2
	  var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.p)

	  return new Point(this.curve, x3, y3, z3)
	}

	Point.prototype.twice = function () {
	  if (this.curve.isInfinity(this)) return this
	  if (this.y.signum() === 0) return this.curve.infinity

	  var x1 = this.x
	  var y1 = this.y

	  var y1z1 = y1.multiply(this.z).mod(this.curve.p)
	  var y1sqz1 = y1z1.multiply(y1).mod(this.curve.p)
	  var a = this.curve.a

	  // w = 3 * x1^2 + a * z1^2
	  var w = x1.square().multiply(THREE)

	  if (a.signum() !== 0) {
	    w = w.add(this.z.square().multiply(a))
	  }

	  w = w.mod(this.curve.p)
	  // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
	  var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.p)
	  // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
	  var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.pow(3)).mod(this.curve.p)
	  // z3 = 8 * (y1 * z1)^3
	  var z3 = y1z1.pow(3).shiftLeft(3).mod(this.curve.p)

	  return new Point(this.curve, x3, y3, z3)
	}

	// Simple NAF (Non-Adjacent Form) multiplication algorithm
	// TODO: modularize the multiplication algorithm
	Point.prototype.multiply = function (k) {
	  if (this.curve.isInfinity(this)) return this
	  if (k.signum() === 0) return this.curve.infinity

	  var e = k
	  var h = e.multiply(THREE)

	  var neg = this.negate()
	  var R = this

	  for (var i = h.bitLength() - 2; i > 0; --i) {
	    var hBit = h.testBit(i)
	    var eBit = e.testBit(i)

	    R = R.twice()

	    if (hBit !== eBit) {
	      R = R.add(hBit ? this : neg)
	    }
	  }

	  return R
	}

	// Compute this*j + x*k (simultaneous multiplication)
	Point.prototype.multiplyTwo = function (j, x, k) {
	  var i = Math.max(j.bitLength(), k.bitLength()) - 1
	  var R = this.curve.infinity
	  var both = this.add(x)

	  while (i >= 0) {
	    var jBit = j.testBit(i)
	    var kBit = k.testBit(i)

	    R = R.twice()

	    if (jBit) {
	      if (kBit) {
	        R = R.add(both)
	      } else {
	        R = R.add(this)
	      }
	    } else if (kBit) {
	      R = R.add(x)
	    }
	    --i
	  }

	  return R
	}

	Point.prototype.getEncoded = function (compressed) {
	  if (compressed == null) compressed = this.compressed
	  if (this.curve.isInfinity(this)) return new Buffer('00', 'hex') // Infinity point encoded is simply '00'

	  var x = this.affineX
	  var y = this.affineY
	  var byteLength = this.curve.pLength
	  var buffer

	  // 0x02/0x03 | X
	  if (compressed) {
	    buffer = new Buffer(1 + byteLength)
	    buffer.writeUInt8(y.isEven() ? 0x02 : 0x03, 0)

	  // 0x04 | X | Y
	  } else {
	    buffer = new Buffer(1 + byteLength + byteLength)
	    buffer.writeUInt8(0x04, 0)

	    y.toBuffer(byteLength).copy(buffer, 1 + byteLength)
	  }

	  x.toBuffer(byteLength).copy(buffer, 1)

	  return buffer
	}

	Point.decodeFrom = function (curve, buffer) {
	  var type = buffer.readUInt8(0)
	  var compressed = (type !== 4)

	  var byteLength = Math.floor((curve.p.bitLength() + 7) / 8)
	  var x = BigInteger.fromBuffer(buffer.slice(1, 1 + byteLength))

	  var Q
	  if (compressed) {
	    assert.equal(buffer.length, byteLength + 1, 'Invalid sequence length')
	    assert(type === 0x02 || type === 0x03, 'Invalid sequence tag')

	    var isOdd = (type === 0x03)
	    Q = curve.pointFromX(isOdd, x)
	  } else {
	    assert.equal(buffer.length, 1 + byteLength + byteLength, 'Invalid sequence length')

	    var y = BigInteger.fromBuffer(buffer.slice(1 + byteLength))
	    Q = Point.fromAffine(curve, x, y)
	  }

	  Q.compressed = compressed
	  return Q
	}

	Point.prototype.toString = function () {
	  if (this.curve.isInfinity(this)) return '(INFINITY)'

	  return '(' + this.affineX.toString() + ',' + this.affineY.toString() + ')'
	}

	module.exports = Point

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	var BigInteger = __webpack_require__(62)

	//addons
	__webpack_require__(64)

	module.exports = BigInteger

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	// (public) Constructor
	function BigInteger(a, b, c) {
	  if (!(this instanceof BigInteger))
	    return new BigInteger(a, b, c)

	  if (a != null) {
	    if ("number" == typeof a) this.fromNumber(a, b, c)
	    else if (b == null && "string" != typeof a) this.fromString(a, 256)
	    else this.fromString(a, b)
	  }
	}

	var proto = BigInteger.prototype

	// duck-typed isBigInteger
	proto.__bigi = __webpack_require__(63).version
	BigInteger.isBigInteger = function (obj, check_ver) {
	  return obj && obj.__bigi && (!check_ver || obj.__bigi === proto.__bigi)
	}

	// Bits per digit
	var dbits

	// am: Compute w_j += (x*this_i), propagate carries,
	// c is initial carry, returns final carry.
	// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
	// We need to select the fastest one that works in this environment.

	// am1: use a single mult and divide to get the high bits,
	// max digit bits should be 26 because
	// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
	function am1(i, x, w, j, c, n) {
	  while (--n >= 0) {
	    var v = x * this[i++] + w[j] + c
	    c = Math.floor(v / 0x4000000)
	    w[j++] = v & 0x3ffffff
	  }
	  return c
	}
	// am2 avoids a big mult-and-extract completely.
	// Max digit bits should be <= 30 because we do bitwise ops
	// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
	function am2(i, x, w, j, c, n) {
	  var xl = x & 0x7fff,
	    xh = x >> 15
	  while (--n >= 0) {
	    var l = this[i] & 0x7fff
	    var h = this[i++] >> 15
	    var m = xh * l + h * xl
	    l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff)
	    c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30)
	    w[j++] = l & 0x3fffffff
	  }
	  return c
	}
	// Alternately, set max digit bits to 28 since some
	// browsers slow down when dealing with 32-bit numbers.
	function am3(i, x, w, j, c, n) {
	  var xl = x & 0x3fff,
	    xh = x >> 14
	  while (--n >= 0) {
	    var l = this[i] & 0x3fff
	    var h = this[i++] >> 14
	    var m = xh * l + h * xl
	    l = xl * l + ((m & 0x3fff) << 14) + w[j] + c
	    c = (l >> 28) + (m >> 14) + xh * h
	    w[j++] = l & 0xfffffff
	  }
	  return c
	}

	// wtf?
	BigInteger.prototype.am = am1
	dbits = 26

	BigInteger.prototype.DB = dbits
	BigInteger.prototype.DM = ((1 << dbits) - 1)
	var DV = BigInteger.prototype.DV = (1 << dbits)

	var BI_FP = 52
	BigInteger.prototype.FV = Math.pow(2, BI_FP)
	BigInteger.prototype.F1 = BI_FP - dbits
	BigInteger.prototype.F2 = 2 * dbits - BI_FP

	// Digit conversions
	var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz"
	var BI_RC = new Array()
	var rr, vv
	rr = "0".charCodeAt(0)
	for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv
	rr = "a".charCodeAt(0)
	for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv
	rr = "A".charCodeAt(0)
	for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv

	function int2char(n) {
	  return BI_RM.charAt(n)
	}

	function intAt(s, i) {
	  var c = BI_RC[s.charCodeAt(i)]
	  return (c == null) ? -1 : c
	}

	// (protected) copy this to r
	function bnpCopyTo(r) {
	  for (var i = this.t - 1; i >= 0; --i) r[i] = this[i]
	  r.t = this.t
	  r.s = this.s
	}

	// (protected) set from integer value x, -DV <= x < DV
	function bnpFromInt(x) {
	  this.t = 1
	  this.s = (x < 0) ? -1 : 0
	  if (x > 0) this[0] = x
	  else if (x < -1) this[0] = x + DV
	  else this.t = 0
	}

	// return bigint initialized to value
	function nbv(i) {
	  var r = new BigInteger()
	  r.fromInt(i)
	  return r
	}

	// (protected) set from string and radix
	function bnpFromString(s, b) {
	  var self = this

	  var k
	  if (b == 16) k = 4
	  else if (b == 8) k = 3
	  else if (b == 256) k = 8; // byte array
	  else if (b == 2) k = 1
	  else if (b == 32) k = 5
	  else if (b == 4) k = 2
	  else {
	    self.fromRadix(s, b)
	    return
	  }
	  self.t = 0
	  self.s = 0
	  var i = s.length,
	    mi = false,
	    sh = 0
	  while (--i >= 0) {
	    var x = (k == 8) ? s[i] & 0xff : intAt(s, i)
	    if (x < 0) {
	      if (s.charAt(i) == "-") mi = true
	      continue
	    }
	    mi = false
	    if (sh == 0)
	      self[self.t++] = x
	    else if (sh + k > self.DB) {
	      self[self.t - 1] |= (x & ((1 << (self.DB - sh)) - 1)) << sh
	      self[self.t++] = (x >> (self.DB - sh))
	    } else
	      self[self.t - 1] |= x << sh
	    sh += k
	    if (sh >= self.DB) sh -= self.DB
	  }
	  if (k == 8 && (s[0] & 0x80) != 0) {
	    self.s = -1
	    if (sh > 0) self[self.t - 1] |= ((1 << (self.DB - sh)) - 1) << sh
	  }
	  self.clamp()
	  if (mi) BigInteger.ZERO.subTo(self, self)
	}

	// (protected) clamp off excess high words
	function bnpClamp() {
	  var c = this.s & this.DM
	  while (this.t > 0 && this[this.t - 1] == c)--this.t
	}

	// (public) return string representation in given radix
	function bnToString(b) {
	  var self = this
	  if (self.s < 0) return "-" + self.negate()
	    .toString(b)
	  var k
	  if (b == 16) k = 4
	  else if (b == 8) k = 3
	  else if (b == 2) k = 1
	  else if (b == 32) k = 5
	  else if (b == 4) k = 2
	  else return self.toRadix(b)
	  var km = (1 << k) - 1,
	    d, m = false,
	    r = "",
	    i = self.t
	  var p = self.DB - (i * self.DB) % k
	  if (i-- > 0) {
	    if (p < self.DB && (d = self[i] >> p) > 0) {
	      m = true
	      r = int2char(d)
	    }
	    while (i >= 0) {
	      if (p < k) {
	        d = (self[i] & ((1 << p) - 1)) << (k - p)
	        d |= self[--i] >> (p += self.DB - k)
	      } else {
	        d = (self[i] >> (p -= k)) & km
	        if (p <= 0) {
	          p += self.DB
	          --i
	        }
	      }
	      if (d > 0) m = true
	      if (m) r += int2char(d)
	    }
	  }
	  return m ? r : "0"
	}

	// (public) -this
	function bnNegate() {
	  var r = new BigInteger()
	  BigInteger.ZERO.subTo(this, r)
	  return r
	}

	// (public) |this|
	function bnAbs() {
	  return (this.s < 0) ? this.negate() : this
	}

	// (public) return + if this > a, - if this < a, 0 if equal
	function bnCompareTo(a) {
	  var r = this.s - a.s
	  if (r != 0) return r
	  var i = this.t
	  r = i - a.t
	  if (r != 0) return (this.s < 0) ? -r : r
	  while (--i >= 0)
	    if ((r = this[i] - a[i]) != 0) return r
	  return 0
	}

	// returns bit length of the integer x
	function nbits(x) {
	  var r = 1,
	    t
	  if ((t = x >>> 16) != 0) {
	    x = t
	    r += 16
	  }
	  if ((t = x >> 8) != 0) {
	    x = t
	    r += 8
	  }
	  if ((t = x >> 4) != 0) {
	    x = t
	    r += 4
	  }
	  if ((t = x >> 2) != 0) {
	    x = t
	    r += 2
	  }
	  if ((t = x >> 1) != 0) {
	    x = t
	    r += 1
	  }
	  return r
	}

	// (public) return the number of bits in "this"
	function bnBitLength() {
	  if (this.t <= 0) return 0
	  return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM))
	}

	// (public) return the number of bytes in "this"
	function bnByteLength() {
	  return this.bitLength() >> 3
	}

	// (protected) r = this << n*DB
	function bnpDLShiftTo(n, r) {
	  var i
	  for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i]
	  for (i = n - 1; i >= 0; --i) r[i] = 0
	  r.t = this.t + n
	  r.s = this.s
	}

	// (protected) r = this >> n*DB
	function bnpDRShiftTo(n, r) {
	  for (var i = n; i < this.t; ++i) r[i - n] = this[i]
	  r.t = Math.max(this.t - n, 0)
	  r.s = this.s
	}

	// (protected) r = this << n
	function bnpLShiftTo(n, r) {
	  var self = this
	  var bs = n % self.DB
	  var cbs = self.DB - bs
	  var bm = (1 << cbs) - 1
	  var ds = Math.floor(n / self.DB),
	    c = (self.s << bs) & self.DM,
	    i
	  for (i = self.t - 1; i >= 0; --i) {
	    r[i + ds + 1] = (self[i] >> cbs) | c
	    c = (self[i] & bm) << bs
	  }
	  for (i = ds - 1; i >= 0; --i) r[i] = 0
	  r[ds] = c
	  r.t = self.t + ds + 1
	  r.s = self.s
	  r.clamp()
	}

	// (protected) r = this >> n
	function bnpRShiftTo(n, r) {
	  var self = this
	  r.s = self.s
	  var ds = Math.floor(n / self.DB)
	  if (ds >= self.t) {
	    r.t = 0
	    return
	  }
	  var bs = n % self.DB
	  var cbs = self.DB - bs
	  var bm = (1 << bs) - 1
	  r[0] = self[ds] >> bs
	  for (var i = ds + 1; i < self.t; ++i) {
	    r[i - ds - 1] |= (self[i] & bm) << cbs
	    r[i - ds] = self[i] >> bs
	  }
	  if (bs > 0) r[self.t - ds - 1] |= (self.s & bm) << cbs
	  r.t = self.t - ds
	  r.clamp()
	}

	// (protected) r = this - a
	function bnpSubTo(a, r) {
	  var self = this
	  var i = 0,
	    c = 0,
	    m = Math.min(a.t, self.t)
	  while (i < m) {
	    c += self[i] - a[i]
	    r[i++] = c & self.DM
	    c >>= self.DB
	  }
	  if (a.t < self.t) {
	    c -= a.s
	    while (i < self.t) {
	      c += self[i]
	      r[i++] = c & self.DM
	      c >>= self.DB
	    }
	    c += self.s
	  } else {
	    c += self.s
	    while (i < a.t) {
	      c -= a[i]
	      r[i++] = c & self.DM
	      c >>= self.DB
	    }
	    c -= a.s
	  }
	  r.s = (c < 0) ? -1 : 0
	  if (c < -1) r[i++] = self.DV + c
	  else if (c > 0) r[i++] = c
	  r.t = i
	  r.clamp()
	}

	// (protected) r = this * a, r != this,a (HAC 14.12)
	// "this" should be the larger one if appropriate.
	function bnpMultiplyTo(a, r) {
	  var x = this.abs(),
	    y = a.abs()
	  var i = x.t
	  r.t = i + y.t
	  while (--i >= 0) r[i] = 0
	  for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t)
	  r.s = 0
	  r.clamp()
	  if (this.s != a.s) BigInteger.ZERO.subTo(r, r)
	}

	// (protected) r = this^2, r != this (HAC 14.16)
	function bnpSquareTo(r) {
	  var x = this.abs()
	  var i = r.t = 2 * x.t
	  while (--i >= 0) r[i] = 0
	  for (i = 0; i < x.t - 1; ++i) {
	    var c = x.am(i, x[i], r, 2 * i, 0, 1)
	    if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
	      r[i + x.t] -= x.DV
	      r[i + x.t + 1] = 1
	    }
	  }
	  if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1)
	  r.s = 0
	  r.clamp()
	}

	// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
	// r != q, this != m.  q or r may be null.
	function bnpDivRemTo(m, q, r) {
	  var self = this
	  var pm = m.abs()
	  if (pm.t <= 0) return
	  var pt = self.abs()
	  if (pt.t < pm.t) {
	    if (q != null) q.fromInt(0)
	    if (r != null) self.copyTo(r)
	    return
	  }
	  if (r == null) r = new BigInteger()
	  var y = new BigInteger(),
	    ts = self.s,
	    ms = m.s
	  var nsh = self.DB - nbits(pm[pm.t - 1]); // normalize modulus
	  if (nsh > 0) {
	    pm.lShiftTo(nsh, y)
	    pt.lShiftTo(nsh, r)
	  } else {
	    pm.copyTo(y)
	    pt.copyTo(r)
	  }
	  var ys = y.t
	  var y0 = y[ys - 1]
	  if (y0 == 0) return
	  var yt = y0 * (1 << self.F1) + ((ys > 1) ? y[ys - 2] >> self.F2 : 0)
	  var d1 = self.FV / yt,
	    d2 = (1 << self.F1) / yt,
	    e = 1 << self.F2
	  var i = r.t,
	    j = i - ys,
	    t = (q == null) ? new BigInteger() : q
	  y.dlShiftTo(j, t)
	  if (r.compareTo(t) >= 0) {
	    r[r.t++] = 1
	    r.subTo(t, r)
	  }
	  BigInteger.ONE.dlShiftTo(ys, t)
	  t.subTo(y, y); // "negative" y so we can replace sub with am later
	  while (y.t < ys) y[y.t++] = 0
	  while (--j >= 0) {
	    // Estimate quotient digit
	    var qd = (r[--i] == y0) ? self.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2)
	    if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) { // Try it out
	      y.dlShiftTo(j, t)
	      r.subTo(t, r)
	      while (r[i] < --qd) r.subTo(t, r)
	    }
	  }
	  if (q != null) {
	    r.drShiftTo(ys, q)
	    if (ts != ms) BigInteger.ZERO.subTo(q, q)
	  }
	  r.t = ys
	  r.clamp()
	  if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
	  if (ts < 0) BigInteger.ZERO.subTo(r, r)
	}

	// (public) this mod a
	function bnMod(a) {
	  var r = new BigInteger()
	  this.abs()
	    .divRemTo(a, null, r)
	  if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r)
	  return r
	}

	// Modular reduction using "classic" algorithm
	function Classic(m) {
	  this.m = m
	}

	function cConvert(x) {
	  if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m)
	  else return x
	}

	function cRevert(x) {
	  return x
	}

	function cReduce(x) {
	  x.divRemTo(this.m, null, x)
	}

	function cMulTo(x, y, r) {
	  x.multiplyTo(y, r)
	  this.reduce(r)
	}

	function cSqrTo(x, r) {
	  x.squareTo(r)
	  this.reduce(r)
	}

	Classic.prototype.convert = cConvert
	Classic.prototype.revert = cRevert
	Classic.prototype.reduce = cReduce
	Classic.prototype.mulTo = cMulTo
	Classic.prototype.sqrTo = cSqrTo

	// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
	// justification:
	//         xy == 1 (mod m)
	//         xy =  1+km
	//   xy(2-xy) = (1+km)(1-km)
	// x[y(2-xy)] = 1-k^2m^2
	// x[y(2-xy)] == 1 (mod m^2)
	// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
	// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
	// JS multiply "overflows" differently from C/C++, so care is needed here.
	function bnpInvDigit() {
	  if (this.t < 1) return 0
	  var x = this[0]
	  if ((x & 1) == 0) return 0
	  var y = x & 3; // y == 1/x mod 2^2
	  y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
	  y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
	  y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
	  // last step - calculate inverse mod DV directly
	  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
	  y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
	  // we really want the negative inverse, and -DV < y < DV
	  return (y > 0) ? this.DV - y : -y
	}

	// Montgomery reduction
	function Montgomery(m) {
	  this.m = m
	  this.mp = m.invDigit()
	  this.mpl = this.mp & 0x7fff
	  this.mph = this.mp >> 15
	  this.um = (1 << (m.DB - 15)) - 1
	  this.mt2 = 2 * m.t
	}

	// xR mod m
	function montConvert(x) {
	  var r = new BigInteger()
	  x.abs()
	    .dlShiftTo(this.m.t, r)
	  r.divRemTo(this.m, null, r)
	  if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r)
	  return r
	}

	// x/R mod m
	function montRevert(x) {
	  var r = new BigInteger()
	  x.copyTo(r)
	  this.reduce(r)
	  return r
	}

	// x = x/R mod m (HAC 14.32)
	function montReduce(x) {
	  while (x.t <= this.mt2) // pad x so am has enough room later
	    x[x.t++] = 0
	  for (var i = 0; i < this.m.t; ++i) {
	    // faster way of calculating u0 = x[i]*mp mod DV
	    var j = x[i] & 0x7fff
	    var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM
	    // use am to combine the multiply-shift-add into one call
	    j = i + this.m.t
	    x[j] += this.m.am(0, u0, x, i, 0, this.m.t)
	    // propagate carry
	    while (x[j] >= x.DV) {
	      x[j] -= x.DV
	      x[++j]++
	    }
	  }
	  x.clamp()
	  x.drShiftTo(this.m.t, x)
	  if (x.compareTo(this.m) >= 0) x.subTo(this.m, x)
	}

	// r = "x^2/R mod m"; x != r
	function montSqrTo(x, r) {
	  x.squareTo(r)
	  this.reduce(r)
	}

	// r = "xy/R mod m"; x,y != r
	function montMulTo(x, y, r) {
	  x.multiplyTo(y, r)
	  this.reduce(r)
	}

	Montgomery.prototype.convert = montConvert
	Montgomery.prototype.revert = montRevert
	Montgomery.prototype.reduce = montReduce
	Montgomery.prototype.mulTo = montMulTo
	Montgomery.prototype.sqrTo = montSqrTo

	// (protected) true iff this is even
	function bnpIsEven() {
	  return ((this.t > 0) ? (this[0] & 1) : this.s) == 0
	}

	// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
	function bnpExp(e, z) {
	  if (e > 0xffffffff || e < 1) return BigInteger.ONE
	  var r = new BigInteger(),
	    r2 = new BigInteger(),
	    g = z.convert(this),
	    i = nbits(e) - 1
	  g.copyTo(r)
	  while (--i >= 0) {
	    z.sqrTo(r, r2)
	    if ((e & (1 << i)) > 0) z.mulTo(r2, g, r)
	    else {
	      var t = r
	      r = r2
	      r2 = t
	    }
	  }
	  return z.revert(r)
	}

	// (public) this^e % m, 0 <= e < 2^32
	function bnModPowInt(e, m) {
	  var z
	  if (e < 256 || m.isEven()) z = new Classic(m)
	  else z = new Montgomery(m)
	  return this.exp(e, z)
	}

	// protected
	proto.copyTo = bnpCopyTo
	proto.fromInt = bnpFromInt
	proto.fromString = bnpFromString
	proto.clamp = bnpClamp
	proto.dlShiftTo = bnpDLShiftTo
	proto.drShiftTo = bnpDRShiftTo
	proto.lShiftTo = bnpLShiftTo
	proto.rShiftTo = bnpRShiftTo
	proto.subTo = bnpSubTo
	proto.multiplyTo = bnpMultiplyTo
	proto.squareTo = bnpSquareTo
	proto.divRemTo = bnpDivRemTo
	proto.invDigit = bnpInvDigit
	proto.isEven = bnpIsEven
	proto.exp = bnpExp

	// public
	proto.toString = bnToString
	proto.negate = bnNegate
	proto.abs = bnAbs
	proto.compareTo = bnCompareTo
	proto.bitLength = bnBitLength
	proto.byteLength = bnByteLength
	proto.mod = bnMod
	proto.modPowInt = bnModPowInt

	// (public)
	function bnClone() {
	  var r = new BigInteger()
	  this.copyTo(r)
	  return r
	}

	// (public) return value as integer
	function bnIntValue() {
	  if (this.s < 0) {
	    if (this.t == 1) return this[0] - this.DV
	    else if (this.t == 0) return -1
	  } else if (this.t == 1) return this[0]
	  else if (this.t == 0) return 0
	  // assumes 16 < DB < 32
	  return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0]
	}

	// (public) return value as byte
	function bnByteValue() {
	  return (this.t == 0) ? this.s : (this[0] << 24) >> 24
	}

	// (public) return value as short (assumes DB>=16)
	function bnShortValue() {
	  return (this.t == 0) ? this.s : (this[0] << 16) >> 16
	}

	// (protected) return x s.t. r^x < DV
	function bnpChunkSize(r) {
	  return Math.floor(Math.LN2 * this.DB / Math.log(r))
	}

	// (public) 0 if this == 0, 1 if this > 0
	function bnSigNum() {
	  if (this.s < 0) return -1
	  else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0
	  else return 1
	}

	// (protected) convert to radix string
	function bnpToRadix(b) {
	  if (b == null) b = 10
	  if (this.signum() == 0 || b < 2 || b > 36) return "0"
	  var cs = this.chunkSize(b)
	  var a = Math.pow(b, cs)
	  var d = nbv(a),
	    y = new BigInteger(),
	    z = new BigInteger(),
	    r = ""
	  this.divRemTo(d, y, z)
	  while (y.signum() > 0) {
	    r = (a + z.intValue())
	      .toString(b)
	      .substr(1) + r
	    y.divRemTo(d, y, z)
	  }
	  return z.intValue()
	    .toString(b) + r
	}

	// (protected) convert from radix string
	function bnpFromRadix(s, b) {
	  var self = this
	  self.fromInt(0)
	  if (b == null) b = 10
	  var cs = self.chunkSize(b)
	  var d = Math.pow(b, cs),
	    mi = false,
	    j = 0,
	    w = 0
	  for (var i = 0; i < s.length; ++i) {
	    var x = intAt(s, i)
	    if (x < 0) {
	      if (s.charAt(i) == "-" && self.signum() == 0) mi = true
	      continue
	    }
	    w = b * w + x
	    if (++j >= cs) {
	      self.dMultiply(d)
	      self.dAddOffset(w, 0)
	      j = 0
	      w = 0
	    }
	  }
	  if (j > 0) {
	    self.dMultiply(Math.pow(b, j))
	    self.dAddOffset(w, 0)
	  }
	  if (mi) BigInteger.ZERO.subTo(self, self)
	}

	// (protected) alternate constructor
	function bnpFromNumber(a, b, c) {
	  var self = this
	  if ("number" == typeof b) {
	    // new BigInteger(int,int,RNG)
	    if (a < 2) self.fromInt(1)
	    else {
	      self.fromNumber(a, c)
	      if (!self.testBit(a - 1)) // force MSB set
	        self.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, self)
	      if (self.isEven()) self.dAddOffset(1, 0); // force odd
	      while (!self.isProbablePrime(b)) {
	        self.dAddOffset(2, 0)
	        if (self.bitLength() > a) self.subTo(BigInteger.ONE.shiftLeft(a - 1), self)
	      }
	    }
	  } else {
	    // new BigInteger(int,RNG)
	    var x = new Array(),
	      t = a & 7
	    x.length = (a >> 3) + 1
	    b.nextBytes(x)
	    if (t > 0) x[0] &= ((1 << t) - 1)
	    else x[0] = 0
	    self.fromString(x, 256)
	  }
	}

	// (public) convert to bigendian byte array
	function bnToByteArray() {
	  var self = this
	  var i = self.t,
	    r = new Array()
	  r[0] = self.s
	  var p = self.DB - (i * self.DB) % 8,
	    d, k = 0
	  if (i-- > 0) {
	    if (p < self.DB && (d = self[i] >> p) != (self.s & self.DM) >> p)
	      r[k++] = d | (self.s << (self.DB - p))
	    while (i >= 0) {
	      if (p < 8) {
	        d = (self[i] & ((1 << p) - 1)) << (8 - p)
	        d |= self[--i] >> (p += self.DB - 8)
	      } else {
	        d = (self[i] >> (p -= 8)) & 0xff
	        if (p <= 0) {
	          p += self.DB
	          --i
	        }
	      }
	      if ((d & 0x80) != 0) d |= -256
	      if (k === 0 && (self.s & 0x80) != (d & 0x80))++k
	      if (k > 0 || d != self.s) r[k++] = d
	    }
	  }
	  return r
	}

	function bnEquals(a) {
	  return (this.compareTo(a) == 0)
	}

	function bnMin(a) {
	  return (this.compareTo(a) < 0) ? this : a
	}

	function bnMax(a) {
	  return (this.compareTo(a) > 0) ? this : a
	}

	// (protected) r = this op a (bitwise)
	function bnpBitwiseTo(a, op, r) {
	  var self = this
	  var i, f, m = Math.min(a.t, self.t)
	  for (i = 0; i < m; ++i) r[i] = op(self[i], a[i])
	  if (a.t < self.t) {
	    f = a.s & self.DM
	    for (i = m; i < self.t; ++i) r[i] = op(self[i], f)
	    r.t = self.t
	  } else {
	    f = self.s & self.DM
	    for (i = m; i < a.t; ++i) r[i] = op(f, a[i])
	    r.t = a.t
	  }
	  r.s = op(self.s, a.s)
	  r.clamp()
	}

	// (public) this & a
	function op_and(x, y) {
	  return x & y
	}

	function bnAnd(a) {
	  var r = new BigInteger()
	  this.bitwiseTo(a, op_and, r)
	  return r
	}

	// (public) this | a
	function op_or(x, y) {
	  return x | y
	}

	function bnOr(a) {
	  var r = new BigInteger()
	  this.bitwiseTo(a, op_or, r)
	  return r
	}

	// (public) this ^ a
	function op_xor(x, y) {
	  return x ^ y
	}

	function bnXor(a) {
	  var r = new BigInteger()
	  this.bitwiseTo(a, op_xor, r)
	  return r
	}

	// (public) this & ~a
	function op_andnot(x, y) {
	  return x & ~y
	}

	function bnAndNot(a) {
	  var r = new BigInteger()
	  this.bitwiseTo(a, op_andnot, r)
	  return r
	}

	// (public) ~this
	function bnNot() {
	  var r = new BigInteger()
	  for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i]
	  r.t = this.t
	  r.s = ~this.s
	  return r
	}

	// (public) this << n
	function bnShiftLeft(n) {
	  var r = new BigInteger()
	  if (n < 0) this.rShiftTo(-n, r)
	  else this.lShiftTo(n, r)
	  return r
	}

	// (public) this >> n
	function bnShiftRight(n) {
	  var r = new BigInteger()
	  if (n < 0) this.lShiftTo(-n, r)
	  else this.rShiftTo(n, r)
	  return r
	}

	// return index of lowest 1-bit in x, x < 2^31
	function lbit(x) {
	  if (x == 0) return -1
	  var r = 0
	  if ((x & 0xffff) == 0) {
	    x >>= 16
	    r += 16
	  }
	  if ((x & 0xff) == 0) {
	    x >>= 8
	    r += 8
	  }
	  if ((x & 0xf) == 0) {
	    x >>= 4
	    r += 4
	  }
	  if ((x & 3) == 0) {
	    x >>= 2
	    r += 2
	  }
	  if ((x & 1) == 0)++r
	  return r
	}

	// (public) returns index of lowest 1-bit (or -1 if none)
	function bnGetLowestSetBit() {
	  for (var i = 0; i < this.t; ++i)
	    if (this[i] != 0) return i * this.DB + lbit(this[i])
	  if (this.s < 0) return this.t * this.DB
	  return -1
	}

	// return number of 1 bits in x
	function cbit(x) {
	  var r = 0
	  while (x != 0) {
	    x &= x - 1
	    ++r
	  }
	  return r
	}

	// (public) return number of set bits
	function bnBitCount() {
	  var r = 0,
	    x = this.s & this.DM
	  for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x)
	  return r
	}

	// (public) true iff nth bit is set
	function bnTestBit(n) {
	  var j = Math.floor(n / this.DB)
	  if (j >= this.t) return (this.s != 0)
	  return ((this[j] & (1 << (n % this.DB))) != 0)
	}

	// (protected) this op (1<<n)
	function bnpChangeBit(n, op) {
	  var r = BigInteger.ONE.shiftLeft(n)
	  this.bitwiseTo(r, op, r)
	  return r
	}

	// (public) this | (1<<n)
	function bnSetBit(n) {
	  return this.changeBit(n, op_or)
	}

	// (public) this & ~(1<<n)
	function bnClearBit(n) {
	  return this.changeBit(n, op_andnot)
	}

	// (public) this ^ (1<<n)
	function bnFlipBit(n) {
	  return this.changeBit(n, op_xor)
	}

	// (protected) r = this + a
	function bnpAddTo(a, r) {
	  var self = this

	  var i = 0,
	    c = 0,
	    m = Math.min(a.t, self.t)
	  while (i < m) {
	    c += self[i] + a[i]
	    r[i++] = c & self.DM
	    c >>= self.DB
	  }
	  if (a.t < self.t) {
	    c += a.s
	    while (i < self.t) {
	      c += self[i]
	      r[i++] = c & self.DM
	      c >>= self.DB
	    }
	    c += self.s
	  } else {
	    c += self.s
	    while (i < a.t) {
	      c += a[i]
	      r[i++] = c & self.DM
	      c >>= self.DB
	    }
	    c += a.s
	  }
	  r.s = (c < 0) ? -1 : 0
	  if (c > 0) r[i++] = c
	  else if (c < -1) r[i++] = self.DV + c
	  r.t = i
	  r.clamp()
	}

	// (public) this + a
	function bnAdd(a) {
	  var r = new BigInteger()
	  this.addTo(a, r)
	  return r
	}

	// (public) this - a
	function bnSubtract(a) {
	  var r = new BigInteger()
	  this.subTo(a, r)
	  return r
	}

	// (public) this * a
	function bnMultiply(a) {
	  var r = new BigInteger()
	  this.multiplyTo(a, r)
	  return r
	}

	// (public) this^2
	function bnSquare() {
	  var r = new BigInteger()
	  this.squareTo(r)
	  return r
	}

	// (public) this / a
	function bnDivide(a) {
	  var r = new BigInteger()
	  this.divRemTo(a, r, null)
	  return r
	}

	// (public) this % a
	function bnRemainder(a) {
	  var r = new BigInteger()
	  this.divRemTo(a, null, r)
	  return r
	}

	// (public) [this/a,this%a]
	function bnDivideAndRemainder(a) {
	  var q = new BigInteger(),
	    r = new BigInteger()
	  this.divRemTo(a, q, r)
	  return new Array(q, r)
	}

	// (protected) this *= n, this >= 0, 1 < n < DV
	function bnpDMultiply(n) {
	  this[this.t] = this.am(0, n - 1, this, 0, 0, this.t)
	  ++this.t
	  this.clamp()
	}

	// (protected) this += n << w words, this >= 0
	function bnpDAddOffset(n, w) {
	  if (n == 0) return
	  while (this.t <= w) this[this.t++] = 0
	  this[w] += n
	  while (this[w] >= this.DV) {
	    this[w] -= this.DV
	    if (++w >= this.t) this[this.t++] = 0
	    ++this[w]
	  }
	}

	// A "null" reducer
	function NullExp() {}

	function nNop(x) {
	  return x
	}

	function nMulTo(x, y, r) {
	  x.multiplyTo(y, r)
	}

	function nSqrTo(x, r) {
	  x.squareTo(r)
	}

	NullExp.prototype.convert = nNop
	NullExp.prototype.revert = nNop
	NullExp.prototype.mulTo = nMulTo
	NullExp.prototype.sqrTo = nSqrTo

	// (public) this^e
	function bnPow(e) {
	  return this.exp(e, new NullExp())
	}

	// (protected) r = lower n words of "this * a", a.t <= n
	// "this" should be the larger one if appropriate.
	function bnpMultiplyLowerTo(a, n, r) {
	  var i = Math.min(this.t + a.t, n)
	  r.s = 0; // assumes a,this >= 0
	  r.t = i
	  while (i > 0) r[--i] = 0
	  var j
	  for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t)
	  for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i)
	  r.clamp()
	}

	// (protected) r = "this * a" without lower n words, n > 0
	// "this" should be the larger one if appropriate.
	function bnpMultiplyUpperTo(a, n, r) {
	  --n
	  var i = r.t = this.t + a.t - n
	  r.s = 0; // assumes a,this >= 0
	  while (--i >= 0) r[i] = 0
	  for (i = Math.max(n - this.t, 0); i < a.t; ++i)
	    r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n)
	  r.clamp()
	  r.drShiftTo(1, r)
	}

	// Barrett modular reduction
	function Barrett(m) {
	  // setup Barrett
	  this.r2 = new BigInteger()
	  this.q3 = new BigInteger()
	  BigInteger.ONE.dlShiftTo(2 * m.t, this.r2)
	  this.mu = this.r2.divide(m)
	  this.m = m
	}

	function barrettConvert(x) {
	  if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m)
	  else if (x.compareTo(this.m) < 0) return x
	  else {
	    var r = new BigInteger()
	    x.copyTo(r)
	    this.reduce(r)
	    return r
	  }
	}

	function barrettRevert(x) {
	  return x
	}

	// x = x mod m (HAC 14.42)
	function barrettReduce(x) {
	  var self = this
	  x.drShiftTo(self.m.t - 1, self.r2)
	  if (x.t > self.m.t + 1) {
	    x.t = self.m.t + 1
	    x.clamp()
	  }
	  self.mu.multiplyUpperTo(self.r2, self.m.t + 1, self.q3)
	  self.m.multiplyLowerTo(self.q3, self.m.t + 1, self.r2)
	  while (x.compareTo(self.r2) < 0) x.dAddOffset(1, self.m.t + 1)
	  x.subTo(self.r2, x)
	  while (x.compareTo(self.m) >= 0) x.subTo(self.m, x)
	}

	// r = x^2 mod m; x != r
	function barrettSqrTo(x, r) {
	  x.squareTo(r)
	  this.reduce(r)
	}

	// r = x*y mod m; x,y != r
	function barrettMulTo(x, y, r) {
	  x.multiplyTo(y, r)
	  this.reduce(r)
	}

	Barrett.prototype.convert = barrettConvert
	Barrett.prototype.revert = barrettRevert
	Barrett.prototype.reduce = barrettReduce
	Barrett.prototype.mulTo = barrettMulTo
	Barrett.prototype.sqrTo = barrettSqrTo

	// (public) this^e % m (HAC 14.85)
	function bnModPow(e, m) {
	  var i = e.bitLength(),
	    k, r = nbv(1),
	    z
	  if (i <= 0) return r
	  else if (i < 18) k = 1
	  else if (i < 48) k = 3
	  else if (i < 144) k = 4
	  else if (i < 768) k = 5
	  else k = 6
	  if (i < 8)
	    z = new Classic(m)
	  else if (m.isEven())
	    z = new Barrett(m)
	  else
	    z = new Montgomery(m)

	  // precomputation
	  var g = new Array(),
	    n = 3,
	    k1 = k - 1,
	    km = (1 << k) - 1
	  g[1] = z.convert(this)
	  if (k > 1) {
	    var g2 = new BigInteger()
	    z.sqrTo(g[1], g2)
	    while (n <= km) {
	      g[n] = new BigInteger()
	      z.mulTo(g2, g[n - 2], g[n])
	      n += 2
	    }
	  }

	  var j = e.t - 1,
	    w, is1 = true,
	    r2 = new BigInteger(),
	    t
	  i = nbits(e[j]) - 1
	  while (j >= 0) {
	    if (i >= k1) w = (e[j] >> (i - k1)) & km
	    else {
	      w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i)
	      if (j > 0) w |= e[j - 1] >> (this.DB + i - k1)
	    }

	    n = k
	    while ((w & 1) == 0) {
	      w >>= 1
	      --n
	    }
	    if ((i -= n) < 0) {
	      i += this.DB
	      --j
	    }
	    if (is1) { // ret == 1, don't bother squaring or multiplying it
	      g[w].copyTo(r)
	      is1 = false
	    } else {
	      while (n > 1) {
	        z.sqrTo(r, r2)
	        z.sqrTo(r2, r)
	        n -= 2
	      }
	      if (n > 0) z.sqrTo(r, r2)
	      else {
	        t = r
	        r = r2
	        r2 = t
	      }
	      z.mulTo(r2, g[w], r)
	    }

	    while (j >= 0 && (e[j] & (1 << i)) == 0) {
	      z.sqrTo(r, r2)
	      t = r
	      r = r2
	      r2 = t
	      if (--i < 0) {
	        i = this.DB - 1
	        --j
	      }
	    }
	  }
	  return z.revert(r)
	}

	// (public) gcd(this,a) (HAC 14.54)
	function bnGCD(a) {
	  var x = (this.s < 0) ? this.negate() : this.clone()
	  var y = (a.s < 0) ? a.negate() : a.clone()
	  if (x.compareTo(y) < 0) {
	    var t = x
	    x = y
	    y = t
	  }
	  var i = x.getLowestSetBit(),
	    g = y.getLowestSetBit()
	  if (g < 0) return x
	  if (i < g) g = i
	  if (g > 0) {
	    x.rShiftTo(g, x)
	    y.rShiftTo(g, y)
	  }
	  while (x.signum() > 0) {
	    if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x)
	    if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y)
	    if (x.compareTo(y) >= 0) {
	      x.subTo(y, x)
	      x.rShiftTo(1, x)
	    } else {
	      y.subTo(x, y)
	      y.rShiftTo(1, y)
	    }
	  }
	  if (g > 0) y.lShiftTo(g, y)
	  return y
	}

	// (protected) this % n, n < 2^26
	function bnpModInt(n) {
	  if (n <= 0) return 0
	  var d = this.DV % n,
	    r = (this.s < 0) ? n - 1 : 0
	  if (this.t > 0)
	    if (d == 0) r = this[0] % n
	    else
	      for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n
	  return r
	}

	// (public) 1/this % m (HAC 14.61)
	function bnModInverse(m) {
	  var ac = m.isEven()
	  if (this.signum() === 0) throw new Error('division by zero')
	  if ((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO
	  var u = m.clone(),
	    v = this.clone()
	  var a = nbv(1),
	    b = nbv(0),
	    c = nbv(0),
	    d = nbv(1)
	  while (u.signum() != 0) {
	    while (u.isEven()) {
	      u.rShiftTo(1, u)
	      if (ac) {
	        if (!a.isEven() || !b.isEven()) {
	          a.addTo(this, a)
	          b.subTo(m, b)
	        }
	        a.rShiftTo(1, a)
	      } else if (!b.isEven()) b.subTo(m, b)
	      b.rShiftTo(1, b)
	    }
	    while (v.isEven()) {
	      v.rShiftTo(1, v)
	      if (ac) {
	        if (!c.isEven() || !d.isEven()) {
	          c.addTo(this, c)
	          d.subTo(m, d)
	        }
	        c.rShiftTo(1, c)
	      } else if (!d.isEven()) d.subTo(m, d)
	      d.rShiftTo(1, d)
	    }
	    if (u.compareTo(v) >= 0) {
	      u.subTo(v, u)
	      if (ac) a.subTo(c, a)
	      b.subTo(d, b)
	    } else {
	      v.subTo(u, v)
	      if (ac) c.subTo(a, c)
	      d.subTo(b, d)
	    }
	  }
	  if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO
	  if (d.compareTo(m) >= 0) return d.subtract(m)
	  if (d.signum() < 0) d.addTo(m, d)
	  else return d
	  if (d.signum() < 0) return d.add(m)
	  else return d
	}

	var lowprimes = [
	  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
	  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
	  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
	  239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
	  331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419,
	  421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503,
	  509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607,
	  613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701,
	  709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811,
	  821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911,
	  919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
	]

	var lplim = (1 << 26) / lowprimes[lowprimes.length - 1]

	// (public) test primality with certainty >= 1-.5^t
	function bnIsProbablePrime(t) {
	  var i, x = this.abs()
	  if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
	    for (i = 0; i < lowprimes.length; ++i)
	      if (x[0] == lowprimes[i]) return true
	    return false
	  }
	  if (x.isEven()) return false
	  i = 1
	  while (i < lowprimes.length) {
	    var m = lowprimes[i],
	      j = i + 1
	    while (j < lowprimes.length && m < lplim) m *= lowprimes[j++]
	    m = x.modInt(m)
	    while (i < j) if (m % lowprimes[i++] == 0) return false
	  }
	  return x.millerRabin(t)
	}

	// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
	function bnpMillerRabin(t) {
	  var n1 = this.subtract(BigInteger.ONE)
	  var k = n1.getLowestSetBit()
	  if (k <= 0) return false
	  var r = n1.shiftRight(k)
	  t = (t + 1) >> 1
	  if (t > lowprimes.length) t = lowprimes.length
	  var a = new BigInteger(null)
	  var j, bases = []
	  for (var i = 0; i < t; ++i) {
	    for (;;) {
	      j = lowprimes[Math.floor(Math.random() * lowprimes.length)]
	      if (bases.indexOf(j) == -1) break
	    }
	    bases.push(j)
	    a.fromInt(j)
	    var y = a.modPow(r, this)
	    if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
	      var j = 1
	      while (j++ < k && y.compareTo(n1) != 0) {
	        y = y.modPowInt(2, this)
	        if (y.compareTo(BigInteger.ONE) == 0) return false
	      }
	      if (y.compareTo(n1) != 0) return false
	    }
	  }
	  return true
	}

	// protected
	proto.chunkSize = bnpChunkSize
	proto.toRadix = bnpToRadix
	proto.fromRadix = bnpFromRadix
	proto.fromNumber = bnpFromNumber
	proto.bitwiseTo = bnpBitwiseTo
	proto.changeBit = bnpChangeBit
	proto.addTo = bnpAddTo
	proto.dMultiply = bnpDMultiply
	proto.dAddOffset = bnpDAddOffset
	proto.multiplyLowerTo = bnpMultiplyLowerTo
	proto.multiplyUpperTo = bnpMultiplyUpperTo
	proto.modInt = bnpModInt
	proto.millerRabin = bnpMillerRabin

	// public
	proto.clone = bnClone
	proto.intValue = bnIntValue
	proto.byteValue = bnByteValue
	proto.shortValue = bnShortValue
	proto.signum = bnSigNum
	proto.toByteArray = bnToByteArray
	proto.equals = bnEquals
	proto.min = bnMin
	proto.max = bnMax
	proto.and = bnAnd
	proto.or = bnOr
	proto.xor = bnXor
	proto.andNot = bnAndNot
	proto.not = bnNot
	proto.shiftLeft = bnShiftLeft
	proto.shiftRight = bnShiftRight
	proto.getLowestSetBit = bnGetLowestSetBit
	proto.bitCount = bnBitCount
	proto.testBit = bnTestBit
	proto.setBit = bnSetBit
	proto.clearBit = bnClearBit
	proto.flipBit = bnFlipBit
	proto.add = bnAdd
	proto.subtract = bnSubtract
	proto.multiply = bnMultiply
	proto.divide = bnDivide
	proto.remainder = bnRemainder
	proto.divideAndRemainder = bnDivideAndRemainder
	proto.modPow = bnModPow
	proto.modInverse = bnModInverse
	proto.pow = bnPow
	proto.gcd = bnGCD
	proto.isProbablePrime = bnIsProbablePrime

	// JSBN-specific extension
	proto.square = bnSquare

	// constants
	BigInteger.ZERO = nbv(0)
	BigInteger.ONE = nbv(1)
	BigInteger.valueOf = nbv

	module.exports = BigInteger


/***/ },
/* 63 */
/***/ function(module, exports) {

	module.exports = {
		"_args": [
			[
				{
					"raw": "bigi@1.4.1",
					"scope": null,
					"escapedName": "bigi",
					"name": "bigi",
					"rawSpec": "1.4.1",
					"spec": "1.4.1",
					"type": "version"
				},
				"/www/ambisafe-client-javascript"
			]
		],
		"_from": "bigi@1.4.1",
		"_id": "bigi@1.4.1",
		"_inCache": true,
		"_location": "/bigi",
		"_nodeVersion": "2.1.0",
		"_npmUser": {
			"name": "jprichardson",
			"email": "jprichardson@gmail.com"
		},
		"_npmVersion": "2.10.1",
		"_phantomChildren": {},
		"_requested": {
			"raw": "bigi@1.4.1",
			"scope": null,
			"escapedName": "bigi",
			"name": "bigi",
			"rawSpec": "1.4.1",
			"spec": "1.4.1",
			"type": "version"
		},
		"_requiredBy": [
			"/",
			"/bitcoinjs-lib",
			"/ecurve"
		],
		"_resolved": "https://registry.npmjs.org/bigi/-/bigi-1.4.1.tgz",
		"_shasum": "726e8ab08d1fe1dfb8aa6bb6309bffecf93a21b7",
		"_shrinkwrap": null,
		"_spec": "bigi@1.4.1",
		"_where": "/www/ambisafe-client-javascript",
		"bugs": {
			"url": "https://github.com/cryptocoinjs/bigi/issues"
		},
		"dependencies": {},
		"description": "Big integers.",
		"devDependencies": {
			"coveralls": "^2.11.2",
			"istanbul": "^0.3.5",
			"jshint": "^2.5.1",
			"mocha": "^2.1.0",
			"mochify": "^2.1.0"
		},
		"directories": {},
		"dist": {
			"shasum": "726e8ab08d1fe1dfb8aa6bb6309bffecf93a21b7",
			"tarball": "https://registry.npmjs.org/bigi/-/bigi-1.4.1.tgz"
		},
		"gitHead": "7d034a1b38ca90f68daa9de472dda2fb813836f1",
		"homepage": "https://github.com/cryptocoinjs/bigi#readme",
		"keywords": [
			"cryptography",
			"math",
			"bitcoin",
			"arbitrary",
			"precision",
			"arithmetic",
			"big",
			"integer",
			"int",
			"number",
			"biginteger",
			"bigint",
			"bignumber",
			"decimal",
			"float"
		],
		"main": "./lib/index.js",
		"maintainers": [
			{
				"name": "midnightlightning",
				"email": "boydb@midnightdesign.ws"
			},
			{
				"name": "sidazhang",
				"email": "sidazhang89@gmail.com"
			},
			{
				"name": "nadav",
				"email": "npm@shesek.info"
			},
			{
				"name": "jprichardson",
				"email": "jprichardson@gmail.com"
			}
		],
		"name": "bigi",
		"optionalDependencies": {},
		"readme": "ERROR: No README data found!",
		"repository": {
			"url": "git+https://github.com/cryptocoinjs/bigi.git",
			"type": "git"
		},
		"scripts": {
			"browser-test": "mochify --wd -R spec",
			"coverage": "istanbul cover ./node_modules/.bin/_mocha -- --reporter list test/*.js",
			"coveralls": "npm run-script coverage && node ./node_modules/.bin/coveralls < coverage/lcov.info",
			"jshint": "jshint --config jshint.json lib/*.js ; true",
			"test": "_mocha -- test/*.js",
			"unit": "mocha"
		},
		"testling": {
			"files": "test/*.js",
			"harness": "mocha",
			"browsers": [
				"ie/9..latest",
				"firefox/latest",
				"chrome/latest",
				"safari/6.0..latest",
				"iphone/6.0..latest",
				"android-browser/4.2..latest"
			]
		},
		"version": "1.4.1"
	};

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// FIXME: Kind of a weird way to throw exceptions, consider removing
	var assert = __webpack_require__(8)
	var BigInteger = __webpack_require__(62)

	/**
	 * Turns a byte array into a big integer.
	 *
	 * This function will interpret a byte array as a big integer in big
	 * endian notation.
	 */
	BigInteger.fromByteArrayUnsigned = function(byteArray) {
	  // BigInteger expects a DER integer conformant byte array
	  if (byteArray[0] & 0x80) {
	    return new BigInteger([0].concat(byteArray))
	  }

	  return new BigInteger(byteArray)
	}

	/**
	 * Returns a byte array representation of the big integer.
	 *
	 * This returns the absolute of the contained value in big endian
	 * form. A value of zero results in an empty array.
	 */
	BigInteger.prototype.toByteArrayUnsigned = function() {
	  var byteArray = this.toByteArray()
	  return byteArray[0] === 0 ? byteArray.slice(1) : byteArray
	}

	BigInteger.fromDERInteger = function(byteArray) {
	  return new BigInteger(byteArray)
	}

	/*
	 * Converts BigInteger to a DER integer representation.
	 *
	 * The format for this value uses the most significant bit as a sign
	 * bit.  If the most significant bit is already set and the integer is
	 * positive, a 0x00 is prepended.
	 *
	 * Examples:
	 *
	 *      0 =>     0x00
	 *      1 =>     0x01
	 *     -1 =>     0xff
	 *    127 =>     0x7f
	 *   -127 =>     0x81
	 *    128 =>   0x0080
	 *   -128 =>     0x80
	 *    255 =>   0x00ff
	 *   -255 =>   0xff01
	 *  16300 =>   0x3fac
	 * -16300 =>   0xc054
	 *  62300 => 0x00f35c
	 * -62300 => 0xff0ca4
	*/
	BigInteger.prototype.toDERInteger = BigInteger.prototype.toByteArray

	BigInteger.fromBuffer = function(buffer) {
	  // BigInteger expects a DER integer conformant byte array
	  if (buffer[0] & 0x80) {
	    var byteArray = Array.prototype.slice.call(buffer)

	    return new BigInteger([0].concat(byteArray))
	  }

	  return new BigInteger(buffer)
	}

	BigInteger.fromHex = function(hex) {
	  if (hex === '') return BigInteger.ZERO

	  assert.equal(hex, hex.match(/^[A-Fa-f0-9]+/), 'Invalid hex string')
	  assert.equal(hex.length % 2, 0, 'Incomplete hex')
	  return new BigInteger(hex, 16)
	}

	BigInteger.prototype.toBuffer = function(size) {
	  var byteArray = this.toByteArrayUnsigned()
	  var zeros = []

	  var padding = size - byteArray.length
	  while (zeros.length < padding) zeros.push(0)

	  return new Buffer(zeros.concat(byteArray))
	}

	BigInteger.prototype.toHex = function(size) {
	  return this.toBuffer(size).toString('hex')
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var assert = __webpack_require__(8)
	var BigInteger = __webpack_require__(61)

	var Point = __webpack_require__(60)

	function Curve (p, a, b, Gx, Gy, n, h) {
	  this.p = p
	  this.a = a
	  this.b = b
	  this.G = Point.fromAffine(this, Gx, Gy)
	  this.n = n
	  this.h = h

	  this.infinity = new Point(this, null, null, BigInteger.ZERO)

	  // result caching
	  this.pOverFour = p.add(BigInteger.ONE).shiftRight(2)

	  // determine size of p in bytes
	  this.pLength = Math.floor((this.p.bitLength() + 7) / 8)
	}

	Curve.prototype.pointFromX = function (isOdd, x) {
	  var alpha = x.pow(3).add(this.a.multiply(x)).add(this.b).mod(this.p)
	  var beta = alpha.modPow(this.pOverFour, this.p) // XXX: not compatible with all curves

	  var y = beta
	  if (beta.isEven() ^ !isOdd) {
	    y = this.p.subtract(y) // -y % p
	  }

	  return Point.fromAffine(this, x, y)
	}

	Curve.prototype.isInfinity = function (Q) {
	  if (Q === this.infinity) return true

	  return Q.z.signum() === 0 && Q.y.signum() !== 0
	}

	Curve.prototype.isOnCurve = function (Q) {
	  if (this.isInfinity(Q)) return true

	  var x = Q.affineX
	  var y = Q.affineY
	  var a = this.a
	  var b = this.b
	  var p = this.p

	  // Check that xQ and yQ are integers in the interval [0, p - 1]
	  if (x.signum() < 0 || x.compareTo(p) >= 0) return false
	  if (y.signum() < 0 || y.compareTo(p) >= 0) return false

	  // and check that y^2 = x^3 + ax + b (mod p)
	  var lhs = y.square().mod(p)
	  var rhs = x.pow(3).add(a.multiply(x)).add(b).mod(p)
	  return lhs.equals(rhs)
	}

	/**
	 * Validate an elliptic curve point.
	 *
	 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
	 */
	Curve.prototype.validate = function (Q) {
	  // Check Q != O
	  assert(!this.isInfinity(Q), 'Point is at infinity')
	  assert(this.isOnCurve(Q), 'Point is not on the curve')

	  // Check nQ = O (where Q is a scalar multiple of G)
	  var nQ = Q.multiply(this.n)
	  assert(this.isInfinity(nQ), 'Point is not a scalar multiple of G')

	  return true
	}

	module.exports = Curve


/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	var BigInteger = __webpack_require__(61)

	var curves = __webpack_require__(67)
	var Curve = __webpack_require__(65)

	function getCurveByName (name) {
	  var curve = curves[name]
	  if (!curve) return null

	  var p = new BigInteger(curve.p, 16)
	  var a = new BigInteger(curve.a, 16)
	  var b = new BigInteger(curve.b, 16)
	  var n = new BigInteger(curve.n, 16)
	  var h = new BigInteger(curve.h, 16)
	  var Gx = new BigInteger(curve.Gx, 16)
	  var Gy = new BigInteger(curve.Gy, 16)

	  return new Curve(p, a, b, Gx, Gy, n, h)
	}

	module.exports = getCurveByName


/***/ },
/* 67 */
/***/ function(module, exports) {

	module.exports = {
		"secp128r1": {
			"p": "fffffffdffffffffffffffffffffffff",
			"a": "fffffffdfffffffffffffffffffffffc",
			"b": "e87579c11079f43dd824993c2cee5ed3",
			"n": "fffffffe0000000075a30d1b9038a115",
			"h": "01",
			"Gx": "161ff7528b899b2d0c28607ca52c5b86",
			"Gy": "cf5ac8395bafeb13c02da292dded7a83"
		},
		"secp160k1": {
			"p": "fffffffffffffffffffffffffffffffeffffac73",
			"a": "00",
			"b": "07",
			"n": "0100000000000000000001b8fa16dfab9aca16b6b3",
			"h": "01",
			"Gx": "3b4c382ce37aa192a4019e763036f4f5dd4d7ebb",
			"Gy": "938cf935318fdced6bc28286531733c3f03c4fee"
		},
		"secp160r1": {
			"p": "ffffffffffffffffffffffffffffffff7fffffff",
			"a": "ffffffffffffffffffffffffffffffff7ffffffc",
			"b": "1c97befc54bd7a8b65acf89f81d4d4adc565fa45",
			"n": "0100000000000000000001f4c8f927aed3ca752257",
			"h": "01",
			"Gx": "4a96b5688ef573284664698968c38bb913cbfc82",
			"Gy": "23a628553168947d59dcc912042351377ac5fb32"
		},
		"secp192k1": {
			"p": "fffffffffffffffffffffffffffffffffffffffeffffee37",
			"a": "00",
			"b": "03",
			"n": "fffffffffffffffffffffffe26f2fc170f69466a74defd8d",
			"h": "01",
			"Gx": "db4ff10ec057e9ae26b07d0280b7f4341da5d1b1eae06c7d",
			"Gy": "9b2f2f6d9c5628a7844163d015be86344082aa88d95e2f9d"
		},
		"secp192r1": {
			"p": "fffffffffffffffffffffffffffffffeffffffffffffffff",
			"a": "fffffffffffffffffffffffffffffffefffffffffffffffc",
			"b": "64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1",
			"n": "ffffffffffffffffffffffff99def836146bc9b1b4d22831",
			"h": "01",
			"Gx": "188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012",
			"Gy": "07192b95ffc8da78631011ed6b24cdd573f977a11e794811"
		},
		"secp256k1": {
			"p": "fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f",
			"a": "00",
			"b": "07",
			"n": "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
			"h": "01",
			"Gx": "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
			"Gy": "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
		},
		"secp256r1": {
			"p": "ffffffff00000001000000000000000000000000ffffffffffffffffffffffff",
			"a": "ffffffff00000001000000000000000000000000fffffffffffffffffffffffc",
			"b": "5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b",
			"n": "ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551",
			"h": "01",
			"Gx": "6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
			"Gy": "4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"
		}
	};

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var typeForce = __webpack_require__(52)

	var BigInteger = __webpack_require__(61)

	function ECSignature (r, s) {
	  typeForce('BigInteger', r)
	  typeForce('BigInteger', s)

	  this.r = r
	  this.s = s
	}

	ECSignature.parseCompact = function (buffer) {
	  assert.equal(buffer.length, 65, 'Invalid signature length')
	  var i = buffer.readUInt8(0) - 27

	  // At most 3 bits
	  assert.equal(i, i & 7, 'Invalid signature parameter')
	  var compressed = !!(i & 4)

	  // Recovery param only
	  i = i & 3

	  var r = BigInteger.fromBuffer(buffer.slice(1, 33))
	  var s = BigInteger.fromBuffer(buffer.slice(33))

	  return {
	    compressed: compressed,
	    i: i,
	    signature: new ECSignature(r, s)
	  }
	}

	ECSignature.fromDER = function (buffer) {
	  assert.equal(buffer.readUInt8(0), 0x30, 'Not a DER sequence')
	  assert.equal(buffer.readUInt8(1), buffer.length - 2, 'Invalid sequence length')
	  assert.equal(buffer.readUInt8(2), 0x02, 'Expected a DER integer')

	  var rLen = buffer.readUInt8(3)
	  assert(rLen > 0, 'R length is zero')

	  var offset = 4 + rLen
	  assert.equal(buffer.readUInt8(offset), 0x02, 'Expected a DER integer (2)')

	  var sLen = buffer.readUInt8(offset + 1)
	  assert(sLen > 0, 'S length is zero')

	  var rB = buffer.slice(4, offset)
	  var sB = buffer.slice(offset + 2)
	  offset += 2 + sLen

	  if (rLen > 1 && rB.readUInt8(0) === 0x00) {
	    assert(rB.readUInt8(1) & 0x80, 'R value excessively padded')
	  }

	  if (sLen > 1 && sB.readUInt8(0) === 0x00) {
	    assert(sB.readUInt8(1) & 0x80, 'S value excessively padded')
	  }

	  assert.equal(offset, buffer.length, 'Invalid DER encoding')
	  var r = BigInteger.fromDERInteger(rB)
	  var s = BigInteger.fromDERInteger(sB)

	  assert(r.signum() >= 0, 'R value is negative')
	  assert(s.signum() >= 0, 'S value is negative')

	  return new ECSignature(r, s)
	}

	// BIP62: 1 byte hashType flag (only 0x01, 0x02, 0x03, 0x81, 0x82 and 0x83 are allowed)
	ECSignature.parseScriptSignature = function (buffer) {
	  var hashType = buffer.readUInt8(buffer.length - 1)
	  var hashTypeMod = hashType & ~0x80

	  assert(hashTypeMod > 0x00 && hashTypeMod < 0x04, 'Invalid hashType ' + hashType)

	  return {
	    signature: ECSignature.fromDER(buffer.slice(0, -1)),
	    hashType: hashType
	  }
	}

	ECSignature.prototype.toCompact = function (i, compressed) {
	  if (compressed) {
	    i += 4
	  }

	  i += 27

	  var buffer = new Buffer(65)
	  buffer.writeUInt8(i, 0)

	  this.r.toBuffer(32).copy(buffer, 1)
	  this.s.toBuffer(32).copy(buffer, 33)

	  return buffer
	}

	ECSignature.prototype.toDER = function () {
	  var rBa = this.r.toDERInteger()
	  var sBa = this.s.toDERInteger()

	  var sequence = []

	  // INTEGER
	  sequence.push(0x02, rBa.length)
	  sequence = sequence.concat(rBa)

	  // INTEGER
	  sequence.push(0x02, sBa.length)
	  sequence = sequence.concat(sBa)

	  // SEQUENCE
	  sequence.unshift(0x30, sequence.length)

	  return new Buffer(sequence)
	}

	ECSignature.prototype.toScriptSignature = function (hashType) {
	  var hashTypeMod = hashType & ~0x80
	  assert(hashTypeMod > 0x00 && hashTypeMod < 0x04, 'Invalid hashType ' + hashType)

	  var hashTypeBuffer = new Buffer(1)
	  hashTypeBuffer.writeUInt8(hashType, 0)

	  return Buffer.concat([this.toDER(), hashTypeBuffer])
	}

	module.exports = ECSignature

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var bufferutils = __webpack_require__(70)
	var crypto = __webpack_require__(71)
	var typeForce = __webpack_require__(52)
	var opcodes = __webpack_require__(58)

	function Script (buffer, chunks) {
	  typeForce('Buffer', buffer)
	  typeForce('Array', chunks)

	  this.buffer = buffer
	  this.chunks = chunks
	}

	Script.fromASM = function (asm) {
	  var strChunks = asm.split(' ')
	  var chunks = strChunks.map(function (strChunk) {
	    // opcode
	    if (strChunk in opcodes) {
	      return opcodes[strChunk]

	    // data chunk
	    } else {
	      return new Buffer(strChunk, 'hex')
	    }
	  })

	  return Script.fromChunks(chunks)
	}

	Script.fromBuffer = function (buffer) {
	  var chunks = []
	  var i = 0

	  while (i < buffer.length) {
	    var opcode = buffer.readUInt8(i)

	    // data chunk
	    if ((opcode > opcodes.OP_0) && (opcode <= opcodes.OP_PUSHDATA4)) {
	      var d = bufferutils.readPushDataInt(buffer, i)

	      // did reading a pushDataInt fail? return non-chunked script
	      if (d === null) return new Script(buffer, [])
	      i += d.size

	      // attempt to read too much data?
	      if (i + d.number > buffer.length) return new Script(buffer, [])

	      var data = buffer.slice(i, i + d.number)
	      i += d.number

	      chunks.push(data)

	    // opcode
	    } else {
	      chunks.push(opcode)

	      i += 1
	    }
	  }

	  return new Script(buffer, chunks)
	}

	Script.fromChunks = function (chunks) {
	  typeForce('Array', chunks)

	  var bufferSize = chunks.reduce(function (accum, chunk) {
	    // data chunk
	    if (Buffer.isBuffer(chunk)) {
	      return accum + bufferutils.pushDataSize(chunk.length) + chunk.length
	    }

	    // opcode
	    return accum + 1
	  }, 0.0)

	  var buffer = new Buffer(bufferSize)
	  var offset = 0

	  chunks.forEach(function (chunk) {
	    // data chunk
	    if (Buffer.isBuffer(chunk)) {
	      offset += bufferutils.writePushDataInt(buffer, chunk.length, offset)

	      chunk.copy(buffer, offset)
	      offset += chunk.length

	    // opcode
	    } else {
	      buffer.writeUInt8(chunk, offset)
	      offset += 1
	    }
	  })

	  assert.equal(offset, buffer.length, 'Could not decode chunks')
	  return new Script(buffer, chunks)
	}

	Script.fromHex = function (hex) {
	  return Script.fromBuffer(new Buffer(hex, 'hex'))
	}

	Script.EMPTY = Script.fromChunks([])

	Script.prototype.getHash = function () {
	  return crypto.hash160(this.buffer)
	}

	// FIXME: doesn't work for data chunks, maybe time to use buffertools.compare...
	Script.prototype.without = function (needle) {
	  return Script.fromChunks(this.chunks.filter(function (op) {
	    return op !== needle
	  }))
	}

	var reverseOps = []
	for (var op in opcodes) {
	  var code = opcodes[op]
	  reverseOps[code] = op
	}

	Script.prototype.toASM = function () {
	  return this.chunks.map(function (chunk) {
	    // data chunk
	    if (Buffer.isBuffer(chunk)) {
	      return chunk.toString('hex')

	    // opcode
	    } else {
	      return reverseOps[chunk]
	    }
	  }).join(' ')
	}

	Script.prototype.toBuffer = function () {
	  return this.buffer
	}

	Script.prototype.toHex = function () {
	  return this.toBuffer().toString('hex')
	}

	module.exports = Script

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var opcodes = __webpack_require__(58)

	// https://github.com/feross/buffer/blob/master/index.js#L1127
	function verifuint (value, max) {
	  assert(typeof value === 'number', 'cannot write a non-number as a number')
	  assert(value >= 0, 'specified a negative value for writing an unsigned value')
	  assert(value <= max, 'value is larger than maximum value for type')
	  assert(Math.floor(value) === value, 'value has a fractional component')
	}

	function pushDataSize (i) {
	  return i < opcodes.OP_PUSHDATA1 ? 1
	  : i < 0xff ? 2
	  : i < 0xffff ? 3
	  : 5
	}

	function readPushDataInt (buffer, offset) {
	  var opcode = buffer.readUInt8(offset)
	  var number, size

	  // ~6 bit
	  if (opcode < opcodes.OP_PUSHDATA1) {
	    number = opcode
	    size = 1

	  // 8 bit
	  } else if (opcode === opcodes.OP_PUSHDATA1) {
	    if (offset + 2 > buffer.length) return null
	    number = buffer.readUInt8(offset + 1)
	    size = 2

	  // 16 bit
	  } else if (opcode === opcodes.OP_PUSHDATA2) {
	    if (offset + 3 > buffer.length) return null
	    number = buffer.readUInt16LE(offset + 1)
	    size = 3

	  // 32 bit
	  } else {
	    if (offset + 5 > buffer.length) return null
	    assert.equal(opcode, opcodes.OP_PUSHDATA4, 'Unexpected opcode')

	    number = buffer.readUInt32LE(offset + 1)
	    size = 5
	  }

	  return {
	    opcode: opcode,
	    number: number,
	    size: size
	  }
	}

	function readUInt64LE (buffer, offset) {
	  var a = buffer.readUInt32LE(offset)
	  var b = buffer.readUInt32LE(offset + 4)
	  b *= 0x100000000

	  verifuint(b + a, 0x001fffffffffffff)

	  return b + a
	}

	function readVarInt (buffer, offset) {
	  var t = buffer.readUInt8(offset)
	  var number, size

	  // 8 bit
	  if (t < 253) {
	    number = t
	    size = 1

	  // 16 bit
	  } else if (t < 254) {
	    number = buffer.readUInt16LE(offset + 1)
	    size = 3

	  // 32 bit
	  } else if (t < 255) {
	    number = buffer.readUInt32LE(offset + 1)
	    size = 5

	  // 64 bit
	  } else {
	    number = readUInt64LE(buffer, offset + 1)
	    size = 9
	  }

	  return {
	    number: number,
	    size: size
	  }
	}

	function writePushDataInt (buffer, number, offset) {
	  var size = pushDataSize(number)

	  // ~6 bit
	  if (size === 1) {
	    buffer.writeUInt8(number, offset)

	  // 8 bit
	  } else if (size === 2) {
	    buffer.writeUInt8(opcodes.OP_PUSHDATA1, offset)
	    buffer.writeUInt8(number, offset + 1)

	  // 16 bit
	  } else if (size === 3) {
	    buffer.writeUInt8(opcodes.OP_PUSHDATA2, offset)
	    buffer.writeUInt16LE(number, offset + 1)

	  // 32 bit
	  } else {
	    buffer.writeUInt8(opcodes.OP_PUSHDATA4, offset)
	    buffer.writeUInt32LE(number, offset + 1)
	  }

	  return size
	}

	function writeUInt64LE (buffer, value, offset) {
	  verifuint(value, 0x001fffffffffffff)

	  buffer.writeInt32LE(value & -1, offset)
	  buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4)
	}

	function varIntSize (i) {
	  return i < 253 ? 1
	  : i < 0x10000 ? 3
	  : i < 0x100000000 ? 5
	  : 9
	}

	function writeVarInt (buffer, number, offset) {
	  var size = varIntSize(number)

	  // 8 bit
	  if (size === 1) {
	    buffer.writeUInt8(number, offset)

	  // 16 bit
	  } else if (size === 3) {
	    buffer.writeUInt8(253, offset)
	    buffer.writeUInt16LE(number, offset + 1)

	  // 32 bit
	  } else if (size === 5) {
	    buffer.writeUInt8(254, offset)
	    buffer.writeUInt32LE(number, offset + 1)

	  // 64 bit
	  } else {
	    buffer.writeUInt8(255, offset)
	    writeUInt64LE(buffer, number, offset + 1)
	  }

	  return size
	}

	function varIntBuffer (i) {
	  var size = varIntSize(i)
	  var buffer = new Buffer(size)
	  writeVarInt(buffer, i, 0)

	  return buffer
	}

	function reverse (buffer) {
	  var buffer2 = new Buffer(buffer)
	  Array.prototype.reverse.call(buffer2)
	  return buffer2
	}

	module.exports = {
	  pushDataSize: pushDataSize,
	  readPushDataInt: readPushDataInt,
	  readUInt64LE: readUInt64LE,
	  readVarInt: readVarInt,
	  reverse: reverse,
	  varIntBuffer: varIntBuffer,
	  varIntSize: varIntSize,
	  writePushDataInt: writePushDataInt,
	  writeUInt64LE: writeUInt64LE,
	  writeVarInt: writeVarInt
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	var createHash = __webpack_require__(16)

	function hash160 (buffer) {
	  return ripemd160(sha256(buffer))
	}

	function hash256 (buffer) {
	  return sha256(sha256(buffer))
	}

	function ripemd160 (buffer) {
	  return createHash('rmd160').update(buffer).digest()
	}

	function sha1 (buffer) {
	  return createHash('sha1').update(buffer).digest()
	}

	function sha256 (buffer) {
	  return createHash('sha256').update(buffer).digest()
	}

	// FIXME: Name not consistent with others
	var createHmac = __webpack_require__(72)

	function HmacSHA256 (buffer, secret) {
	  console.warn('Hmac* functions are deprecated for removal in 2.0.0, use node crypto instead')
	  return createHmac('sha256', secret).update(buffer).digest()
	}

	function HmacSHA512 (buffer, secret) {
	  console.warn('Hmac* functions are deprecated for removal in 2.0.0, use node crypto instead')
	  return createHmac('sha512', secret).update(buffer).digest()
	}

	module.exports = {
	  ripemd160: ripemd160,
	  sha1: sha1,
	  sha256: sha256,
	  hash160: hash160,
	  hash256: hash256,
	  HmacSHA256: HmacSHA256,
	  HmacSHA512: HmacSHA512
	}


/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';
	var createHash = __webpack_require__(16);
	var inherits = __webpack_require__(17)

	var Transform = __webpack_require__(30).Transform

	var ZEROS = new Buffer(128)
	ZEROS.fill(0)

	function Hmac(alg, key) {
	  Transform.call(this)
	  alg = alg.toLowerCase()
	  if (typeof key === 'string') {
	    key = new Buffer(key)
	  }

	  var blocksize = (alg === 'sha512' || alg === 'sha384') ? 128 : 64

	  this._alg = alg
	  this._key = key

	  if (key.length > blocksize) {
	    key = createHash(alg).update(key).digest()

	  } else if (key.length < blocksize) {
	    key = Buffer.concat([key, ZEROS], blocksize)
	  }

	  var ipad = this._ipad = new Buffer(blocksize)
	  var opad = this._opad = new Buffer(blocksize)

	  for (var i = 0; i < blocksize; i++) {
	    ipad[i] = key[i] ^ 0x36
	    opad[i] = key[i] ^ 0x5C
	  }

	  this._hash = createHash(alg).update(ipad)
	}

	inherits(Hmac, Transform)

	Hmac.prototype.update = function (data, enc) {
	  this._hash.update(data, enc)

	  return this
	}

	Hmac.prototype._transform = function (data, _, next) {
	  this._hash.update(data)

	  next()
	}

	Hmac.prototype._flush = function (next) {
	  this.push(this.digest())

	  next()
	}

	Hmac.prototype.digest = function (enc) {
	  var h = this._hash.digest()

	  return createHash(this._alg).update(this._opad).update(h).digest(enc)
	}

	module.exports = function createHmac(alg, key) {
	  return new Hmac(alg, key)
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	var bs58check = __webpack_require__(13)

	function decode () {
	  console.warn('bs58check will be removed in 2.0.0. require("bs58check") instead.')

	  return bs58check.decode.apply(undefined, arguments)
	}

	function encode () {
	  console.warn('bs58check will be removed in 2.0.0. require("bs58check") instead.')

	  return bs58check.encode.apply(undefined, arguments)
	}

	module.exports = {
	  decode: decode,
	  encode: encode
	}


/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var bufferutils = __webpack_require__(70)
	var crypto = __webpack_require__(71)

	var Transaction = __webpack_require__(75)

	function Block () {
	  this.version = 1
	  this.prevHash = null
	  this.merkleRoot = null
	  this.timestamp = 0
	  this.bits = 0
	  this.nonce = 0
	}

	Block.fromBuffer = function (buffer) {
	  assert(buffer.length >= 80, 'Buffer too small (< 80 bytes)')

	  var offset = 0
	  function readSlice (n) {
	    offset += n
	    return buffer.slice(offset - n, offset)
	  }

	  function readUInt32 () {
	    var i = buffer.readUInt32LE(offset)
	    offset += 4
	    return i
	  }

	  var block = new Block()
	  block.version = readUInt32()
	  block.prevHash = readSlice(32)
	  block.merkleRoot = readSlice(32)
	  block.timestamp = readUInt32()
	  block.bits = readUInt32()
	  block.nonce = readUInt32()

	  if (buffer.length === 80) return block

	  function readVarInt () {
	    var vi = bufferutils.readVarInt(buffer, offset)
	    offset += vi.size
	    return vi.number
	  }

	  // FIXME: poor performance
	  function readTransaction () {
	    var tx = Transaction.fromBuffer(buffer.slice(offset), true)

	    offset += tx.toBuffer().length
	    return tx
	  }

	  var nTransactions = readVarInt()
	  block.transactions = []

	  for (var i = 0; i < nTransactions; ++i) {
	    var tx = readTransaction()
	    block.transactions.push(tx)
	  }

	  return block
	}

	Block.fromHex = function (hex) {
	  return Block.fromBuffer(new Buffer(hex, 'hex'))
	}

	Block.prototype.getHash = function () {
	  return crypto.hash256(this.toBuffer(true))
	}

	Block.prototype.getId = function () {
	  return bufferutils.reverse(this.getHash()).toString('hex')
	}

	Block.prototype.getUTCDate = function () {
	  var date = new Date(0) // epoch
	  date.setUTCSeconds(this.timestamp)

	  return date
	}

	Block.prototype.toBuffer = function (headersOnly) {
	  var buffer = new Buffer(80)

	  var offset = 0
	  function writeSlice (slice) {
	    slice.copy(buffer, offset)
	    offset += slice.length
	  }

	  function writeUInt32 (i) {
	    buffer.writeUInt32LE(i, offset)
	    offset += 4
	  }

	  writeUInt32(this.version)
	  writeSlice(this.prevHash)
	  writeSlice(this.merkleRoot)
	  writeUInt32(this.timestamp)
	  writeUInt32(this.bits)
	  writeUInt32(this.nonce)

	  if (headersOnly || !this.transactions) return buffer

	  var txLenBuffer = bufferutils.varIntBuffer(this.transactions.length)
	  var txBuffers = this.transactions.map(function (tx) {
	    return tx.toBuffer()
	  })

	  return Buffer.concat([buffer, txLenBuffer].concat(txBuffers))
	}

	Block.prototype.toHex = function (headersOnly) {
	  return this.toBuffer(headersOnly).toString('hex')
	}

	module.exports = Block

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var bufferutils = __webpack_require__(70)
	var crypto = __webpack_require__(71)
	var typeForce = __webpack_require__(52)
	var opcodes = __webpack_require__(58)
	var scripts = __webpack_require__(57)

	var Address = __webpack_require__(7)
	var ECSignature = __webpack_require__(68)
	var Script = __webpack_require__(69)

	function Transaction () {
	  this.version = 1
	  this.locktime = 0
	  this.ins = []
	  this.outs = []
	}

	Transaction.DEFAULT_SEQUENCE = 0xffffffff
	Transaction.SIGHASH_ALL = 0x01
	Transaction.SIGHASH_NONE = 0x02
	Transaction.SIGHASH_SINGLE = 0x03
	Transaction.SIGHASH_ANYONECANPAY = 0x80

	Transaction.fromBuffer = function (buffer, __disableAssert) {
	  var offset = 0
	  function readSlice (n) {
	    offset += n
	    return buffer.slice(offset - n, offset)
	  }

	  function readUInt32 () {
	    var i = buffer.readUInt32LE(offset)
	    offset += 4
	    return i
	  }

	  function readUInt64 () {
	    var i = bufferutils.readUInt64LE(buffer, offset)
	    offset += 8
	    return i
	  }

	  function readVarInt () {
	    var vi = bufferutils.readVarInt(buffer, offset)
	    offset += vi.size
	    return vi.number
	  }

	  function readScript () {
	    return Script.fromBuffer(readSlice(readVarInt()))
	  }

	  function readGenerationScript () {
	    return new Script(readSlice(readVarInt()), [])
	  }

	  var tx = new Transaction()
	  tx.version = readUInt32()

	  var vinLen = readVarInt()
	  for (var i = 0; i < vinLen; ++i) {
	    var hash = readSlice(32)

	    if (Transaction.isCoinbaseHash(hash)) {
	      tx.ins.push({
	        hash: hash,
	        index: readUInt32(),
	        script: readGenerationScript(),
	        sequence: readUInt32()
	      })
	    } else {
	      tx.ins.push({
	        hash: hash,
	        index: readUInt32(),
	        script: readScript(),
	        sequence: readUInt32()
	      })
	    }
	  }

	  var voutLen = readVarInt()
	  for (i = 0; i < voutLen; ++i) {
	    tx.outs.push({
	      value: readUInt64(),
	      script: readScript()
	    })
	  }

	  tx.locktime = readUInt32()

	  if (!__disableAssert) {
	    assert.equal(offset, buffer.length, 'Transaction has unexpected data')
	  }

	  return tx
	}

	Transaction.fromHex = function (hex) {
	  return Transaction.fromBuffer(new Buffer(hex, 'hex'))
	}

	Transaction.isCoinbaseHash = function (buffer) {
	  return Array.prototype.every.call(buffer, function (x) {
	    return x === 0
	  })
	}

	/**
	 * Create a new txIn.
	 *
	 * Can be called with any of:
	 *
	 * - A transaction and an index
	 * - A transaction hash and an index
	 *
	 * Note that this method does not sign the created input.
	 */
	Transaction.prototype.addInput = function (hash, index, sequence, script) {
	  if (sequence === undefined || sequence === null) {
	    sequence = Transaction.DEFAULT_SEQUENCE
	  }

	  script = script || Script.EMPTY

	  if (typeof hash === 'string') {
	    // TxId hex is big-endian, we need little-endian
	    hash = bufferutils.reverse(new Buffer(hash, 'hex'))
	  } else if (hash instanceof Transaction) {
	    hash = hash.getHash()
	  }

	  typeForce('Buffer', hash)
	  typeForce('Number', index)
	  typeForce('Number', sequence)
	  typeForce('Script', script)

	  assert.equal(hash.length, 32, 'Expected hash length of 32, got ' + hash.length)

	  // Add the input and return the input's index
	  return (this.ins.push({
	    hash: hash,
	    index: index,
	    script: script,
	    sequence: sequence
	  }) - 1)
	}

	/**
	 * Create a new txOut.
	 *
	 * Can be called with:
	 *
	 * - A base58 address string and a value
	 * - An Address object and a value
	 * - A scriptPubKey Script and a value
	 */
	Transaction.prototype.addOutput = function (scriptPubKey, value) {
	  // Attempt to get a valid address if it's a base58 address string
	  if (typeof scriptPubKey === 'string') {
	    scriptPubKey = Address.fromBase58Check(scriptPubKey)
	  }

	  // Attempt to get a valid script if it's an Address object
	  if (scriptPubKey instanceof Address) {
	    scriptPubKey = scriptPubKey.toOutputScript()
	  }

	  typeForce('Script', scriptPubKey)
	  typeForce('Number', value)

	  // Add the output and return the output's index
	  return (this.outs.push({
	    script: scriptPubKey,
	    value: value
	  }) - 1)
	}

	Transaction.prototype.clone = function () {
	  var newTx = new Transaction()
	  newTx.version = this.version
	  newTx.locktime = this.locktime

	  newTx.ins = this.ins.map(function (txIn) {
	    return {
	      hash: txIn.hash,
	      index: txIn.index,
	      script: txIn.script,
	      sequence: txIn.sequence
	    }
	  })

	  newTx.outs = this.outs.map(function (txOut) {
	    return {
	      script: txOut.script,
	      value: txOut.value
	    }
	  })

	  return newTx
	}

	/**
	 * Hash transaction for signing a specific input.
	 *
	 * Bitcoin uses a different hash for each signed transaction input. This
	 * method copies the transaction, makes the necessary changes based on the
	 * hashType, serializes and finally hashes the result. This hash can then be
	 * used to sign the transaction input in question.
	 */
	Transaction.prototype.hashForSignature = function (inIndex, prevOutScript, hashType) {
	  // FIXME: remove in 2.x.y
	  if (arguments[0] instanceof Script) {
	    console.warn('hashForSignature(prevOutScript, inIndex, ...) has been deprecated. Use hashForSignature(inIndex, prevOutScript, ...)')

	    // swap the arguments (must be stored in tmp, arguments is special)
	    var tmp = arguments[0]
	    inIndex = arguments[1]
	    prevOutScript = tmp
	  }

	  typeForce('Number', inIndex)
	  typeForce('Script', prevOutScript)
	  typeForce('Number', hashType)

	  assert(inIndex >= 0, 'Invalid vin index')
	  assert(inIndex < this.ins.length, 'Invalid vin index')

	  var txTmp = this.clone()
	  var hashScript = prevOutScript.without(opcodes.OP_CODESEPARATOR)

	  // Blank out other inputs' signatures
	  txTmp.ins.forEach(function (txIn) {
	    txIn.script = Script.EMPTY
	  })
	  txTmp.ins[inIndex].script = hashScript

	  var hashTypeModifier = hashType & 0x1f

	  if (hashTypeModifier === Transaction.SIGHASH_NONE) {
	    assert(false, 'SIGHASH_NONE not yet supported')
	  } else if (hashTypeModifier === Transaction.SIGHASH_SINGLE) {
	    assert(false, 'SIGHASH_SINGLE not yet supported')
	  }

	  if (hashType & Transaction.SIGHASH_ANYONECANPAY) {
	    assert(false, 'SIGHASH_ANYONECANPAY not yet supported')
	  }

	  var hashTypeBuffer = new Buffer(4)
	  hashTypeBuffer.writeInt32LE(hashType, 0)

	  var buffer = Buffer.concat([txTmp.toBuffer(), hashTypeBuffer])
	  return crypto.hash256(buffer)
	}

	Transaction.prototype.getHash = function () {
	  return crypto.hash256(this.toBuffer())
	}

	Transaction.prototype.getId = function () {
	  // TxHash is little-endian, we need big-endian
	  return bufferutils.reverse(this.getHash()).toString('hex')
	}

	Transaction.prototype.toBuffer = function () {
	  function scriptSize (script) {
	    var length = script.buffer.length

	    return bufferutils.varIntSize(length) + length
	  }

	  var buffer = new Buffer(
	    8 +
	    bufferutils.varIntSize(this.ins.length) +
	    bufferutils.varIntSize(this.outs.length) +
	    this.ins.reduce(function (sum, input) { return sum + 40 + scriptSize(input.script) }, 0) +
	    this.outs.reduce(function (sum, output) { return sum + 8 + scriptSize(output.script) }, 0)
	  )

	  var offset = 0
	  function writeSlice (slice) {
	    slice.copy(buffer, offset)
	    offset += slice.length
	  }

	  function writeUInt32 (i) {
	    buffer.writeUInt32LE(i, offset)
	    offset += 4
	  }

	  function writeUInt64 (i) {
	    bufferutils.writeUInt64LE(buffer, i, offset)
	    offset += 8
	  }

	  function writeVarInt (i) {
	    var n = bufferutils.writeVarInt(buffer, i, offset)
	    offset += n
	  }

	  writeUInt32(this.version)
	  writeVarInt(this.ins.length)

	  this.ins.forEach(function (txIn) {
	    writeSlice(txIn.hash)
	    writeUInt32(txIn.index)
	    writeVarInt(txIn.script.buffer.length)
	    writeSlice(txIn.script.buffer)
	    writeUInt32(txIn.sequence)
	  })

	  writeVarInt(this.outs.length)
	  this.outs.forEach(function (txOut) {
	    writeUInt64(txOut.value)
	    writeVarInt(txOut.script.buffer.length)
	    writeSlice(txOut.script.buffer)
	  })

	  writeUInt32(this.locktime)

	  return buffer
	}

	Transaction.prototype.toHex = function () {
	  return this.toBuffer().toString('hex')
	}

	Transaction.prototype.setInputScript = function (index, script) {
	  typeForce('Number', index)
	  typeForce('Script', script)

	  this.ins[index].script = script
	}

	// FIXME: remove in 2.x.y
	Transaction.prototype.sign = function (index, privKey, hashType) {
	  console.warn('Transaction.prototype.sign is deprecated.  Use TransactionBuilder instead.')

	  var prevOutScript = privKey.pub.getAddress().toOutputScript()
	  var signature = this.signInput(index, prevOutScript, privKey, hashType)

	  var scriptSig = scripts.pubKeyHashInput(signature, privKey.pub)
	  this.setInputScript(index, scriptSig)
	}

	// FIXME: remove in 2.x.y
	Transaction.prototype.signInput = function (index, prevOutScript, privKey, hashType) {
	  console.warn('Transaction.prototype.signInput is deprecated.  Use TransactionBuilder instead.')

	  hashType = hashType || Transaction.SIGHASH_ALL

	  var hash = this.hashForSignature(index, prevOutScript, hashType)
	  var signature = privKey.sign(hash)

	  return signature.toScriptSignature(hashType)
	}

	// FIXME: remove in 2.x.y
	Transaction.prototype.validateInput = function (index, prevOutScript, pubKey, buffer) {
	  console.warn('Transaction.prototype.validateInput is deprecated.  Use TransactionBuilder instead.')

	  var parsed = ECSignature.parseScriptSignature(buffer)
	  var hash = this.hashForSignature(index, prevOutScript, parsed.hashType)

	  return pubKey.verify(hash, parsed.signature)
	}

	module.exports = Transaction

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var createHmac = __webpack_require__(72)
	var typeForce = __webpack_require__(52)

	var BigInteger = __webpack_require__(61)
	var ECSignature = __webpack_require__(68)

	var ZERO = new Buffer([0])
	var ONE = new Buffer([1])

	// https://tools.ietf.org/html/rfc6979#section-3.2
	function deterministicGenerateK (curve, hash, d, checkSig) {
	  typeForce('Buffer', hash)
	  typeForce('BigInteger', d)

	  // FIXME: remove/uncomment for 2.0.0
	  //  typeForce('Function', checkSig)

	  if (typeof checkSig !== 'function') {
	    console.warn('deterministicGenerateK requires a checkSig callback in 2.0.0, see #337 for more information')

	    checkSig = function (k) {
	      var G = curve.G
	      var n = curve.n
	      var e = BigInteger.fromBuffer(hash)

	      var Q = G.multiply(k)

	      if (curve.isInfinity(Q))
	        return false

	      var r = Q.affineX.mod(n)
	      if (r.signum() === 0)
	        return false

	      var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n)
	      if (s.signum() === 0)
	        return false

	      return true
	    }
	  }

	  // sanity check
	  assert.equal(hash.length, 32, 'Hash must be 256 bit')

	  var x = d.toBuffer(32)
	  var k = new Buffer(32)
	  var v = new Buffer(32)

	  // Step A, ignored as hash already provided
	  // Step B
	  v.fill(1)

	  // Step C
	  k.fill(0)

	  // Step D
	  k = createHmac('sha256', k)
	    .update(v)
	    .update(ZERO)
	    .update(x)
	    .update(hash)
	    .digest()

	  // Step E
	  v = createHmac('sha256', k).update(v).digest()

	  // Step F
	  k = createHmac('sha256', k)
	    .update(v)
	    .update(ONE)
	    .update(x)
	    .update(hash)
	    .digest()

	  // Step G
	  v = createHmac('sha256', k).update(v).digest()

	  // Step H1/H2a, ignored as tlen === qlen (256 bit)
	  // Step H2b
	  v = createHmac('sha256', k).update(v).digest()

	  var T = BigInteger.fromBuffer(v)

	  // Step H3, repeat until T is within the interval [1, n - 1] and is suitable for ECDSA
	  while ((T.signum() <= 0) || (T.compareTo(curve.n) >= 0) || !checkSig(T)) {
	    k = createHmac('sha256', k)
	      .update(v)
	      .update(ZERO)
	      .digest()

	    v = createHmac('sha256', k).update(v).digest()

	    // Step H1/H2a, again, ignored as tlen === qlen (256 bit)
	    // Step H2b again
	    v = createHmac('sha256', k).update(v).digest()
	    T = BigInteger.fromBuffer(v)
	  }

	  return T
	}

	function sign (curve, hash, d) {
	  var r, s

	  var e = BigInteger.fromBuffer(hash)
	  var n = curve.n
	  var G = curve.G

	  deterministicGenerateK(curve, hash, d, function (k) {
	    var Q = G.multiply(k)

	    if (curve.isInfinity(Q))
	      return false

	    r = Q.affineX.mod(n)
	    if (r.signum() === 0)
	      return false

	    s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n)
	    if (s.signum() === 0)
	      return false

	    return true
	  })

	  var N_OVER_TWO = n.shiftRight(1)

	  // enforce low S values, see bip62: 'low s values in signatures'
	  if (s.compareTo(N_OVER_TWO) > 0) {
	    s = n.subtract(s)
	  }

	  return new ECSignature(r, s)
	}

	function verifyRaw (curve, e, signature, Q) {
	  var n = curve.n
	  var G = curve.G

	  var r = signature.r
	  var s = signature.s

	  // 1.4.1 Enforce r and s are both integers in the interval [1, n − 1]
	  if (r.signum() <= 0 || r.compareTo(n) >= 0) return false
	  if (s.signum() <= 0 || s.compareTo(n) >= 0) return false

	  // c = s^-1 mod n
	  var c = s.modInverse(n)

	  // 1.4.4 Compute u1 = es^−1 mod n
	  //               u2 = rs^−1 mod n
	  var u1 = e.multiply(c).mod(n)
	  var u2 = r.multiply(c).mod(n)

	  // 1.4.5 Compute R = (xR, yR) = u1G + u2Q
	  var R = G.multiplyTwo(u1, Q, u2)
	  var v = R.affineX.mod(n)

	  // 1.4.5 (cont.) Enforce R is not at infinity
	  if (curve.isInfinity(R)) return false

	  // 1.4.8 If v = r, output "valid", and if v != r, output "invalid"
	  return v.equals(r)
	}

	function verify (curve, hash, signature, Q) {
	  // 1.4.2 H = Hash(M), already done by the user
	  // 1.4.3 e = H
	  var e = BigInteger.fromBuffer(hash)

	  return verifyRaw(curve, e, signature, Q)
	}

	/**
	  * Recover a public key from a signature.
	  *
	  * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
	  * Key Recovery Operation".
	  *
	  * http://www.secg.org/download/aid-780/sec1-v2.pdf
	  */
	function recoverPubKey (curve, e, signature, i) {
	  assert.strictEqual(i & 3, i, 'Recovery param is more than two bits')

	  var n = curve.n
	  var G = curve.G

	  var r = signature.r
	  var s = signature.s

	  assert(r.signum() > 0 && r.compareTo(n) < 0, 'Invalid r value')
	  assert(s.signum() > 0 && s.compareTo(n) < 0, 'Invalid s value')

	  // A set LSB signifies that the y-coordinate is odd
	  var isYOdd = i & 1

	  // The more significant bit specifies whether we should use the
	  // first or second candidate key.
	  var isSecondKey = i >> 1

	  // 1.1 Let x = r + jn
	  var x = isSecondKey ? r.add(n) : r
	  var R = curve.pointFromX(isYOdd, x)

	  // 1.4 Check that nR is at infinity
	  var nR = R.multiply(n)
	  assert(curve.isInfinity(nR), 'nR is not a valid curve point')

	  // Compute -e from e
	  var eNeg = e.negate().mod(n)

	  // 1.6.1 Compute Q = r^-1 (sR -  eG)
	  //               Q = r^-1 (sR + -eG)
	  var rInv = r.modInverse(n)

	  var Q = R.multiplyTwo(s, G, eNeg).multiply(rInv)
	  curve.validate(Q)

	  return Q
	}

	/**
	  * Calculate pubkey extraction parameter.
	  *
	  * When extracting a pubkey from a signature, we have to
	  * distinguish four different cases. Rather than putting this
	  * burden on the verifier, Bitcoin includes a 2-bit value with the
	  * signature.
	  *
	  * This function simply tries all four cases and returns the value
	  * that resulted in a successful pubkey recovery.
	  */
	function calcPubKeyRecoveryParam (curve, e, signature, Q) {
	  for (var i = 0; i < 4; i++) {
	    var Qprime = recoverPubKey(curve, e, signature, i)

	    // 1.6.2 Verify Q
	    if (Qprime.equals(Q)) {
	      return i
	    }
	  }

	  throw new Error('Unable to find valid recovery factor')
	}

	module.exports = {
	  calcPubKeyRecoveryParam: calcPubKeyRecoveryParam,
	  deterministicGenerateK: deterministicGenerateK,
	  recoverPubKey: recoverPubKey,
	  sign: sign,
	  verify: verify,
	  verifyRaw: verifyRaw
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var base58check = __webpack_require__(13)
	var ecdsa = __webpack_require__(76)
	var networks = __webpack_require__(56)
	var randomBytes = __webpack_require__(78)
	var typeForce = __webpack_require__(52)

	var BigInteger = __webpack_require__(61)
	var ECPubKey = __webpack_require__(79)

	var ecurve = __webpack_require__(59)
	var secp256k1 = ecurve.getCurveByName('secp256k1')

	function ECKey (d, compressed) {
	  assert(d.signum() > 0, 'Private key must be greater than 0')
	  assert(d.compareTo(ECKey.curve.n) < 0, 'Private key must be less than the curve order')

	  var Q = ECKey.curve.G.multiply(d)

	  this.d = d
	  this.pub = new ECPubKey(Q, compressed)
	}

	// Constants
	ECKey.curve = secp256k1

	// Static constructors
	ECKey.fromWIF = function (string) {
	  var payload = base58check.decode(string)
	  var compressed = false

	  // Ignore the version byte
	  payload = payload.slice(1)

	  if (payload.length === 33) {
	    assert.strictEqual(payload[32], 0x01, 'Invalid compression flag')

	    // Truncate the compression flag
	    payload = payload.slice(0, -1)
	    compressed = true
	  }

	  assert.equal(payload.length, 32, 'Invalid WIF payload length')

	  var d = BigInteger.fromBuffer(payload)
	  return new ECKey(d, compressed)
	}

	ECKey.makeRandom = function (compressed, rng) {
	  rng = rng || randomBytes

	  var buffer = rng(32)
	  typeForce('Buffer', buffer)
	  assert.equal(buffer.length, 32, 'Expected 256-bit Buffer from RNG')

	  var d = BigInteger.fromBuffer(buffer)
	  d = d.mod(ECKey.curve.n)

	  return new ECKey(d, compressed)
	}

	// Export functions
	ECKey.prototype.toWIF = function (network) {
	  network = network || networks.bitcoin

	  var bufferLen = this.pub.compressed ? 34 : 33
	  var buffer = new Buffer(bufferLen)

	  buffer.writeUInt8(network.wif, 0)
	  this.d.toBuffer(32).copy(buffer, 1)

	  if (this.pub.compressed) {
	    buffer.writeUInt8(0x01, 33)
	  }

	  return base58check.encode(buffer)
	}

	// Operations
	ECKey.prototype.sign = function (hash) {
	  return ecdsa.sign(ECKey.curve, hash, this.d)
	}

	module.exports = ECKey

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, Buffer, process) {'use strict'

	function oldBrowser () {
	  throw new Error('secure random number generation not supported by this browser\nuse chrome, FireFox or Internet Explorer 11')
	}

	var crypto = global.crypto || global.msCrypto

	if (crypto && crypto.getRandomValues) {
	  module.exports = randomBytes
	} else {
	  module.exports = oldBrowser
	}

	function randomBytes (size, cb) {
	  // phantomjs needs to throw
	  if (size > 65536) throw new Error('requested too many random bytes')
	  // in case browserify  isn't using the Uint8Array version
	  var rawBytes = new global.Uint8Array(size)

	  // This will not work in older browsers.
	  // See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
	  if (size > 0) {  // getRandomValues fails on IE if size == 0
	    crypto.getRandomValues(rawBytes)
	  }
	  // phantomjs doesn't like a buffer being passed here
	  var bytes = new Buffer(rawBytes.buffer)

	  if (typeof cb === 'function') {
	    return process.nextTick(function () {
	      cb(null, bytes)
	    })
	  }

	  return bytes
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(2).Buffer, __webpack_require__(10)))

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var crypto = __webpack_require__(71)
	var ecdsa = __webpack_require__(76)
	var typeForce = __webpack_require__(52)
	var networks = __webpack_require__(56)

	var Address = __webpack_require__(7)

	var ecurve = __webpack_require__(59)
	var secp256k1 = ecurve.getCurveByName('secp256k1')

	function ECPubKey (Q, compressed) {
	  if (compressed === undefined) {
	    compressed = true
	  }

	  typeForce('Point', Q)
	  typeForce('Boolean', compressed)

	  this.compressed = compressed
	  this.Q = Q
	}

	// Constants
	ECPubKey.curve = secp256k1

	// Static constructors
	ECPubKey.fromBuffer = function (buffer) {
	  var Q = ecurve.Point.decodeFrom(ECPubKey.curve, buffer)
	  return new ECPubKey(Q, Q.compressed)
	}

	ECPubKey.fromHex = function (hex) {
	  return ECPubKey.fromBuffer(new Buffer(hex, 'hex'))
	}

	// Operations
	ECPubKey.prototype.getAddress = function (network) {
	  network = network || networks.bitcoin

	  return new Address(crypto.hash160(this.toBuffer()), network.pubKeyHash)
	}

	ECPubKey.prototype.verify = function (hash, signature) {
	  return ecdsa.verify(ECPubKey.curve, hash, signature, this.Q)
	}

	// Export functions
	ECPubKey.prototype.toBuffer = function () {
	  return this.Q.getEncoded(this.compressed)
	}

	ECPubKey.prototype.toHex = function () {
	  return this.toBuffer().toString('hex')
	}

	module.exports = ECPubKey

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var bufferutils = __webpack_require__(70)
	var crypto = __webpack_require__(71)
	var ecdsa = __webpack_require__(76)
	var networks = __webpack_require__(56)

	var BigInteger = __webpack_require__(61)
	var ECPubKey = __webpack_require__(79)
	var ECSignature = __webpack_require__(68)

	var ecurve = __webpack_require__(59)
	var ecparams = ecurve.getCurveByName('secp256k1')

	function magicHash (message, network) {
	  var magicPrefix = new Buffer(network.magicPrefix)
	  var messageBuffer = new Buffer(message)
	  var lengthBuffer = bufferutils.varIntBuffer(messageBuffer.length)

	  var buffer = Buffer.concat([magicPrefix, lengthBuffer, messageBuffer])
	  return crypto.hash256(buffer)
	}

	function sign (privKey, message, network) {
	  network = network || networks.bitcoin

	  var hash = magicHash(message, network)
	  var signature = privKey.sign(hash)
	  var e = BigInteger.fromBuffer(hash)
	  var i = ecdsa.calcPubKeyRecoveryParam(ecparams, e, signature, privKey.pub.Q)

	  return signature.toCompact(i, privKey.pub.compressed)
	}

	// TODO: network could be implied from address
	function verify (address, signature, message, network) {
	  if (!Buffer.isBuffer(signature)) {
	    signature = new Buffer(signature, 'base64')
	  }

	  network = network || networks.bitcoin

	  var hash = magicHash(message, network)
	  var parsed = ECSignature.parseCompact(signature)
	  var e = BigInteger.fromBuffer(hash)
	  var Q = ecdsa.recoverPubKey(ecparams, e, parsed.signature, parsed.i)

	  var pubKey = new ECPubKey(Q, parsed.compressed)
	  return pubKey.getAddress(network).toString() === address.toString()
	}

	module.exports = {
	  magicHash: magicHash,
	  sign: sign,
	  verify: verify
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var base58check = __webpack_require__(13)
	var bcrypto = __webpack_require__(71)
	var createHmac = __webpack_require__(72)
	var typeForce = __webpack_require__(52)
	var networks = __webpack_require__(56)

	var BigInteger = __webpack_require__(61)
	var ECKey = __webpack_require__(77)
	var ECPubKey = __webpack_require__(79)

	var ecurve = __webpack_require__(59)
	var curve = ecurve.getCurveByName('secp256k1')

	function findBIP32NetworkByVersion (version) {
	  for (var name in networks) {
	    var network = networks[name]

	    if (version === network.bip32.private || version === network.bip32.public) {
	      return network
	    }
	  }

	  assert(false, 'Could not find network for ' + version.toString(16))
	}

	function HDNode (K, chainCode, network) {
	  network = network || networks.bitcoin

	  typeForce('Buffer', chainCode)

	  assert.equal(chainCode.length, 32, 'Expected chainCode length of 32, got ' + chainCode.length)
	  assert(network.bip32, 'Unknown BIP32 constants for network')

	  this.chainCode = chainCode
	  this.depth = 0
	  this.index = 0
	  this.parentFingerprint = 0x00000000
	  this.network = network

	  if (K instanceof BigInteger) {
	    this.privKey = new ECKey(K, true)
	    this.pubKey = this.privKey.pub
	  } else if (K instanceof ECKey) {
	    assert(K.pub.compressed, 'ECKey must be compressed')
	    this.privKey = K
	    this.pubKey = K.pub
	  } else if (K instanceof ECPubKey) {
	    assert(K.compressed, 'ECPubKey must be compressed')
	    this.pubKey = K
	  } else {
	    this.pubKey = new ECPubKey(K, true)
	  }
	}

	HDNode.MASTER_SECRET = new Buffer('Bitcoin seed')
	HDNode.HIGHEST_BIT = 0x80000000
	HDNode.LENGTH = 78

	HDNode.fromSeedBuffer = function (seed, network) {
	  typeForce('Buffer', seed)

	  assert(seed.length >= 16, 'Seed should be at least 128 bits')
	  assert(seed.length <= 64, 'Seed should be at most 512 bits')

	  var I = createHmac('sha512', HDNode.MASTER_SECRET).update(seed).digest()
	  var IL = I.slice(0, 32)
	  var IR = I.slice(32)

	  // In case IL is 0 or >= n, the master key is invalid
	  // This is handled by `new ECKey` in the HDNode constructor
	  var pIL = BigInteger.fromBuffer(IL)

	  return new HDNode(pIL, IR, network)
	}

	HDNode.fromSeedHex = function (hex, network) {
	  return HDNode.fromSeedBuffer(new Buffer(hex, 'hex'), network)
	}

	HDNode.fromBase58 = function (string, network) {
	  return HDNode.fromBuffer(base58check.decode(string), network, true)
	}

	// FIXME: remove in 2.x.y
	HDNode.fromBuffer = function (buffer, network, __ignoreDeprecation) {
	  if (!__ignoreDeprecation) {
	    console.warn('HDNode.fromBuffer() is deprecated for removal in 2.x.y, use fromBase58 instead')
	  }

	  assert.strictEqual(buffer.length, HDNode.LENGTH, 'Invalid buffer length')

	  // 4 byte: version bytes
	  var version = buffer.readUInt32BE(0)

	  if (network) {
	    assert(version === network.bip32.private || version === network.bip32.public, "Network doesn't match")

	  // auto-detect
	  } else {
	    network = findBIP32NetworkByVersion(version)
	  }

	  // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ...
	  var depth = buffer.readUInt8(4)

	  // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
	  var parentFingerprint = buffer.readUInt32BE(5)
	  if (depth === 0) {
	    assert.strictEqual(parentFingerprint, 0x00000000, 'Invalid parent fingerprint')
	  }

	  // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
	  // This is encoded in MSB order. (0x00000000 if master key)
	  var index = buffer.readUInt32BE(9)
	  assert(depth > 0 || index === 0, 'Invalid index')

	  // 32 bytes: the chain code
	  var chainCode = buffer.slice(13, 45)
	  var data, hd

	  // 33 bytes: private key data (0x00 + k)
	  if (version === network.bip32.private) {
	    assert.strictEqual(buffer.readUInt8(45), 0x00, 'Invalid private key')
	    data = buffer.slice(46, 78)
	    var d = BigInteger.fromBuffer(data)
	    hd = new HDNode(d, chainCode, network)

	  // 33 bytes: public key data (0x02 + X or 0x03 + X)
	  } else {
	    data = buffer.slice(45, 78)
	    var Q = ecurve.Point.decodeFrom(curve, data)
	    assert.equal(Q.compressed, true, 'Invalid public key')

	    // Verify that the X coordinate in the public point corresponds to a point on the curve.
	    // If not, the extended public key is invalid.
	    curve.validate(Q)

	    hd = new HDNode(Q, chainCode, network)
	  }

	  hd.depth = depth
	  hd.index = index
	  hd.parentFingerprint = parentFingerprint

	  return hd
	}

	// FIXME: remove in 2.x.y
	HDNode.fromHex = function (hex, network) {
	  return HDNode.fromBuffer(new Buffer(hex, 'hex'), network)
	}

	HDNode.prototype.getIdentifier = function () {
	  return bcrypto.hash160(this.pubKey.toBuffer())
	}

	HDNode.prototype.getFingerprint = function () {
	  return this.getIdentifier().slice(0, 4)
	}

	HDNode.prototype.getAddress = function () {
	  return this.pubKey.getAddress(this.network)
	}

	HDNode.prototype.neutered = function () {
	  var neutered = new HDNode(this.pubKey.Q, this.chainCode, this.network)
	  neutered.depth = this.depth
	  neutered.index = this.index
	  neutered.parentFingerprint = this.parentFingerprint

	  return neutered
	}

	HDNode.prototype.toBase58 = function (isPrivate) {
	  return base58check.encode(this.toBuffer(isPrivate, true))
	}

	// FIXME: remove in 2.x.y
	HDNode.prototype.toBuffer = function (isPrivate, __ignoreDeprecation) {
	  if (isPrivate === undefined) {
	    isPrivate = !!this.privKey

	  // FIXME: remove in 2.x.y
	  } else {
	    console.warn('isPrivate flag is deprecated, please use the .neutered() method instead')
	  }

	  if (!__ignoreDeprecation) {
	    console.warn('HDNode.toBuffer() is deprecated for removal in 2.x.y, use toBase58 instead')
	  }

	  // Version
	  var version = isPrivate ? this.network.bip32.private : this.network.bip32.public
	  var buffer = new Buffer(HDNode.LENGTH)

	  // 4 bytes: version bytes
	  buffer.writeUInt32BE(version, 0)

	  // Depth
	  // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ....
	  buffer.writeUInt8(this.depth, 4)

	  // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
	  buffer.writeUInt32BE(this.parentFingerprint, 5)

	  // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
	  // This is encoded in Big endian. (0x00000000 if master key)
	  buffer.writeUInt32BE(this.index, 9)

	  // 32 bytes: the chain code
	  this.chainCode.copy(buffer, 13)

	  // 33 bytes: the public key or private key data
	  if (isPrivate) {
	    // FIXME: remove in 2.x.y
	    assert(this.privKey, 'Missing private key')

	    // 0x00 + k for private keys
	    buffer.writeUInt8(0, 45)
	    this.privKey.d.toBuffer(32).copy(buffer, 46)
	  } else {
	    // X9.62 encoding for public keys
	    this.pubKey.toBuffer().copy(buffer, 45)
	  }

	  return buffer
	}

	// FIXME: remove in 2.x.y
	HDNode.prototype.toHex = function (isPrivate) {
	  return this.toBuffer(isPrivate).toString('hex')
	}

	// https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#child-key-derivation-ckd-functions
	HDNode.prototype.derive = function (index) {
	  var isHardened = index >= HDNode.HIGHEST_BIT
	  var indexBuffer = new Buffer(4)
	  indexBuffer.writeUInt32BE(index, 0)

	  var data

	  // Hardened child
	  if (isHardened) {
	    assert(this.privKey, 'Could not derive hardened child key')

	    // data = 0x00 || ser256(kpar) || ser32(index)
	    data = Buffer.concat([
	      this.privKey.d.toBuffer(33),
	      indexBuffer
	    ])

	  // Normal child
	  } else {
	    // data = serP(point(kpar)) || ser32(index)
	    //      = serP(Kpar) || ser32(index)
	    data = Buffer.concat([
	      this.pubKey.toBuffer(),
	      indexBuffer
	    ])
	  }

	  var I = createHmac('sha512', this.chainCode).update(data).digest()
	  var IL = I.slice(0, 32)
	  var IR = I.slice(32)

	  var pIL = BigInteger.fromBuffer(IL)

	  // In case parse256(IL) >= n, proceed with the next value for i
	  if (pIL.compareTo(curve.n) >= 0) {
	    return this.derive(index + 1)
	  }

	  // Private parent key -> private child key
	  var hd
	  if (this.privKey) {
	    // ki = parse256(IL) + kpar (mod n)
	    var ki = pIL.add(this.privKey.d).mod(curve.n)

	    // In case ki == 0, proceed with the next value for i
	    if (ki.signum() === 0) {
	      return this.derive(index + 1)
	    }

	    hd = new HDNode(ki, IR, this.network)

	  // Public parent key -> public child key
	  } else {
	    // Ki = point(parse256(IL)) + Kpar
	    //    = G*IL + Kpar
	    var Ki = curve.G.multiply(pIL).add(this.pubKey.Q)

	    // In case Ki is the point at infinity, proceed with the next value for i
	    if (curve.isInfinity(Ki)) {
	      return this.derive(index + 1)
	    }

	    hd = new HDNode(Ki, IR, this.network)
	  }

	  hd.depth = this.depth + 1
	  hd.index = index
	  hd.parentFingerprint = this.getFingerprint().readUInt32BE(0)

	  return hd
	}

	HDNode.prototype.deriveHardened = function (index) {
	  // Only derives hardened private keys by default
	  return this.derive(index + HDNode.HIGHEST_BIT)
	}

	HDNode.prototype.toString = HDNode.prototype.toBase58

	module.exports = HDNode

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var ops = __webpack_require__(58)
	var scripts = __webpack_require__(57)

	var ECPubKey = __webpack_require__(79)
	var ECSignature = __webpack_require__(68)
	var Script = __webpack_require__(69)
	var Transaction = __webpack_require__(75)

	function extractInput (txIn) {
	  var redeemScript
	  var scriptSig = txIn.script
	  var prevOutScript
	  var prevOutType = scripts.classifyInput(scriptSig, true)
	  var scriptType

	  // Re-classify if scriptHash
	  if (prevOutType === 'scripthash') {
	    redeemScript = Script.fromBuffer(scriptSig.chunks.slice(-1)[0])
	    prevOutScript = scripts.scriptHashOutput(redeemScript.getHash())

	    scriptSig = Script.fromChunks(scriptSig.chunks.slice(0, -1))
	    scriptType = scripts.classifyInput(scriptSig, true)
	  } else {
	    scriptType = prevOutType
	  }

	  // Extract hashType, pubKeys and signatures
	  var hashType, parsed, pubKeys, signatures

	  switch (scriptType) {
	    case 'pubkeyhash': {
	      parsed = ECSignature.parseScriptSignature(scriptSig.chunks[0])
	      hashType = parsed.hashType
	      pubKeys = [ECPubKey.fromBuffer(scriptSig.chunks[1])]
	      signatures = [parsed.signature]
	      prevOutScript = pubKeys[0].getAddress().toOutputScript()

	      break
	    }

	    case 'pubkey': {
	      parsed = ECSignature.parseScriptSignature(scriptSig.chunks[0])
	      hashType = parsed.hashType
	      signatures = [parsed.signature]

	      if (redeemScript) {
	        pubKeys = [ECPubKey.fromBuffer(redeemScript.chunks[0])]
	      }

	      break
	    }

	    case 'multisig': {
	      signatures = scriptSig.chunks.slice(1).map(function (chunk) {
	        if (chunk === ops.OP_0) return chunk

	        var parsed = ECSignature.parseScriptSignature(chunk)
	        hashType = parsed.hashType

	        return parsed.signature
	      })

	      if (redeemScript) {
	        pubKeys = redeemScript.chunks.slice(1, -2).map(ECPubKey.fromBuffer)
	      }

	      break
	    }
	  }

	  return {
	    hashType: hashType,
	    prevOutScript: prevOutScript,
	    prevOutType: prevOutType,
	    pubKeys: pubKeys,
	    redeemScript: redeemScript,
	    scriptType: scriptType,
	    signatures: signatures
	  }
	}

	function TransactionBuilder () {
	  this.prevTxMap = {}
	  this.prevOutScripts = {}
	  this.prevOutTypes = {}

	  this.inputs = []
	  this.tx = new Transaction()
	}

	TransactionBuilder.fromTransaction = function (transaction) {
	  var txb = new TransactionBuilder()

	  // Copy other transaction fields
	  txb.tx.version = transaction.version
	  txb.tx.locktime = transaction.locktime

	  // Extract/add inputs
	  transaction.ins.forEach(function (txIn) {
	    txb.addInput(txIn.hash, txIn.index, txIn.sequence)
	  })

	  // Extract/add outputs
	  transaction.outs.forEach(function (txOut) {
	    txb.addOutput(txOut.script, txOut.value)
	  })

	  // Extract/add signatures
	  txb.inputs = transaction.ins.map(function (txIn) {
	    // TODO: remove me after testcase added
	    assert(!Transaction.isCoinbaseHash(txIn.hash), 'coinbase inputs not supported')

	    // Ignore empty scripts
	    if (txIn.script.buffer.length === 0) return {}

	    return extractInput(txIn)
	  })

	  return txb
	}

	TransactionBuilder.prototype.addInput = function (prevTx, index, sequence, prevOutScript) {
	  var prevOutHash

	  // txId
	  if (typeof prevTx === 'string') {
	    prevOutHash = new Buffer(prevTx, 'hex')

	    // TxId hex is big-endian, we want little-endian hash
	    Array.prototype.reverse.call(prevOutHash)

	  // Transaction
	  } else if (prevTx instanceof Transaction) {
	    prevOutHash = prevTx.getHash()
	    prevOutScript = prevTx.outs[index].script

	  // txHash
	  } else {
	    prevOutHash = prevTx
	  }

	  var input = {}
	  if (prevOutScript) {
	    var prevOutType = scripts.classifyOutput(prevOutScript)

	    // if we can, extract pubKey information
	    switch (prevOutType) {
	      case 'multisig': {
	        input.pubKeys = prevOutScript.chunks.slice(1, -2).map(ECPubKey.fromBuffer)
	        break
	      }

	      case 'pubkey': {
	        input.pubKeys = prevOutScript.chunks.slice(0, 1).map(ECPubKey.fromBuffer)
	        break
	      }
	    }

	    if (prevOutType !== 'scripthash') {
	      input.scriptType = prevOutType
	    }

	    input.prevOutScript = prevOutScript
	    input.prevOutType = prevOutType
	  }

	  assert(this.inputs.every(function (input2) {
	    if (input2.hashType === undefined) return true

	    return input2.hashType & Transaction.SIGHASH_ANYONECANPAY
	  }), 'No, this would invalidate signatures')

	  var prevOut = prevOutHash.toString('hex') + ':' + index
	  assert(!(prevOut in this.prevTxMap), 'Transaction is already an input')

	  var vin = this.tx.addInput(prevOutHash, index, sequence)
	  this.inputs[vin] = input
	  this.prevTxMap[prevOut] = vin

	  return vin
	}

	TransactionBuilder.prototype.addOutput = function (scriptPubKey, value) {
	  assert(this.inputs.every(function (input) {
	    if (input.hashType === undefined) return true

	    return (input.hashType & 0x1f) === Transaction.SIGHASH_SINGLE
	  }), 'No, this would invalidate signatures')

	  return this.tx.addOutput(scriptPubKey, value)
	}

	TransactionBuilder.prototype.build = function () {
	  return this.__build(false)
	}
	TransactionBuilder.prototype.buildIncomplete = function () {
	  return this.__build(true)
	}

	var canSignTypes = {
	  'pubkeyhash': true,
	  'multisig': true,
	  'pubkey': true
	}

	TransactionBuilder.prototype.__build = function (allowIncomplete) {
	  if (!allowIncomplete) {
	    assert(this.tx.ins.length > 0, 'Transaction has no inputs')
	    assert(this.tx.outs.length > 0, 'Transaction has no outputs')
	  }

	  var tx = this.tx.clone()

	  // Create script signatures from signature meta-data
	  this.inputs.forEach(function (input, index) {
	    var scriptType = input.scriptType
	    var scriptSig

	    if (!allowIncomplete) {
	      assert(!!scriptType, 'Transaction is not complete')
	      assert(scriptType in canSignTypes, scriptType + ' not supported')
	      assert(input.signatures, 'Transaction is missing signatures')
	    }

	    if (input.signatures) {
	      switch (scriptType) {
	        case 'pubkeyhash': {
	          var pkhSignature = input.signatures[0].toScriptSignature(input.hashType)
	          scriptSig = scripts.pubKeyHashInput(pkhSignature, input.pubKeys[0])
	          break
	        }

	        case 'multisig': {
	          // Array.prototype.map is sparse-compatible
	          var msSignatures = input.signatures.map(function (signature) {
	            return signature && signature.toScriptSignature(input.hashType)
	          })

	          // fill in blanks with OP_0
	          if (allowIncomplete) {
	            for (var i = 0; i < msSignatures.length; ++i) {
	              if (msSignatures[i]) continue

	              msSignatures[i] = ops.OP_0
	            }
	          } else {
	            // Array.prototype.filter returns non-sparse array
	            msSignatures = msSignatures.filter(function (x) { return x })
	          }

	          var redeemScript = allowIncomplete ? undefined : input.redeemScript
	          scriptSig = scripts.multisigInput(msSignatures, redeemScript)
	          break
	        }

	        case 'pubkey': {
	          var pkSignature = input.signatures[0].toScriptSignature(input.hashType)
	          scriptSig = scripts.pubKeyInput(pkSignature)
	          break
	        }
	      }
	    }

	    // did we build a scriptSig?
	    if (scriptSig) {
	      // wrap as scriptHash if necessary
	      if (input.prevOutType === 'scripthash') {
	        scriptSig = scripts.scriptHashInput(scriptSig, input.redeemScript)
	      }

	      tx.setInputScript(index, scriptSig)
	    }
	  })

	  return tx
	}

	TransactionBuilder.prototype.sign = function (index, privKey, redeemScript, hashType) {
	  assert(index in this.inputs, 'No input at index: ' + index)
	  hashType = hashType || Transaction.SIGHASH_ALL

	  var input = this.inputs[index]
	  var canSign = input.hashType &&
	    input.prevOutScript &&
	    input.prevOutType &&
	    input.pubKeys &&
	    input.scriptType &&
	    input.signatures

	  // are we almost ready to sign?
	  if (canSign) {
	    // if redeemScript was provided, enforce consistency
	    if (redeemScript) {
	      assert.deepEqual(input.redeemScript, redeemScript, 'Inconsistent redeemScript')
	    }

	    assert.equal(input.hashType, hashType, 'Inconsistent hashType')

	  // no? prepare
	  } else {
	    // must be pay-to-scriptHash?
	    if (redeemScript) {
	      // if we have a prevOutScript, enforce scriptHash equality to the redeemScript
	      if (input.prevOutScript) {
	        assert.equal(input.prevOutType, 'scripthash', 'PrevOutScript must be P2SH')

	        var scriptHash = input.prevOutScript.chunks[1]
	        assert.deepEqual(scriptHash, redeemScript.getHash(), 'RedeemScript does not match ' + scriptHash.toString('hex'))
	      }

	      var scriptType = scripts.classifyOutput(redeemScript)
	      assert(scriptType in canSignTypes, 'RedeemScript not supported (' + scriptType + ')')

	      var pubKeys = []
	      switch (scriptType) {
	        case 'multisig': {
	          pubKeys = redeemScript.chunks.slice(1, -2).map(ECPubKey.fromBuffer)
	          break
	        }

	        case 'pubkeyhash': {
	          var pkh1 = redeemScript.chunks[2]
	          var pkh2 = privKey.pub.getAddress().hash

	          assert.deepEqual(pkh1, pkh2, 'privateKey cannot sign for this input')
	          pubKeys = [privKey.pub]
	          break
	        }

	        case 'pubkey': {
	          pubKeys = redeemScript.chunks.slice(0, 1).map(ECPubKey.fromBuffer)
	          break
	        }
	      }

	      if (!input.prevOutScript) {
	        input.prevOutScript = scripts.scriptHashOutput(redeemScript.getHash())
	        input.prevOutType = 'scripthash'
	      }

	      input.pubKeys = pubKeys
	      input.redeemScript = redeemScript
	      input.scriptType = scriptType

	    // cannot be pay-to-scriptHash
	    } else {
	      assert.notEqual(input.prevOutType, 'scripthash', 'PrevOutScript is P2SH, missing redeemScript')

	      // can we otherwise sign this?
	      if (input.scriptType) {
	        assert(input.pubKeys, input.scriptType + ' not supported')

	      // we know nothin' Jon Snow, assume pubKeyHash
	      } else {
	        input.prevOutScript = privKey.pub.getAddress().toOutputScript()
	        input.prevOutType = 'pubkeyhash'
	        input.pubKeys = [privKey.pub]
	        input.scriptType = input.prevOutType
	      }
	    }

	    input.hashType = hashType
	    input.signatures = input.signatures || []
	  }

	  var signatureScript = input.redeemScript || input.prevOutScript
	  var signatureHash = this.tx.hashForSignature(index, signatureScript, hashType)

	  // enforce signature order matches public keys
	  if (input.scriptType === 'multisig' && input.redeemScript && input.signatures.length !== input.pubKeys.length) {
	    // maintain a local copy of unmatched signatures
	    var unmatched = input.signatures.slice()

	    input.signatures = input.pubKeys.map(function (pubKey) {
	      var match

	      // check for any matching signatures
	      unmatched.some(function (signature, i) {
	        if (!pubKey.verify(signatureHash, signature)) return false
	        match = signature

	        // remove matched signature from unmatched
	        unmatched.splice(i, 1)

	        return true
	      })

	      return match || undefined
	    })
	  }

	  // enforce in order signing of public keys
	  assert(input.pubKeys.some(function (pubKey, i) {
	    if (!privKey.pub.Q.equals(pubKey.Q)) return false

	    assert(!input.signatures[i], 'Signature already exists')
	    var signature = privKey.sign(signatureHash)
	    input.signatures[i] = signature

	    return true
	  }, this), 'privateKey cannot sign for this input')
	}

	module.exports = TransactionBuilder

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var assert = __webpack_require__(8)
	var bufferutils = __webpack_require__(70)
	var typeForce = __webpack_require__(52)
	var networks = __webpack_require__(56)
	var randomBytes = __webpack_require__(78)

	var Address = __webpack_require__(7)
	var HDNode = __webpack_require__(81)
	var TransactionBuilder = __webpack_require__(82)
	var Script = __webpack_require__(69)

	function Wallet (seed, network) {
	  console.warn('Wallet is deprecated and will be removed in 2.0.0, see #296')

	  seed = seed || randomBytes(32)
	  network = network || networks.bitcoin

	  // Stored in a closure to make accidental serialization less likely
	  var masterKey = HDNode.fromSeedBuffer(seed, network)

	  // HD first-level child derivation method should be hardened
	  // See https://bitcointalk.org/index.php?topic=405179.msg4415254#msg4415254
	  var accountZero = masterKey.deriveHardened(0)
	  var externalAccount = accountZero.derive(0)
	  var internalAccount = accountZero.derive(1)

	  this.addresses = []
	  this.changeAddresses = []
	  this.network = network
	  this.unspents = []

	  // FIXME: remove in 2.0.0
	  this.unspentMap = {}

	  // FIXME: remove in 2.0.0
	  var me = this
	  this.newMasterKey = function (seed) {
	    console.warn('newMasterKey is deprecated, please make a new Wallet instance instead')

	    seed = seed || randomBytes(32)
	    masterKey = HDNode.fromSeedBuffer(seed, network)

	    accountZero = masterKey.deriveHardened(0)
	    externalAccount = accountZero.derive(0)
	    internalAccount = accountZero.derive(1)

	    me.addresses = []
	    me.changeAddresses = []

	    me.unspents = []
	    me.unspentMap = {}
	  }

	  this.getMasterKey = function () {
	    return masterKey
	  }
	  this.getAccountZero = function () {
	    return accountZero
	  }
	  this.getExternalAccount = function () {
	    return externalAccount
	  }
	  this.getInternalAccount = function () {
	    return internalAccount
	  }
	}

	Wallet.prototype.createTransaction = function (to, value, options) {
	  // FIXME: remove in 2.0.0
	  if (typeof options !== 'object') {
	    if (options !== undefined) {
	      console.warn('Non options object parameters are deprecated, use options object instead')

	      options = {
	        fixedFee: arguments[2],
	        changeAddress: arguments[3]
	      }
	    }
	  }

	  options = options || {}

	  assert(value > this.network.dustThreshold, value + ' must be above dust threshold (' + this.network.dustThreshold + ' Satoshis)')

	  var changeAddress = options.changeAddress
	  var fixedFee = options.fixedFee
	  var minConf = options.minConf === undefined ? 0 : options.minConf // FIXME: change minConf:1 by default in 2.0.0

	  // filter by minConf, then pending and sort by descending value
	  var unspents = this.unspents.filter(function (unspent) {
	    return unspent.confirmations >= minConf
	  }).filter(function (unspent) {
	    return !unspent.pending
	  }).sort(function (o1, o2) {
	    return o2.value - o1.value
	  })

	  var accum = 0
	  var addresses = []
	  var subTotal = value

	  var txb = new TransactionBuilder()
	  txb.addOutput(to, value)

	  for (var i = 0; i < unspents.length; ++i) {
	    var unspent = unspents[i]
	    addresses.push(unspent.address)

	    txb.addInput(unspent.txHash, unspent.index)

	    var fee = fixedFee === undefined ? estimatePaddedFee(txb.buildIncomplete(), this.network) : fixedFee

	    accum += unspent.value
	    subTotal = value + fee

	    if (accum >= subTotal) {
	      var change = accum - subTotal

	      if (change > this.network.dustThreshold) {
	        txb.addOutput(changeAddress || this.getChangeAddress(), change)
	      }

	      break
	    }
	  }

	  assert(accum >= subTotal, 'Not enough funds (incl. fee): ' + accum + ' < ' + subTotal)

	  return this.signWith(txb, addresses).build()
	}

	// FIXME: remove in 2.0.0
	Wallet.prototype.processPendingTx = function (tx) {
	  this.__processTx(tx, true)
	}

	// FIXME: remove in 2.0.0
	Wallet.prototype.processConfirmedTx = function (tx) {
	  this.__processTx(tx, false)
	}

	// FIXME: remove in 2.0.0
	Wallet.prototype.__processTx = function (tx, isPending) {
	  console.warn('processTransaction is considered harmful, see issue #260 for more information')

	  var txId = tx.getId()
	  var txHash = tx.getHash()

	  tx.outs.forEach(function (txOut, i) {
	    var address

	    try {
	      address = Address.fromOutputScript(txOut.script, this.network).toString()
	    } catch (e) {
	      if (!(e.message.match(/has no matching Address/)))
	        throw e
	    }

	    var myAddresses = this.addresses.concat(this.changeAddresses)
	    if (myAddresses.indexOf(address) > -1) {
	      var lookup = txId + ':' + i
	      if (lookup in this.unspentMap) return

	      // its unique, add it
	      var unspent = {
	        address: address,
	        confirmations: 0, // no way to determine this without more information
	        index: i,
	        txHash: txHash,
	        txId: txId,
	        value: txOut.value,
	        pending: isPending
	      }

	      this.unspentMap[lookup] = unspent
	      this.unspents.push(unspent)
	    }
	  }, this)

	  tx.ins.forEach(function (txIn) {
	    // copy and convert to big-endian hex
	    var txInId = bufferutils.reverse(txIn.hash).toString('hex')

	    var lookup = txInId + ':' + txIn.index
	    if (!(lookup in this.unspentMap)) return

	    var unspent = this.unspentMap[lookup]

	    if (isPending) {
	      unspent.pending = true
	      unspent.spent = true
	    } else {
	      delete this.unspentMap[lookup]

	      this.unspents = this.unspents.filter(function (unspent2) {
	        return unspent !== unspent2
	      })
	    }
	  }, this)
	}

	Wallet.prototype.generateAddress = function () {
	  var k = this.addresses.length
	  var address = this.getExternalAccount().derive(k).getAddress()

	  this.addresses.push(address.toString())

	  return this.getReceiveAddress()
	}

	Wallet.prototype.generateChangeAddress = function () {
	  var k = this.changeAddresses.length
	  var address = this.getInternalAccount().derive(k).getAddress()

	  this.changeAddresses.push(address.toString())

	  return this.getChangeAddress()
	}

	Wallet.prototype.getAddress = function () {
	  if (this.addresses.length === 0) {
	    this.generateAddress()
	  }

	  return this.addresses[this.addresses.length - 1]
	}

	Wallet.prototype.getBalance = function (minConf) {
	  minConf = minConf || 0

	  return this.unspents.filter(function (unspent) {
	    return unspent.confirmations >= minConf

	      // FIXME: remove spent filter in 2.0.0
	  }).filter(function (unspent) {
	    return !unspent.spent
	  }).reduce(function (accum, unspent) {
	    return accum + unspent.value
	  }, 0)
	}

	Wallet.prototype.getChangeAddress = function () {
	  if (this.changeAddresses.length === 0) {
	    this.generateChangeAddress()
	  }

	  return this.changeAddresses[this.changeAddresses.length - 1]
	}

	Wallet.prototype.getInternalPrivateKey = function (index) {
	  return this.getInternalAccount().derive(index).privKey
	}

	Wallet.prototype.getPrivateKey = function (index) {
	  return this.getExternalAccount().derive(index).privKey
	}

	Wallet.prototype.getPrivateKeyForAddress = function (address) {
	  var index

	  if ((index = this.addresses.indexOf(address)) > -1) {
	    return this.getPrivateKey(index)
	  }

	  if ((index = this.changeAddresses.indexOf(address)) > -1) {
	    return this.getInternalPrivateKey(index)
	  }

	  assert(false, 'Unknown address. Make sure the address is from the keychain and has been generated')
	}

	Wallet.prototype.getUnspentOutputs = function (minConf) {
	  minConf = minConf || 0

	  return this.unspents.filter(function (unspent) {
	    return unspent.confirmations >= minConf

	      // FIXME: remove spent filter in 2.0.0
	  }).filter(function (unspent) {
	    return !unspent.spent
	  }).map(function (unspent) {
	    return {
	      address: unspent.address,
	      confirmations: unspent.confirmations,
	      index: unspent.index,
	      txId: unspent.txId,
	      value: unspent.value,

	      // FIXME: remove in 2.0.0
	      hash: unspent.txId,
	      pending: unspent.pending
	    }
	  })
	}

	Wallet.prototype.setUnspentOutputs = function (unspents) {
	  this.unspentMap = {}
	  this.unspents = unspents.map(function (unspent) {
	    // FIXME: remove unspent.hash in 2.0.0
	    var txId = unspent.txId || unspent.hash
	    var index = unspent.index

	    // FIXME: remove in 2.0.0
	    if (unspent.hash !== undefined) {
	      console.warn('unspent.hash is deprecated, use unspent.txId instead')
	    }

	    // FIXME: remove in 2.0.0
	    if (index === undefined) {
	      console.warn('unspent.outputIndex is deprecated, use unspent.index instead')
	      index = unspent.outputIndex
	    }

	    typeForce('String', txId)
	    typeForce('Number', index)
	    typeForce('Number', unspent.value)

	    assert.equal(txId.length, 64, 'Expected valid txId, got ' + txId)
	    assert.doesNotThrow(function () {
	      Address.fromBase58Check(unspent.address)
	    }, 'Expected Base58 Address, got ' + unspent.address)
	    assert(isFinite(index), 'Expected finite index, got ' + index)

	    // FIXME: remove branch in 2.0.0
	    if (unspent.confirmations !== undefined) {
	      typeForce('Number', unspent.confirmations)
	    }

	    var txHash = bufferutils.reverse(new Buffer(txId, 'hex'))

	    unspent = {
	      address: unspent.address,
	      confirmations: unspent.confirmations || 0,
	      index: index,
	      txHash: txHash,
	      txId: txId,
	      value: unspent.value,

	      // FIXME: remove in 2.0.0
	      pending: unspent.pending || false
	    }

	    // FIXME: remove in 2.0.0
	    this.unspentMap[txId + ':' + index] = unspent

	    return unspent
	  }, this)
	}

	Wallet.prototype.signWith = function (tx, addresses) {
	  addresses.forEach(function (address, i) {
	    var privKey = this.getPrivateKeyForAddress(address)

	    tx.sign(i, privKey)
	  }, this)

	  return tx
	}

	function estimatePaddedFee (tx, network) {
	  var tmpTx = tx.clone()
	  tmpTx.addOutput(Script.EMPTY, network.dustSoftThreshold || 0)

	  return network.estimateFee(tmpTx)
	}

	// FIXME: 1.0.0 shims, remove in 2.0.0
	Wallet.prototype.getReceiveAddress = Wallet.prototype.getAddress
	Wallet.prototype.createTx = Wallet.prototype.createTransaction

	module.exports = Wallet

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var rng = __webpack_require__(85)

	function error () {
	  var m = [].slice.call(arguments).join(' ')
	  throw new Error([
	    m,
	    'we accept pull requests',
	    'http://github.com/dominictarr/crypto-browserify'
	    ].join('\n'))
	}

	exports.createHash = __webpack_require__(87)

	exports.createHmac = __webpack_require__(96)

	exports.randomBytes = function(size, callback) {
	  if (callback && callback.call) {
	    try {
	      callback.call(this, undefined, new Buffer(rng(size)))
	    } catch (err) { callback(err) }
	  } else {
	    return new Buffer(rng(size))
	  }
	}

	function each(a, f) {
	  for(var i in a)
	    f(a[i], i)
	}

	exports.getHashes = function () {
	  return ['sha1', 'sha256', 'sha512', 'md5', 'rmd160']
	}

	var p = __webpack_require__(97)(exports)
	exports.pbkdf2 = p.pbkdf2
	exports.pbkdf2Sync = p.pbkdf2Sync
	__webpack_require__(99)(exports, module.exports);

	// the least I can do is make error messages for the rest of the node.js/crypto api.
	each(['createCredentials'
	, 'createSign'
	, 'createVerify'
	, 'createDiffieHellman'
	], function (name) {
	  exports[name] = function () {
	    error('sorry,', name, 'is not implemented yet')
	  }
	})

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, Buffer) {(function() {
	  var g = ('undefined' === typeof window ? global : window) || {}
	  _crypto = (
	    g.crypto || g.msCrypto || __webpack_require__(86)
	  )
	  module.exports = function(size) {
	    // Modern Browsers
	    if(_crypto.getRandomValues) {
	      var bytes = new Buffer(size); //in browserify, this is an extended Uint8Array
	      /* This will not work in older browsers.
	       * See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
	       */
	    
	      _crypto.getRandomValues(bytes);
	      return bytes;
	    }
	    else if (_crypto.randomBytes) {
	      return _crypto.randomBytes(size)
	    }
	    else
	      throw new Error(
	        'secure random number generation not supported by this browser\n'+
	        'use chrome, FireFox or Internet Explorer 11'
	      )
	  }
	}())

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(2).Buffer))

/***/ },
/* 86 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var createHash = __webpack_require__(88)

	var md5 = toConstructor(__webpack_require__(93))
	var rmd160 = toConstructor(__webpack_require__(95))

	function toConstructor (fn) {
	  return function () {
	    var buffers = []
	    var m= {
	      update: function (data, enc) {
	        if(!Buffer.isBuffer(data)) data = new Buffer(data, enc)
	        buffers.push(data)
	        return this
	      },
	      digest: function (enc) {
	        var buf = Buffer.concat(buffers)
	        var r = fn(buf)
	        buffers = null
	        return enc ? r.toString(enc) : r
	      }
	    }
	    return m
	  }
	}

	module.exports = function (alg) {
	  if('md5' === alg) return new md5()
	  if('rmd160' === alg) return new rmd160()
	  return createHash(alg)
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var exports = module.exports = function (alg) {
	  var Alg = exports[alg]
	  if(!Alg) throw new Error(alg + ' is not supported (we accept pull requests)')
	  return new Alg()
	}

	var Buffer = __webpack_require__(2).Buffer
	var Hash   = __webpack_require__(89)(Buffer)

	exports.sha1 = __webpack_require__(90)(Buffer, Hash)
	exports.sha256 = __webpack_require__(91)(Buffer, Hash)
	exports.sha512 = __webpack_require__(92)(Buffer, Hash)


/***/ },
/* 89 */
/***/ function(module, exports) {

	module.exports = function (Buffer) {

	  //prototype class for hash functions
	  function Hash (blockSize, finalSize) {
	    this._block = new Buffer(blockSize) //new Uint32Array(blockSize/4)
	    this._finalSize = finalSize
	    this._blockSize = blockSize
	    this._len = 0
	    this._s = 0
	  }

	  Hash.prototype.init = function () {
	    this._s = 0
	    this._len = 0
	  }

	  Hash.prototype.update = function (data, enc) {
	    if ("string" === typeof data) {
	      enc = enc || "utf8"
	      data = new Buffer(data, enc)
	    }

	    var l = this._len += data.length
	    var s = this._s = (this._s || 0)
	    var f = 0
	    var buffer = this._block

	    while (s < l) {
	      var t = Math.min(data.length, f + this._blockSize - (s % this._blockSize))
	      var ch = (t - f)

	      for (var i = 0; i < ch; i++) {
	        buffer[(s % this._blockSize) + i] = data[i + f]
	      }

	      s += ch
	      f += ch

	      if ((s % this._blockSize) === 0) {
	        this._update(buffer)
	      }
	    }
	    this._s = s

	    return this
	  }

	  Hash.prototype.digest = function (enc) {
	    // Suppose the length of the message M, in bits, is l
	    var l = this._len * 8

	    // Append the bit 1 to the end of the message
	    this._block[this._len % this._blockSize] = 0x80

	    // and then k zero bits, where k is the smallest non-negative solution to the equation (l + 1 + k) === finalSize mod blockSize
	    this._block.fill(0, this._len % this._blockSize + 1)

	    if (l % (this._blockSize * 8) >= this._finalSize * 8) {
	      this._update(this._block)
	      this._block.fill(0)
	    }

	    // to this append the block which is equal to the number l written in binary
	    // TODO: handle case where l is > Math.pow(2, 29)
	    this._block.writeInt32BE(l, this._blockSize - 4)

	    var hash = this._update(this._block) || this._hash()

	    return enc ? hash.toString(enc) : hash
	  }

	  Hash.prototype._update = function () {
	    throw new Error('_update must be implemented by subclass')
	  }

	  return Hash
	}


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
	 * in FIPS PUB 180-1
	 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for details.
	 */

	var inherits = __webpack_require__(9).inherits

	module.exports = function (Buffer, Hash) {

	  var A = 0|0
	  var B = 4|0
	  var C = 8|0
	  var D = 12|0
	  var E = 16|0

	  var W = new (typeof Int32Array === 'undefined' ? Array : Int32Array)(80)

	  var POOL = []

	  function Sha1 () {
	    if(POOL.length)
	      return POOL.pop().init()

	    if(!(this instanceof Sha1)) return new Sha1()
	    this._w = W
	    Hash.call(this, 16*4, 14*4)

	    this._h = null
	    this.init()
	  }

	  inherits(Sha1, Hash)

	  Sha1.prototype.init = function () {
	    this._a = 0x67452301
	    this._b = 0xefcdab89
	    this._c = 0x98badcfe
	    this._d = 0x10325476
	    this._e = 0xc3d2e1f0

	    Hash.prototype.init.call(this)
	    return this
	  }

	  Sha1.prototype._POOL = POOL
	  Sha1.prototype._update = function (X) {

	    var a, b, c, d, e, _a, _b, _c, _d, _e

	    a = _a = this._a
	    b = _b = this._b
	    c = _c = this._c
	    d = _d = this._d
	    e = _e = this._e

	    var w = this._w

	    for(var j = 0; j < 80; j++) {
	      var W = w[j] = j < 16 ? X.readInt32BE(j*4)
	        : rol(w[j - 3] ^ w[j -  8] ^ w[j - 14] ^ w[j - 16], 1)

	      var t = add(
	        add(rol(a, 5), sha1_ft(j, b, c, d)),
	        add(add(e, W), sha1_kt(j))
	      )

	      e = d
	      d = c
	      c = rol(b, 30)
	      b = a
	      a = t
	    }

	    this._a = add(a, _a)
	    this._b = add(b, _b)
	    this._c = add(c, _c)
	    this._d = add(d, _d)
	    this._e = add(e, _e)
	  }

	  Sha1.prototype._hash = function () {
	    if(POOL.length < 100) POOL.push(this)
	    var H = new Buffer(20)
	    //console.log(this._a|0, this._b|0, this._c|0, this._d|0, this._e|0)
	    H.writeInt32BE(this._a|0, A)
	    H.writeInt32BE(this._b|0, B)
	    H.writeInt32BE(this._c|0, C)
	    H.writeInt32BE(this._d|0, D)
	    H.writeInt32BE(this._e|0, E)
	    return H
	  }

	  /*
	   * Perform the appropriate triplet combination function for the current
	   * iteration
	   */
	  function sha1_ft(t, b, c, d) {
	    if(t < 20) return (b & c) | ((~b) & d);
	    if(t < 40) return b ^ c ^ d;
	    if(t < 60) return (b & c) | (b & d) | (c & d);
	    return b ^ c ^ d;
	  }

	  /*
	   * Determine the appropriate additive constant for the current iteration
	   */
	  function sha1_kt(t) {
	    return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
	           (t < 60) ? -1894007588 : -899497514;
	  }

	  /*
	   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	   * to work around bugs in some JS interpreters.
	   * //dominictarr: this is 10 years old, so maybe this can be dropped?)
	   *
	   */
	  function add(x, y) {
	    return (x + y ) | 0
	  //lets see how this goes on testling.
	  //  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  //  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  //  return (msw << 16) | (lsw & 0xFFFF);
	  }

	  /*
	   * Bitwise rotate a 32-bit number to the left.
	   */
	  function rol(num, cnt) {
	    return (num << cnt) | (num >>> (32 - cnt));
	  }

	  return Sha1
	}


/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
	 * in FIPS 180-2
	 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 *
	 */

	var inherits = __webpack_require__(9).inherits

	module.exports = function (Buffer, Hash) {

	  var K = [
	      0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
	      0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
	      0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
	      0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
	      0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
	      0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
	      0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
	      0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
	      0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
	      0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
	      0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
	      0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
	      0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
	      0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
	      0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
	      0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
	    ]

	  var W = new Array(64)

	  function Sha256() {
	    this.init()

	    this._w = W //new Array(64)

	    Hash.call(this, 16*4, 14*4)
	  }

	  inherits(Sha256, Hash)

	  Sha256.prototype.init = function () {

	    this._a = 0x6a09e667|0
	    this._b = 0xbb67ae85|0
	    this._c = 0x3c6ef372|0
	    this._d = 0xa54ff53a|0
	    this._e = 0x510e527f|0
	    this._f = 0x9b05688c|0
	    this._g = 0x1f83d9ab|0
	    this._h = 0x5be0cd19|0

	    this._len = this._s = 0

	    return this
	  }

	  function S (X, n) {
	    return (X >>> n) | (X << (32 - n));
	  }

	  function R (X, n) {
	    return (X >>> n);
	  }

	  function Ch (x, y, z) {
	    return ((x & y) ^ ((~x) & z));
	  }

	  function Maj (x, y, z) {
	    return ((x & y) ^ (x & z) ^ (y & z));
	  }

	  function Sigma0256 (x) {
	    return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
	  }

	  function Sigma1256 (x) {
	    return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
	  }

	  function Gamma0256 (x) {
	    return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
	  }

	  function Gamma1256 (x) {
	    return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
	  }

	  Sha256.prototype._update = function(M) {

	    var W = this._w
	    var a, b, c, d, e, f, g, h
	    var T1, T2

	    a = this._a | 0
	    b = this._b | 0
	    c = this._c | 0
	    d = this._d | 0
	    e = this._e | 0
	    f = this._f | 0
	    g = this._g | 0
	    h = this._h | 0

	    for (var j = 0; j < 64; j++) {
	      var w = W[j] = j < 16
	        ? M.readInt32BE(j * 4)
	        : Gamma1256(W[j - 2]) + W[j - 7] + Gamma0256(W[j - 15]) + W[j - 16]

	      T1 = h + Sigma1256(e) + Ch(e, f, g) + K[j] + w

	      T2 = Sigma0256(a) + Maj(a, b, c);
	      h = g; g = f; f = e; e = d + T1; d = c; c = b; b = a; a = T1 + T2;
	    }

	    this._a = (a + this._a) | 0
	    this._b = (b + this._b) | 0
	    this._c = (c + this._c) | 0
	    this._d = (d + this._d) | 0
	    this._e = (e + this._e) | 0
	    this._f = (f + this._f) | 0
	    this._g = (g + this._g) | 0
	    this._h = (h + this._h) | 0

	  };

	  Sha256.prototype._hash = function () {
	    var H = new Buffer(32)

	    H.writeInt32BE(this._a,  0)
	    H.writeInt32BE(this._b,  4)
	    H.writeInt32BE(this._c,  8)
	    H.writeInt32BE(this._d, 12)
	    H.writeInt32BE(this._e, 16)
	    H.writeInt32BE(this._f, 20)
	    H.writeInt32BE(this._g, 24)
	    H.writeInt32BE(this._h, 28)

	    return H
	  }

	  return Sha256

	}


/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(9).inherits

	module.exports = function (Buffer, Hash) {
	  var K = [
	    0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
	    0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
	    0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
	    0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
	    0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
	    0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
	    0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
	    0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
	    0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
	    0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
	    0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
	    0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
	    0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
	    0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
	    0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
	    0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
	    0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
	    0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
	    0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
	    0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
	    0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
	    0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
	    0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
	    0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
	    0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
	    0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
	    0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
	    0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
	    0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
	    0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
	    0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
	    0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
	    0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
	    0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
	    0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
	    0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
	    0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
	    0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
	    0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
	    0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
	  ]

	  var W = new Array(160)

	  function Sha512() {
	    this.init()
	    this._w = W

	    Hash.call(this, 128, 112)
	  }

	  inherits(Sha512, Hash)

	  Sha512.prototype.init = function () {

	    this._a = 0x6a09e667|0
	    this._b = 0xbb67ae85|0
	    this._c = 0x3c6ef372|0
	    this._d = 0xa54ff53a|0
	    this._e = 0x510e527f|0
	    this._f = 0x9b05688c|0
	    this._g = 0x1f83d9ab|0
	    this._h = 0x5be0cd19|0

	    this._al = 0xf3bcc908|0
	    this._bl = 0x84caa73b|0
	    this._cl = 0xfe94f82b|0
	    this._dl = 0x5f1d36f1|0
	    this._el = 0xade682d1|0
	    this._fl = 0x2b3e6c1f|0
	    this._gl = 0xfb41bd6b|0
	    this._hl = 0x137e2179|0

	    this._len = this._s = 0

	    return this
	  }

	  function S (X, Xl, n) {
	    return (X >>> n) | (Xl << (32 - n))
	  }

	  function Ch (x, y, z) {
	    return ((x & y) ^ ((~x) & z));
	  }

	  function Maj (x, y, z) {
	    return ((x & y) ^ (x & z) ^ (y & z));
	  }

	  Sha512.prototype._update = function(M) {

	    var W = this._w
	    var a, b, c, d, e, f, g, h
	    var al, bl, cl, dl, el, fl, gl, hl

	    a = this._a | 0
	    b = this._b | 0
	    c = this._c | 0
	    d = this._d | 0
	    e = this._e | 0
	    f = this._f | 0
	    g = this._g | 0
	    h = this._h | 0

	    al = this._al | 0
	    bl = this._bl | 0
	    cl = this._cl | 0
	    dl = this._dl | 0
	    el = this._el | 0
	    fl = this._fl | 0
	    gl = this._gl | 0
	    hl = this._hl | 0

	    for (var i = 0; i < 80; i++) {
	      var j = i * 2

	      var Wi, Wil

	      if (i < 16) {
	        Wi = W[j] = M.readInt32BE(j * 4)
	        Wil = W[j + 1] = M.readInt32BE(j * 4 + 4)

	      } else {
	        var x  = W[j - 15*2]
	        var xl = W[j - 15*2 + 1]
	        var gamma0  = S(x, xl, 1) ^ S(x, xl, 8) ^ (x >>> 7)
	        var gamma0l = S(xl, x, 1) ^ S(xl, x, 8) ^ S(xl, x, 7)

	        x  = W[j - 2*2]
	        xl = W[j - 2*2 + 1]
	        var gamma1  = S(x, xl, 19) ^ S(xl, x, 29) ^ (x >>> 6)
	        var gamma1l = S(xl, x, 19) ^ S(x, xl, 29) ^ S(xl, x, 6)

	        // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
	        var Wi7  = W[j - 7*2]
	        var Wi7l = W[j - 7*2 + 1]

	        var Wi16  = W[j - 16*2]
	        var Wi16l = W[j - 16*2 + 1]

	        Wil = gamma0l + Wi7l
	        Wi  = gamma0  + Wi7 + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0)
	        Wil = Wil + gamma1l
	        Wi  = Wi  + gamma1  + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0)
	        Wil = Wil + Wi16l
	        Wi  = Wi  + Wi16 + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0)

	        W[j] = Wi
	        W[j + 1] = Wil
	      }

	      var maj = Maj(a, b, c)
	      var majl = Maj(al, bl, cl)

	      var sigma0h = S(a, al, 28) ^ S(al, a, 2) ^ S(al, a, 7)
	      var sigma0l = S(al, a, 28) ^ S(a, al, 2) ^ S(a, al, 7)
	      var sigma1h = S(e, el, 14) ^ S(e, el, 18) ^ S(el, e, 9)
	      var sigma1l = S(el, e, 14) ^ S(el, e, 18) ^ S(e, el, 9)

	      // t1 = h + sigma1 + ch + K[i] + W[i]
	      var Ki = K[j]
	      var Kil = K[j + 1]

	      var ch = Ch(e, f, g)
	      var chl = Ch(el, fl, gl)

	      var t1l = hl + sigma1l
	      var t1 = h + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0)
	      t1l = t1l + chl
	      t1 = t1 + ch + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0)
	      t1l = t1l + Kil
	      t1 = t1 + Ki + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0)
	      t1l = t1l + Wil
	      t1 = t1 + Wi + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0)

	      // t2 = sigma0 + maj
	      var t2l = sigma0l + majl
	      var t2 = sigma0h + maj + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0)

	      h  = g
	      hl = gl
	      g  = f
	      gl = fl
	      f  = e
	      fl = el
	      el = (dl + t1l) | 0
	      e  = (d + t1 + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0
	      d  = c
	      dl = cl
	      c  = b
	      cl = bl
	      b  = a
	      bl = al
	      al = (t1l + t2l) | 0
	      a  = (t1 + t2 + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0
	    }

	    this._al = (this._al + al) | 0
	    this._bl = (this._bl + bl) | 0
	    this._cl = (this._cl + cl) | 0
	    this._dl = (this._dl + dl) | 0
	    this._el = (this._el + el) | 0
	    this._fl = (this._fl + fl) | 0
	    this._gl = (this._gl + gl) | 0
	    this._hl = (this._hl + hl) | 0

	    this._a = (this._a + a + ((this._al >>> 0) < (al >>> 0) ? 1 : 0)) | 0
	    this._b = (this._b + b + ((this._bl >>> 0) < (bl >>> 0) ? 1 : 0)) | 0
	    this._c = (this._c + c + ((this._cl >>> 0) < (cl >>> 0) ? 1 : 0)) | 0
	    this._d = (this._d + d + ((this._dl >>> 0) < (dl >>> 0) ? 1 : 0)) | 0
	    this._e = (this._e + e + ((this._el >>> 0) < (el >>> 0) ? 1 : 0)) | 0
	    this._f = (this._f + f + ((this._fl >>> 0) < (fl >>> 0) ? 1 : 0)) | 0
	    this._g = (this._g + g + ((this._gl >>> 0) < (gl >>> 0) ? 1 : 0)) | 0
	    this._h = (this._h + h + ((this._hl >>> 0) < (hl >>> 0) ? 1 : 0)) | 0
	  }

	  Sha512.prototype._hash = function () {
	    var H = new Buffer(64)

	    function writeInt64BE(h, l, offset) {
	      H.writeInt32BE(h, offset)
	      H.writeInt32BE(l, offset + 4)
	    }

	    writeInt64BE(this._a, this._al, 0)
	    writeInt64BE(this._b, this._bl, 8)
	    writeInt64BE(this._c, this._cl, 16)
	    writeInt64BE(this._d, this._dl, 24)
	    writeInt64BE(this._e, this._el, 32)
	    writeInt64BE(this._f, this._fl, 40)
	    writeInt64BE(this._g, this._gl, 48)
	    writeInt64BE(this._h, this._hl, 56)

	    return H
	  }

	  return Sha512

	}


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
	 * Digest Algorithm, as defined in RFC 1321.
	 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for more info.
	 */

	var helpers = __webpack_require__(94);

	/*
	 * Calculate the MD5 of an array of little-endian words, and a bit length
	 */
	function core_md5(x, len)
	{
	  /* append padding */
	  x[len >> 5] |= 0x80 << ((len) % 32);
	  x[(((len + 64) >>> 9) << 4) + 14] = len;

	  var a =  1732584193;
	  var b = -271733879;
	  var c = -1732584194;
	  var d =  271733878;

	  for(var i = 0; i < x.length; i += 16)
	  {
	    var olda = a;
	    var oldb = b;
	    var oldc = c;
	    var oldd = d;

	    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
	    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
	    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
	    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
	    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
	    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
	    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
	    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
	    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
	    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
	    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
	    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
	    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
	    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
	    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
	    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

	    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
	    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
	    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
	    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
	    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
	    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
	    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
	    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
	    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
	    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
	    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
	    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
	    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
	    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
	    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
	    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

	    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
	    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
	    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
	    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
	    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
	    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
	    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
	    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
	    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
	    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
	    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
	    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
	    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
	    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
	    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
	    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

	    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
	    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
	    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
	    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
	    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
	    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
	    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
	    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
	    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
	    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
	    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
	    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
	    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
	    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
	    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
	    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

	    a = safe_add(a, olda);
	    b = safe_add(b, oldb);
	    c = safe_add(c, oldc);
	    d = safe_add(d, oldd);
	  }
	  return Array(a, b, c, d);

	}

	/*
	 * These functions implement the four basic operations the algorithm uses.
	 */
	function md5_cmn(q, a, b, x, s, t)
	{
	  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
	}
	function md5_ff(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}
	function md5_gg(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}
	function md5_hh(a, b, c, d, x, s, t)
	{
	  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5_ii(a, b, c, d, x, s, t)
	{
	  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	/*
	 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	 * to work around bugs in some JS interpreters.
	 */
	function safe_add(x, y)
	{
	  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  return (msw << 16) | (lsw & 0xFFFF);
	}

	/*
	 * Bitwise rotate a 32-bit number to the left.
	 */
	function bit_rol(num, cnt)
	{
	  return (num << cnt) | (num >>> (32 - cnt));
	}

	module.exports = function md5(buf) {
	  return helpers.hash(buf, core_md5, 16);
	};


/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var intSize = 4;
	var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
	var chrsz = 8;

	function toArray(buf, bigEndian) {
	  if ((buf.length % intSize) !== 0) {
	    var len = buf.length + (intSize - (buf.length % intSize));
	    buf = Buffer.concat([buf, zeroBuffer], len);
	  }

	  var arr = [];
	  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
	  for (var i = 0; i < buf.length; i += intSize) {
	    arr.push(fn.call(buf, i));
	  }
	  return arr;
	}

	function toBuffer(arr, size, bigEndian) {
	  var buf = new Buffer(size);
	  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
	  for (var i = 0; i < arr.length; i++) {
	    fn.call(buf, arr[i], i * 4, true);
	  }
	  return buf;
	}

	function hash(buf, fn, hashSize, bigEndian) {
	  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
	  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
	  return toBuffer(arr, hashSize, bigEndian);
	}

	module.exports = { hash: hash };

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {
	module.exports = ripemd160



	/*
	CryptoJS v3.1.2
	code.google.com/p/crypto-js
	(c) 2009-2013 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	/** @preserve
	(c) 2012 by Cédric Mesnil. All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/

	// Constants table
	var zl = [
	    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
	    7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
	    3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
	    1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
	    4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13];
	var zr = [
	    5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
	    6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
	    15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
	    8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
	    12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11];
	var sl = [
	     11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
	    7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
	    11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
	      11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
	    9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ];
	var sr = [
	    8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
	    9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
	    9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
	    15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
	    8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ];

	var hl =  [ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E];
	var hr =  [ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000];

	var bytesToWords = function (bytes) {
	  var words = [];
	  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
	    words[b >>> 5] |= bytes[i] << (24 - b % 32);
	  }
	  return words;
	};

	var wordsToBytes = function (words) {
	  var bytes = [];
	  for (var b = 0; b < words.length * 32; b += 8) {
	    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
	  }
	  return bytes;
	};

	var processBlock = function (H, M, offset) {

	  // Swap endian
	  for (var i = 0; i < 16; i++) {
	    var offset_i = offset + i;
	    var M_offset_i = M[offset_i];

	    // Swap
	    M[offset_i] = (
	        (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	        (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	    );
	  }

	  // Working variables
	  var al, bl, cl, dl, el;
	  var ar, br, cr, dr, er;

	  ar = al = H[0];
	  br = bl = H[1];
	  cr = cl = H[2];
	  dr = dl = H[3];
	  er = el = H[4];
	  // Computation
	  var t;
	  for (var i = 0; i < 80; i += 1) {
	    t = (al +  M[offset+zl[i]])|0;
	    if (i<16){
	        t +=  f1(bl,cl,dl) + hl[0];
	    } else if (i<32) {
	        t +=  f2(bl,cl,dl) + hl[1];
	    } else if (i<48) {
	        t +=  f3(bl,cl,dl) + hl[2];
	    } else if (i<64) {
	        t +=  f4(bl,cl,dl) + hl[3];
	    } else {// if (i<80) {
	        t +=  f5(bl,cl,dl) + hl[4];
	    }
	    t = t|0;
	    t =  rotl(t,sl[i]);
	    t = (t+el)|0;
	    al = el;
	    el = dl;
	    dl = rotl(cl, 10);
	    cl = bl;
	    bl = t;

	    t = (ar + M[offset+zr[i]])|0;
	    if (i<16){
	        t +=  f5(br,cr,dr) + hr[0];
	    } else if (i<32) {
	        t +=  f4(br,cr,dr) + hr[1];
	    } else if (i<48) {
	        t +=  f3(br,cr,dr) + hr[2];
	    } else if (i<64) {
	        t +=  f2(br,cr,dr) + hr[3];
	    } else {// if (i<80) {
	        t +=  f1(br,cr,dr) + hr[4];
	    }
	    t = t|0;
	    t =  rotl(t,sr[i]) ;
	    t = (t+er)|0;
	    ar = er;
	    er = dr;
	    dr = rotl(cr, 10);
	    cr = br;
	    br = t;
	  }
	  // Intermediate hash value
	  t    = (H[1] + cl + dr)|0;
	  H[1] = (H[2] + dl + er)|0;
	  H[2] = (H[3] + el + ar)|0;
	  H[3] = (H[4] + al + br)|0;
	  H[4] = (H[0] + bl + cr)|0;
	  H[0] =  t;
	};

	function f1(x, y, z) {
	  return ((x) ^ (y) ^ (z));
	}

	function f2(x, y, z) {
	  return (((x)&(y)) | ((~x)&(z)));
	}

	function f3(x, y, z) {
	  return (((x) | (~(y))) ^ (z));
	}

	function f4(x, y, z) {
	  return (((x) & (z)) | ((y)&(~(z))));
	}

	function f5(x, y, z) {
	  return ((x) ^ ((y) |(~(z))));
	}

	function rotl(x,n) {
	  return (x<<n) | (x>>>(32-n));
	}

	function ripemd160(message) {
	  var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

	  if (typeof message == 'string')
	    message = new Buffer(message, 'utf8');

	  var m = bytesToWords(message);

	  var nBitsLeft = message.length * 8;
	  var nBitsTotal = message.length * 8;

	  // Add padding
	  m[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	  m[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	      (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
	      (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
	  );

	  for (var i=0 ; i<m.length; i += 16) {
	    processBlock(H, m, i);
	  }

	  // Swap endian
	  for (var i = 0; i < 5; i++) {
	      // Shortcut
	    var H_i = H[i];

	    // Swap
	    H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	          (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	  }

	  var digestbytes = wordsToBytes(H);
	  return new Buffer(digestbytes);
	}



	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var createHash = __webpack_require__(87)

	var zeroBuffer = new Buffer(128)
	zeroBuffer.fill(0)

	module.exports = Hmac

	function Hmac (alg, key) {
	  if(!(this instanceof Hmac)) return new Hmac(alg, key)
	  this._opad = opad
	  this._alg = alg

	  var blocksize = (alg === 'sha512') ? 128 : 64

	  key = this._key = !Buffer.isBuffer(key) ? new Buffer(key) : key

	  if(key.length > blocksize) {
	    key = createHash(alg).update(key).digest()
	  } else if(key.length < blocksize) {
	    key = Buffer.concat([key, zeroBuffer], blocksize)
	  }

	  var ipad = this._ipad = new Buffer(blocksize)
	  var opad = this._opad = new Buffer(blocksize)

	  for(var i = 0; i < blocksize; i++) {
	    ipad[i] = key[i] ^ 0x36
	    opad[i] = key[i] ^ 0x5C
	  }

	  this._hash = createHash(alg).update(ipad)
	}

	Hmac.prototype.update = function (data, enc) {
	  this._hash.update(data, enc)
	  return this
	}

	Hmac.prototype.digest = function (enc) {
	  var h = this._hash.digest()
	  return createHash(this._alg).update(this._opad).update(h).digest(enc)
	}


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var pbkdf2Export = __webpack_require__(98)

	module.exports = function (crypto, exports) {
	  exports = exports || {}

	  var exported = pbkdf2Export(crypto)

	  exports.pbkdf2 = exported.pbkdf2
	  exports.pbkdf2Sync = exported.pbkdf2Sync

	  return exports
	}


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {module.exports = function(crypto) {
	  function pbkdf2(password, salt, iterations, keylen, digest, callback) {
	    if ('function' === typeof digest) {
	      callback = digest
	      digest = undefined
	    }

	    if ('function' !== typeof callback)
	      throw new Error('No callback provided to pbkdf2')

	    setTimeout(function() {
	      var result

	      try {
	        result = pbkdf2Sync(password, salt, iterations, keylen, digest)
	      } catch (e) {
	        return callback(e)
	      }

	      callback(undefined, result)
	    })
	  }

	  function pbkdf2Sync(password, salt, iterations, keylen, digest) {
	    if ('number' !== typeof iterations)
	      throw new TypeError('Iterations not a number')

	    if (iterations < 0)
	      throw new TypeError('Bad iterations')

	    if ('number' !== typeof keylen)
	      throw new TypeError('Key length not a number')

	    if (keylen < 0)
	      throw new TypeError('Bad key length')

	    digest = digest || 'sha1'

	    if (!Buffer.isBuffer(password)) password = new Buffer(password)
	    if (!Buffer.isBuffer(salt)) salt = new Buffer(salt)

	    var hLen, l = 1, r, T
	    var DK = new Buffer(keylen)
	    var block1 = new Buffer(salt.length + 4)
	    salt.copy(block1, 0, 0, salt.length)

	    for (var i = 1; i <= l; i++) {
	      block1.writeUInt32BE(i, salt.length)

	      var U = crypto.createHmac(digest, password).update(block1).digest()

	      if (!hLen) {
	        hLen = U.length
	        T = new Buffer(hLen)
	        l = Math.ceil(keylen / hLen)
	        r = keylen - (l - 1) * hLen

	        if (keylen > (Math.pow(2, 32) - 1) * hLen)
	          throw new TypeError('keylen exceeds maximum length')
	      }

	      U.copy(T, 0, 0, hLen)

	      for (var j = 1; j < iterations; j++) {
	        U = crypto.createHmac(digest, password).update(U).digest()

	        for (var k = 0; k < hLen; k++) {
	          T[k] ^= U[k]
	        }
	      }

	      var destPos = (i - 1) * hLen
	      var len = (i == l ? r : hLen)
	      T.copy(DK, destPos, 0, len)
	    }

	    return DK
	  }

	  return {
	    pbkdf2: pbkdf2,
	    pbkdf2Sync: pbkdf2Sync
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function (crypto, exports) {
	  exports = exports || {};
	  var ciphers = __webpack_require__(100)(crypto);
	  exports.createCipher = ciphers.createCipher;
	  exports.createCipheriv = ciphers.createCipheriv;
	  var deciphers = __webpack_require__(112)(crypto);
	  exports.createDecipher = deciphers.createDecipher;
	  exports.createDecipheriv = deciphers.createDecipheriv;
	  var modes = __webpack_require__(103);
	  function listCiphers () {
	    return Object.keys(modes);
	  }
	  exports.listCiphers = listCiphers;
	};



/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var aes = __webpack_require__(101);
	var Transform = __webpack_require__(102);
	var inherits = __webpack_require__(17);
	var modes = __webpack_require__(103);
	var ebtk = __webpack_require__(104);
	var StreamCipher = __webpack_require__(105);
	inherits(Cipher, Transform);
	function Cipher(mode, key, iv) {
	  if (!(this instanceof Cipher)) {
	    return new Cipher(mode, key, iv);
	  }
	  Transform.call(this);
	  this._cache = new Splitter();
	  this._cipher = new aes.AES(key);
	  this._prev = new Buffer(iv.length);
	  iv.copy(this._prev);
	  this._mode = mode;
	}
	Cipher.prototype._transform = function (data, _, next) {
	  this._cache.add(data);
	  var chunk;
	  var thing;
	  while ((chunk = this._cache.get())) {
	    thing = this._mode.encrypt(this, chunk);
	    this.push(thing);
	  }
	  next();
	};
	Cipher.prototype._flush = function (next) {
	  var chunk = this._cache.flush();
	  this.push(this._mode.encrypt(this, chunk));
	  this._cipher.scrub();
	  next();
	};


	function Splitter() {
	   if (!(this instanceof Splitter)) {
	    return new Splitter();
	  }
	  this.cache = new Buffer('');
	}
	Splitter.prototype.add = function (data) {
	  this.cache = Buffer.concat([this.cache, data]);
	};

	Splitter.prototype.get = function () {
	  if (this.cache.length > 15) {
	    var out = this.cache.slice(0, 16);
	    this.cache = this.cache.slice(16);
	    return out;
	  }
	  return null;
	};
	Splitter.prototype.flush = function () {
	  var len = 16 - this.cache.length;
	  var padBuff = new Buffer(len);

	  var i = -1;
	  while (++i < len) {
	    padBuff.writeUInt8(len, i);
	  }
	  var out = Buffer.concat([this.cache, padBuff]);
	  return out;
	};
	var modelist = {
	  ECB: __webpack_require__(106),
	  CBC: __webpack_require__(107),
	  CFB: __webpack_require__(109),
	  OFB: __webpack_require__(110),
	  CTR: __webpack_require__(111)
	};
	module.exports = function (crypto) {
	  function createCipheriv(suite, password, iv) {
	    var config = modes[suite];
	    if (!config) {
	      throw new TypeError('invalid suite type');
	    }
	    if (typeof iv === 'string') {
	      iv = new Buffer(iv);
	    }
	    if (typeof password === 'string') {
	      password = new Buffer(password);
	    }
	    if (password.length !== config.key/8) {
	      throw new TypeError('invalid key length ' + password.length);
	    }
	    if (iv.length !== config.iv) {
	      throw new TypeError('invalid iv length ' + iv.length);
	    }
	    if (config.type === 'stream') {
	      return new StreamCipher(modelist[config.mode], password, iv);
	    }
	    return new Cipher(modelist[config.mode], password, iv);
	  }
	  function createCipher (suite, password) {
	    var config = modes[suite];
	    if (!config) {
	      throw new TypeError('invalid suite type');
	    }
	    var keys = ebtk(crypto, password, config.key, config.iv);
	    return createCipheriv(suite, keys.key, keys.iv);
	  }
	  return {
	    createCipher: createCipher,
	    createCipheriv: createCipheriv
	  };
	};

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var uint_max = Math.pow(2, 32);
	function fixup_uint32(x) {
	    var ret, x_pos;
	    ret = x > uint_max || x < 0 ? (x_pos = Math.abs(x) % uint_max, x < 0 ? uint_max - x_pos : x_pos) : x;
	    return ret;
	}
	function scrub_vec(v) {
	  var i, _i, _ref;
	  for (i = _i = 0, _ref = v.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
	    v[i] = 0;
	  }
	  return false;
	}

	function Global() {
	  var i;
	  this.SBOX = [];
	  this.INV_SBOX = [];
	  this.SUB_MIX = (function() {
	    var _i, _results;
	    _results = [];
	    for (i = _i = 0; _i < 4; i = ++_i) {
	      _results.push([]);
	    }
	    return _results;
	  })();
	  this.INV_SUB_MIX = (function() {
	    var _i, _results;
	    _results = [];
	    for (i = _i = 0; _i < 4; i = ++_i) {
	      _results.push([]);
	    }
	    return _results;
	  })();
	  this.init();
	  this.RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
	}

	Global.prototype.init = function() {
	  var d, i, sx, t, x, x2, x4, x8, xi, _i;
	  d = (function() {
	    var _i, _results;
	    _results = [];
	    for (i = _i = 0; _i < 256; i = ++_i) {
	      if (i < 128) {
	        _results.push(i << 1);
	      } else {
	        _results.push((i << 1) ^ 0x11b);
	      }
	    }
	    return _results;
	  })();
	  x = 0;
	  xi = 0;
	  for (i = _i = 0; _i < 256; i = ++_i) {
	    sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
	    sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
	    this.SBOX[x] = sx;
	    this.INV_SBOX[sx] = x;
	    x2 = d[x];
	    x4 = d[x2];
	    x8 = d[x4];
	    t = (d[sx] * 0x101) ^ (sx * 0x1010100);
	    this.SUB_MIX[0][x] = (t << 24) | (t >>> 8);
	    this.SUB_MIX[1][x] = (t << 16) | (t >>> 16);
	    this.SUB_MIX[2][x] = (t << 8) | (t >>> 24);
	    this.SUB_MIX[3][x] = t;
	    t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
	    this.INV_SUB_MIX[0][sx] = (t << 24) | (t >>> 8);
	    this.INV_SUB_MIX[1][sx] = (t << 16) | (t >>> 16);
	    this.INV_SUB_MIX[2][sx] = (t << 8) | (t >>> 24);
	    this.INV_SUB_MIX[3][sx] = t;
	    if (x === 0) {
	      x = xi = 1;
	    } else {
	      x = x2 ^ d[d[d[x8 ^ x2]]];
	      xi ^= d[d[xi]];
	    }
	  }
	  return true;
	};

	var G = new Global();


	AES.blockSize = 4 * 4;

	AES.prototype.blockSize = AES.blockSize;

	AES.keySize = 256 / 8;

	AES.prototype.keySize = AES.keySize;

	AES.ivSize = AES.blockSize;

	AES.prototype.ivSize = AES.ivSize;

	 function bufferToArray(buf) {
	  var len = buf.length/4;
	  var out = new Array(len);
	  var i = -1;
	  while (++i < len) {
	    out[i] = buf.readUInt32BE(i * 4);
	  }
	  return out;
	 }
	function AES(key) {
	  this._key = bufferToArray(key);
	  this._doReset();
	}

	AES.prototype._doReset = function() {
	  var invKsRow, keySize, keyWords, ksRow, ksRows, t, _i, _j;
	  keyWords = this._key;
	  keySize = keyWords.length;
	  this._nRounds = keySize + 6;
	  ksRows = (this._nRounds + 1) * 4;
	  this._keySchedule = [];
	  for (ksRow = _i = 0; 0 <= ksRows ? _i < ksRows : _i > ksRows; ksRow = 0 <= ksRows ? ++_i : --_i) {
	    this._keySchedule[ksRow] = ksRow < keySize ? keyWords[ksRow] : (t = this._keySchedule[ksRow - 1], (ksRow % keySize) === 0 ? (t = (t << 8) | (t >>> 24), t = (G.SBOX[t >>> 24] << 24) | (G.SBOX[(t >>> 16) & 0xff] << 16) | (G.SBOX[(t >>> 8) & 0xff] << 8) | G.SBOX[t & 0xff], t ^= G.RCON[(ksRow / keySize) | 0] << 24) : keySize > 6 && ksRow % keySize === 4 ? t = (G.SBOX[t >>> 24] << 24) | (G.SBOX[(t >>> 16) & 0xff] << 16) | (G.SBOX[(t >>> 8) & 0xff] << 8) | G.SBOX[t & 0xff] : void 0, this._keySchedule[ksRow - keySize] ^ t);
	  }
	  this._invKeySchedule = [];
	  for (invKsRow = _j = 0; 0 <= ksRows ? _j < ksRows : _j > ksRows; invKsRow = 0 <= ksRows ? ++_j : --_j) {
	    ksRow = ksRows - invKsRow;
	    t = this._keySchedule[ksRow - (invKsRow % 4 ? 0 : 4)];
	    this._invKeySchedule[invKsRow] = invKsRow < 4 || ksRow <= 4 ? t : G.INV_SUB_MIX[0][G.SBOX[t >>> 24]] ^ G.INV_SUB_MIX[1][G.SBOX[(t >>> 16) & 0xff]] ^ G.INV_SUB_MIX[2][G.SBOX[(t >>> 8) & 0xff]] ^ G.INV_SUB_MIX[3][G.SBOX[t & 0xff]];
	  }
	  return true;
	};

	AES.prototype.encryptBlock = function(M) {
	  M = bufferToArray(new Buffer(M));
	  var out = this._doCryptBlock(M, this._keySchedule, G.SUB_MIX, G.SBOX);
	  var buf = new Buffer(16);
	  buf.writeUInt32BE(out[0], 0);
	  buf.writeUInt32BE(out[1], 4);
	  buf.writeUInt32BE(out[2], 8);
	  buf.writeUInt32BE(out[3], 12);
	  return buf;
	};

	AES.prototype.decryptBlock = function(M) {
	  M = bufferToArray(new Buffer(M));
	  var temp = [M[3], M[1]];
	  M[1] = temp[0];
	  M[3] = temp[1];
	  var out = this._doCryptBlock(M, this._invKeySchedule, G.INV_SUB_MIX, G.INV_SBOX);
	  var buf = new Buffer(16);
	  buf.writeUInt32BE(out[0], 0);
	  buf.writeUInt32BE(out[3], 4);
	  buf.writeUInt32BE(out[2], 8);
	  buf.writeUInt32BE(out[1], 12);
	  return buf;
	};

	AES.prototype.scrub = function() {
	  scrub_vec(this._keySchedule);
	  scrub_vec(this._invKeySchedule);
	  scrub_vec(this._key);
	};

	AES.prototype._doCryptBlock = function(M, keySchedule, SUB_MIX, SBOX) {
	  var ksRow, round, s0, s1, s2, s3, t0, t1, t2, t3, _i, _ref;

	  s0 = M[0] ^ keySchedule[0];
	  s1 = M[1] ^ keySchedule[1];
	  s2 = M[2] ^ keySchedule[2];
	  s3 = M[3] ^ keySchedule[3];
	  ksRow = 4;
	  for (round = _i = 1, _ref = this._nRounds; 1 <= _ref ? _i < _ref : _i > _ref; round = 1 <= _ref ? ++_i : --_i) {
	    t0 = SUB_MIX[0][s0 >>> 24] ^ SUB_MIX[1][(s1 >>> 16) & 0xff] ^ SUB_MIX[2][(s2 >>> 8) & 0xff] ^ SUB_MIX[3][s3 & 0xff] ^ keySchedule[ksRow++];
	    t1 = SUB_MIX[0][s1 >>> 24] ^ SUB_MIX[1][(s2 >>> 16) & 0xff] ^ SUB_MIX[2][(s3 >>> 8) & 0xff] ^ SUB_MIX[3][s0 & 0xff] ^ keySchedule[ksRow++];
	    t2 = SUB_MIX[0][s2 >>> 24] ^ SUB_MIX[1][(s3 >>> 16) & 0xff] ^ SUB_MIX[2][(s0 >>> 8) & 0xff] ^ SUB_MIX[3][s1 & 0xff] ^ keySchedule[ksRow++];
	    t3 = SUB_MIX[0][s3 >>> 24] ^ SUB_MIX[1][(s0 >>> 16) & 0xff] ^ SUB_MIX[2][(s1 >>> 8) & 0xff] ^ SUB_MIX[3][s2 & 0xff] ^ keySchedule[ksRow++];
	    s0 = t0;
	    s1 = t1;
	    s2 = t2;
	    s3 = t3;
	  }
	  t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
	  t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
	  t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
	  t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];
	  return [
	    fixup_uint32(t0),
	    fixup_uint32(t1),
	    fixup_uint32(t2),
	    fixup_uint32(t3)
	  ];

	};




	  exports.AES = AES;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var Transform = __webpack_require__(30).Transform;
	var inherits = __webpack_require__(17);

	module.exports = CipherBase;
	inherits(CipherBase, Transform);
	function CipherBase() {
	  Transform.call(this);
	}
	CipherBase.prototype.update = function (data, inputEnd, outputEnc) {
	  this.write(data, inputEnd);
	  var outData = new Buffer('');
	  var chunk;
	  while ((chunk = this.read())) {
	    outData = Buffer.concat([outData, chunk]);
	  }
	  if (outputEnc) {
	    outData = outData.toString(outputEnc);
	  }
	  return outData;
	};
	CipherBase.prototype.final = function (outputEnc) {
	  this.end();
	  var outData = new Buffer('');
	  var chunk;
	  while ((chunk = this.read())) {
	    outData = Buffer.concat([outData, chunk]);
	  }
	  if (outputEnc) {
	    outData = outData.toString(outputEnc);
	  }
	  return outData;
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 103 */
/***/ function(module, exports) {

	exports['aes-128-ecb'] = {
	  cipher: 'AES',
	  key: 128,
	  iv: 0,
	  mode: 'ECB',
	  type: 'block'
	};
	exports['aes-192-ecb'] = {
	  cipher: 'AES',
	  key: 192,
	  iv: 0,
	  mode: 'ECB',
	  type: 'block'
	};
	exports['aes-256-ecb'] = {
	  cipher: 'AES',
	  key: 256,
	  iv: 0,
	  mode: 'ECB',
	  type: 'block'
	};
	exports['aes-128-cbc'] = {
	  cipher: 'AES',
	  key: 128,
	  iv: 16,
	  mode: 'CBC',
	  type: 'block'
	};
	exports['aes-192-cbc'] = {
	  cipher: 'AES',
	  key: 192,
	  iv: 16,
	  mode: 'CBC',
	  type: 'block'
	};
	exports['aes-256-cbc'] = {
	  cipher: 'AES',
	  key: 256,
	  iv: 16,
	  mode: 'CBC',
	  type: 'block'
	};
	exports['aes128'] = exports['aes-128-cbc'];
	exports['aes192'] = exports['aes-192-cbc'];
	exports['aes256'] = exports['aes-256-cbc'];
	exports['aes-128-cfb'] = {
	  cipher: 'AES',
	  key: 128,
	  iv: 16,
	  mode: 'CFB',
	  type: 'stream'
	};
	exports['aes-192-cfb'] = {
	  cipher: 'AES',
	  key: 192,
	  iv: 16,
	  mode: 'CFB',
	  type: 'stream'
	};
	exports['aes-256-cfb'] = {
	  cipher: 'AES',
	  key: 256,
	  iv: 16,
	  mode: 'CFB',
	  type: 'stream'
	};
	exports['aes-128-ofb'] = {
	  cipher: 'AES',
	  key: 128,
	  iv: 16,
	  mode: 'OFB',
	  type: 'stream'
	};
	exports['aes-192-ofb'] = {
	  cipher: 'AES',
	  key: 192,
	  iv: 16,
	  mode: 'OFB',
	  type: 'stream'
	};
	exports['aes-256-ofb'] = {
	  cipher: 'AES',
	  key: 256,
	  iv: 16,
	  mode: 'OFB',
	  type: 'stream'
	};
	exports['aes-128-ctr'] = {
	  cipher: 'AES',
	  key: 128,
	  iv: 16,
	  mode: 'CTR',
	  type: 'stream'
	};
	exports['aes-192-ctr'] = {
	  cipher: 'AES',
	  key: 192,
	  iv: 16,
	  mode: 'CTR',
	  type: 'stream'
	};
	exports['aes-256-ctr'] = {
	  cipher: 'AES',
	  key: 256,
	  iv: 16,
	  mode: 'CTR',
	  type: 'stream'
	};

/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {
	module.exports = function (crypto, password, keyLen, ivLen) {
	  keyLen = keyLen/8;
	  ivLen = ivLen || 0;
	  var ki = 0;
	  var ii = 0;
	  var key = new Buffer(keyLen);
	  var iv = new Buffer(ivLen);
	  var addmd = 0;
	  var md, md_buf;
	  var i;
	  while (true) {
	    md = crypto.createHash('md5');
	    if(addmd++ > 0) {
	       md.update(md_buf);
	    }
	    md.update(password);
	    md_buf = md.digest();
	    i = 0;
	    if(keyLen > 0) {
	      while(true) {
	        if(keyLen === 0) {
	          break;
	        }
	        if(i === md_buf.length) {
	          break;
	        }
	        key[ki++] = md_buf[i];
	        keyLen--;
	        i++;
	       }
	    }
	    if(ivLen > 0 && i !== md_buf.length) {
	      while(true) {
	        if(ivLen === 0) {
	          break;
	        }
	        if(i === md_buf.length) {
	          break;
	        }
	       iv[ii++] = md_buf[i];
	       ivLen--;
	       i++;
	     }
	   }
	   if(keyLen === 0 && ivLen === 0) {
	      break;
	    }
	  }
	  for(i=0;i<md_buf.length;i++) {
	    md_buf[i] = 0;
	  }
	  return {
	    key: key,
	    iv: iv
	  };
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var aes = __webpack_require__(101);
	var Transform = __webpack_require__(102);
	var inherits = __webpack_require__(17);

	inherits(StreamCipher, Transform);
	module.exports = StreamCipher;
	function StreamCipher(mode, key, iv, decrypt) {
	  if (!(this instanceof StreamCipher)) {
	    return new StreamCipher(mode, key, iv);
	  }
	  Transform.call(this);
	  this._cipher = new aes.AES(key);
	  this._prev = new Buffer(iv.length);
	  this._cache = new Buffer('');
	  this._secCache = new Buffer('');
	  this._decrypt = decrypt;
	  iv.copy(this._prev);
	  this._mode = mode;
	}
	StreamCipher.prototype._transform = function (chunk, _, next) {
	  next(null, this._mode.encrypt(this, chunk, this._decrypt));
	};
	StreamCipher.prototype._flush = function (next) {
	  this._cipher.scrub();
	  next();
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 106 */
/***/ function(module, exports) {

	exports.encrypt = function (self, block) {
	  return self._cipher.encryptBlock(block);
	};
	exports.decrypt = function (self, block) {
	  return self._cipher.decryptBlock(block);
	};

/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	var xor = __webpack_require__(108);
	exports.encrypt = function (self, block) {
	  var data = xor(block, self._prev);
	  self._prev = self._cipher.encryptBlock(data);
	  return self._prev;
	};
	exports.decrypt = function (self, block) {
	  var pad = self._prev;
	  self._prev = block;
	  var out = self._cipher.decryptBlock(block);
	  return xor(out, pad);
	};

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {module.exports = xor;
	function xor(a, b) {
	  var len = Math.min(a.length, b.length);
	  var out = new Buffer(len);
	  var i = -1;
	  while (++i < len) {
	    out.writeUInt8(a[i] ^ b[i], i);
	  }
	  return out;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var xor = __webpack_require__(108);
	exports.encrypt = function (self, data, decrypt) {
	  var out = new Buffer('');
	  var len;
	  while (data.length) {
	    if (self._cache.length === 0) {
	      self._cache = self._cipher.encryptBlock(self._prev);
	      self._prev = new Buffer('');
	    }
	    if (self._cache.length <= data.length) {
	      len = self._cache.length;
	      out = Buffer.concat([out, encryptStart(self, data.slice(0, len), decrypt)]);
	      data = data.slice(len);
	    } else {
	      out = Buffer.concat([out, encryptStart(self, data, decrypt)]);
	      break;
	    }
	  }
	  return out;
	};
	function encryptStart(self, data, decrypt) {
	  var len = data.length;
	  var out = xor(data, self._cache);
	  self._cache = self._cache.slice(len);
	  self._prev = Buffer.concat([self._prev, decrypt?data:out]);
	  return out;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var xor = __webpack_require__(108);
	function getBlock(self) {
	  self._prev = self._cipher.encryptBlock(self._prev);
	  return self._prev;
	}
	exports.encrypt = function (self, chunk) {
	  while (self._cache.length < chunk.length) {
	    self._cache = Buffer.concat([self._cache, getBlock(self)]);
	  }
	  var pad = self._cache.slice(0, chunk.length);
	  self._cache = self._cache.slice(chunk.length);
	  return xor(chunk, pad);
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var xor = __webpack_require__(108);
	function getBlock(self) {
	  var out = self._cipher.encryptBlock(self._prev);
	  incr32(self._prev);
	  return out;
	}
	exports.encrypt = function (self, chunk) {
	  while (self._cache.length < chunk.length) {
	    self._cache = Buffer.concat([self._cache, getBlock(self)]);
	  }
	  var pad = self._cache.slice(0, chunk.length);
	  self._cache = self._cache.slice(chunk.length);
	  return xor(chunk, pad);
	};
	function incr32(iv) {
	  var len = iv.length;
	  var item;
	  while (len--) {
	    item = iv.readUInt8(len);
	    if (item === 255) {
	      iv.writeUInt8(0, len);
	    } else {
	      item++;
	      iv.writeUInt8(item, len);
	      break;
	    }
	  }
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var aes = __webpack_require__(101);
	var Transform = __webpack_require__(102);
	var inherits = __webpack_require__(17);
	var modes = __webpack_require__(103);
	var StreamCipher = __webpack_require__(105);
	var ebtk = __webpack_require__(104);

	inherits(Decipher, Transform);
	function Decipher(mode, key, iv) {
	  if (!(this instanceof Decipher)) {
	    return new Decipher(mode, key, iv);
	  }
	  Transform.call(this);
	  this._cache = new Splitter();
	  this._last = void 0;
	  this._cipher = new aes.AES(key);
	  this._prev = new Buffer(iv.length);
	  iv.copy(this._prev);
	  this._mode = mode;
	}
	Decipher.prototype._transform = function (data, _, next) {
	  this._cache.add(data);
	  var chunk;
	  var thing;
	  while ((chunk = this._cache.get())) {
	    thing = this._mode.decrypt(this, chunk);
	    this.push(thing);
	  }
	  next();
	};
	Decipher.prototype._flush = function (next) {
	  var chunk = this._cache.flush();
	  if (!chunk) {
	    return next;
	  }

	  this.push(unpad(this._mode.decrypt(this, chunk)));

	  next();
	};

	function Splitter() {
	   if (!(this instanceof Splitter)) {
	    return new Splitter();
	  }
	  this.cache = new Buffer('');
	}
	Splitter.prototype.add = function (data) {
	  this.cache = Buffer.concat([this.cache, data]);
	};

	Splitter.prototype.get = function () {
	  if (this.cache.length > 16) {
	    var out = this.cache.slice(0, 16);
	    this.cache = this.cache.slice(16);
	    return out;
	  }
	  return null;
	};
	Splitter.prototype.flush = function () {
	  if (this.cache.length) {
	    return this.cache;
	  }
	};
	function unpad(last) {
	  var padded = last[15];
	  if (padded === 16) {
	    return;
	  }
	  return last.slice(0, 16 - padded);
	}

	var modelist = {
	  ECB: __webpack_require__(106),
	  CBC: __webpack_require__(107),
	  CFB: __webpack_require__(109),
	  OFB: __webpack_require__(110),
	  CTR: __webpack_require__(111)
	};

	module.exports = function (crypto) {
	  function createDecipheriv(suite, password, iv) {
	    var config = modes[suite];
	    if (!config) {
	      throw new TypeError('invalid suite type');
	    }
	    if (typeof iv === 'string') {
	      iv = new Buffer(iv);
	    }
	    if (typeof password === 'string') {
	      password = new Buffer(password);
	    }
	    if (password.length !== config.key/8) {
	      throw new TypeError('invalid key length ' + password.length);
	    }
	    if (iv.length !== config.iv) {
	      throw new TypeError('invalid iv length ' + iv.length);
	    }
	    if (config.type === 'stream') {
	      return new StreamCipher(modelist[config.mode], password, iv, true);
	    }
	    return new Decipher(modelist[config.mode], password, iv);
	  }

	  function createDecipher (suite, password) {
	    var config = modes[suite];
	    if (!config) {
	      throw new TypeError('invalid suite type');
	    }
	    var keys = ebtk(crypto, password, config.key, config.iv);
	    return createDecipheriv(suite, keys.key, keys.iv);
	  }
	  return {
	    createDecipher: createDecipher,
	    createDecipheriv: createDecipheriv
	  };
	};

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var crypto = __webpack_require__(84)
	    ,uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
	    ;

	exports = module.exports = generateUuid;
	exports.async = generateUuidAsync;
	exports.sync = generateUuidSync;
	exports.valid = generateUuid;


	function isUUID(uuid) {
	  return uuidPattern.test(uuid);
	}


	function generateUuidSync() {
	  var rnd = crypto.randomBytes(16);
	  rnd[6] = (rnd[6] & 0x0f) | 0x40;
	  rnd[8] = (rnd[8] & 0x3f) | 0x80;
	  rnd = rnd.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
	  rnd.shift();
	  return rnd.join('-');
	}

	function generateUuidAsync(callback) {
	  crypto.randomBytes(16, function(err, rnd) {
	    rnd[6] = (rnd[6] & 0x0f) | 0x40;
	    rnd[8] = (rnd[8] & 0x3f) | 0x80;
	    rnd = rnd.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
	    rnd.shift();
	    callback(null, rnd.join('-'));
	  });
	}

	function generateUuid(callback) {
	  if (typeof callback !== 'function') return generateUuidSync();
	  return generateUuidAsync(callback);
	}


/***/ },
/* 114 */
/***/ function(module, exports) {

	"use strict";

	var zpad = function zpad(value, length) {
	    value = "" + value;
	    length -= value.length;
	    while (length-- > 0) {
	        value = '0' + value;
	    }return value;
	};

	var _exports = module.exports = { zpad: zpad };

/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2015 Ambisafe Inc.
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including the rights to use, copy, modify,
	 * merge, publish, distribute, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	/**
	 * @file account.js
	 * Account class used to store all the information related to an user account.
	 * @author Charlie Fontana <charlie@ambisafe.co>
	 * @date 07/13/2015
	 */

	'use strict';

	/**
	 * This section defines the required libraries
	 */

	var crypto = __webpack_require__(84),
	    bitcoin = __webpack_require__(6),
	    Ambisafe = __webpack_require__(1);

	/**
	 * Defines the Account constructor.
	 *
	 * @param {object} container.
	 * @param {string} password.
	 * @return none.
	 */
	Ambisafe.Account = function (container, password) {
	    var key, privateKey, property;

	    this.data = {};

	    for (property in container) {
	        if (container.hasOwnProperty(property)) {
	            this.set(property, container[property]);
	        }
	    }

	    if (this.get('salt') && this.get('data') && this.get('iv') && password) {
	        key = Ambisafe.deriveKey(password, this.get('salt'));
	        this.set('key', key);

	        privateKey = Ambisafe.decrypt(this.get('data'), this.get('iv'), this.get('key')).toString('hex');

	        this.set('private_key', privateKey);
	    }
	};

	/**
	 * Defines the instance data object used to store the Account data.
	 */
	Ambisafe.Account.prototype.data = {};

	/**
	 * Instance method that signs a transaction.
	 *
	 * @param {object} tx unsigned transaction: {hex:'...', fee:'...', sighashes:['...', '...']}.
	 * @return {object} signed transaction.
	 */
	Ambisafe.Account.prototype.signTransaction = function (tx) {

	    var privateKey = this.get('private_key');

	    if (privateKey) {
	        return Ambisafe.signTransaction(tx, privateKey);
	    }

	    console.log('ERR: The transaction was not signed. The "private_key" attribute is not defined');
	};

	/**
	 * Instance method that set a new password
	 *
	 * @param {string} password
	 * @return none.
	 */
	Ambisafe.Account.prototype.setNewPassword = function (password) {
	    var curKey, curData, newKey, newData, privateKey;

	    if (!this.get('salt') || !this.get('data') || !this.get('iv')) {
	        console.log('ERR: The following attributes are required: salt, data and iv.');
	        return;
	    }

	    curKey = this.get('key');
	    curData = this.get('data');

	    privateKey = Ambisafe.decrypt(curData, this.get('iv'), curKey);

	    newKey = Ambisafe.deriveKey(password, this.get('salt'));

	    this.set('iv', Ambisafe.generateRandomValue(16));
	    newData = Ambisafe.encrypt(privateKey, this.get('iv'), newKey);

	    this.set('data', newData);
	    this.set('key', newKey);
	    this.set('private_key', privateKey.toString('hex'));
	};

	/**
	 * Instance method that gets the value of an indicated attribute.
	 *
	 * @param {string} name attribute name.
	 * @return {object} return the value of the indicated attribute.
	 */
	Ambisafe.Account.prototype.get = function (name) {
	    return this.data[name];
	};

	/**
	 * Instance method that sets the value of an indicated attribute.
	 *
	 * @param {string} name attribute name.
	 * @param {object} value attribute value.
	 * @return none.
	 */
	Ambisafe.Account.prototype.set = function (name, value) {
	    this.data[name] = value;
	};

	/**
	 * Intance method that returns the Account's data in a JSON format
	 *
	 * @return {string} return the account data as string.
	 */
	Ambisafe.Account.prototype.stringify = function () {
	    return JSON.stringify(this.data);
	};

	/**
	 * Intance method that parse the Account's data
	 *
	 * @param {string} data return the account data as string
	 * @return none.
	 */
	Ambisafe.Account.prototype.parse = function (data) {
	    if (typeof data !== 'string') {
	        console.log('ERR: The account data to parse has to be string');
	        return;
	    }

	    this.data = JSON.parse(data);
	};

	/**
	 * Intance method that get the Account's container as a Javascript object
	 *
	 * @return {object}
	 */
	Ambisafe.Account.prototype.getContainer = function () {
	    var container = {};

	    container.public_key = this.get('public_key');
	    container.data = this.get('data');
	    container.salt = this.get('salt');
	    container.iv = this.get('iv');

	    return container;
	};

	/**
	 * Intance method that get the Account's container as string
	 *
	 * @return {string}
	 */
	Ambisafe.Account.prototype.getStringContainer = function () {
	    return JSON.stringify(this.getContainer());
	};

/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * Copyright (c) 2015 Ambisafe Inc.
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including the rights to use, copy, modify,
	 * merge, publish, distribute, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	/**
	 * @file qrscanner.js
	 * @author Charlie Fontana <charlie@ambisafe.co>
	 * @date 07/20/2015
	 */

	/**
	 * This section defines the required libraries
	 */
	var qrcode = __webpack_require__(117),
	    Ambisafe = __webpack_require__(1);

	/**
	 * Defines the QRScanner constructor.
	 */
	Ambisafe.QRScanner = function () {};

	Ambisafe.QRScanner.scanQR = function (divID, success, error) {
		var div, height, width, video, canvas, context, _check, play;

		if (typeof window === 'undefined') {
			error('window is not defined');
			return;
		}

		if (typeof navigator === 'undefined') {
			error('navigator is not defined');
			return;
		}

		div = document.getElementById(divID);

		if (!div) {
			error(divID + ' is not defined');
			return;
		}

		height = div.offsetHeight;
		height = height ? height : 250;

		width = div.offsetWidth;
		width = width ? width : 300;

		div.innerHTML += '<video id="readerqr-html5-video" width="' + width + 'px" height="' + height + 'px"></video>';
		div.innerHTML += '<canvas id="qr-scanner-qr-canvas" width="' + (width - 2) + 'px" height="' + (height - 2) + 'px" style="display:none;"></canvas>';

		video = document.getElementById('readerqr-html5-video');
		canvas = document.getElementById('qr-scanner-qr-canvas');
		context = canvas.getContext('2d');

		_check = function check() {
			if (localMediaStream) {
				context.drawImage(video, 0, 0, 307, 250);

				try {
					qrcode.decode();
				} catch (err) {
					error(err);
				}
			}

			if (!video.paused) {
				setTimeout(_check, 500);
			}
		};

		window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

		play = function play(value) {
			video.src = window.URL && window.URL.createObjectURL(value) || value;
			localMediaStream = value;
			video.play();

			if (!video.paused) {
				setTimeout(_check, 1E3);
			}
		};

		if (navigator.getUserMedia) {
			navigator.getUserMedia({ video: !0 }, play, function (err) {
				if (err.message) {
					div.innerHTML = err.message;
					error(err.message);
				} else {
					error(err);
				}
			});
		} else {
			div.innerHTML = 'Native web camera streaming (getUserMedia) not supported in this browser';
			error(div.innerHTML);
		}

		qrcode.callback = function (data) {
			video.pause();
			success(data);
		};
	};

/***/ },
/* 117 */
/***/ function(module, exports) {

	"use strict";

	/**
	 * Copyright (c) 2015 Ambisafe Inc.
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including the rights to use, copy, modify,
	 * merge, publish, distribute, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	/**
	 * @file qrcode.js
	 * Javascript code based on the following project: https://github.com/dwa012/html5-qrcode
	 * @author Charlie Fontana <charlie@ambisafe.co>
	 * @date 07/20/2015
	 */

	var GridSampler = {};

	GridSampler.checkAndNudgePoints = function (image, points) {
		var width = qrcode.width;
		var height = qrcode.height;
		var x, y;
		// Check and nudge points from start until we see some that are OK:
		var nudged = true;
		for (var offset = 0; offset < points.Length && nudged; offset += 2) {
			x = Math.floor(points[offset]);
			y = Math.floor(points[offset + 1]);
			if (x < -1 || x > width || y < -1 || y > height) {
				throw "Error.checkAndNudgePoints ";
			}
			nudged = false;
			if (x === -1) {
				points[offset] = 0.0;
				nudged = true;
			} else if (x === width) {
				points[offset] = width - 1;
				nudged = true;
			}
			if (y === -1) {
				points[offset + 1] = 0.0;
				nudged = true;
			} else if (y === height) {
				points[offset + 1] = height - 1;
				nudged = true;
			}
		}

		nudged = true;

		for (offset = points.Length - 2; offset >= 0 && nudged; offset -= 2) {
			x = Math.floor(points[offset]);
			y = Math.floor(points[offset + 1]);

			if (x < -1 || x > width || y < -1 || y > height) {
				throw "Error.checkAndNudgePoints ";
			}
			nudged = false;
			if (x === -1) {
				points[offset] = 0.0;
				nudged = true;
			} else if (x === width) {
				points[offset] = width - 1;
				nudged = true;
			}
			if (y === -1) {
				points[offset + 1] = 0.0;
				nudged = true;
			} else if (y === height) {
				points[offset + 1] = height - 1;
				nudged = true;
			}
		}
	};

	GridSampler.sampleGrid3 = function (image, dimension, transform) {
		var bits = new BitMatrix(dimension);
		var points = new Array(dimension << 1);
		var x;
		for (var y = 0; y < dimension; y++) {
			var max = points.length;
			var iValue = y + 0.5;
			for (x = 0; x < max; x += 2) {
				points[x] = (x >> 1) + 0.5;
				points[x + 1] = iValue;
			}
			transform.transformPoints1(points);
			// Quick check to see if points transformed to something inside the image;
			// sufficient to check the endpoints
			GridSampler.checkAndNudgePoints(image, points);
			try {
				for (x = 0; x < max; x += 2) {
					var xpoint = Math.floor(points[x]) * 4 + Math.floor(points[x + 1]) * qrcode.width * 4;
					var bit = image[Math.floor(points[x]) + qrcode.width * Math.floor(points[x + 1])];
					qrcode.imagedata.data[xpoint] = bit ? 255 : 0;
					qrcode.imagedata.data[xpoint + 1] = bit ? 255 : 0;
					qrcode.imagedata.data[xpoint + 2] = 0;
					qrcode.imagedata.data[xpoint + 3] = 255;
					//bits[x >> 1][ y]=bit;
					if (bit) bits.set_Renamed(x >> 1, y);
				}
			} catch (aioobe) {
				throw "Error.checkAndNudgePoints";
			}
		}
		return bits;
	};

	GridSampler.sampleGridx = function (image, dimension, p1ToX, p1ToY, p2ToX, p2ToY, p3ToX, p3ToY, p4ToX, p4ToY, p1FromX, p1FromY, p2FromX, p2FromY, p3FromX, p3FromY, p4FromX, p4FromY) {
		var transform = PerspectiveTransform.quadrilateralToQuadrilateral(p1ToX, p1ToY, p2ToX, p2ToY, p3ToX, p3ToY, p4ToX, p4ToY, p1FromX, p1FromY, p2FromX, p2FromY, p3FromX, p3FromY, p4FromX, p4FromY);

		return GridSampler.sampleGrid3(image, dimension, transform);
	};

	function ECB(count, dataCodewords) {
		this.count = count;
		this.dataCodewords = dataCodewords;

		this.__defineGetter__("Count", function () {
			return this.count;
		});
		this.__defineGetter__("DataCodewords", function () {
			return this.dataCodewords;
		});
	}

	function ECBlocks(ecCodewordsPerBlock, ecBlocks1, ecBlocks2) {
		this.ecCodewordsPerBlock = ecCodewordsPerBlock;
		if (ecBlocks2) this.ecBlocks = new Array(ecBlocks1, ecBlocks2);else this.ecBlocks = new Array(ecBlocks1);

		this.__defineGetter__("ECCodewordsPerBlock", function () {
			return this.ecCodewordsPerBlock;
		});

		this.__defineGetter__("TotalECCodewords", function () {
			return this.ecCodewordsPerBlock * this.NumBlocks;
		});

		this.__defineGetter__("NumBlocks", function () {
			var total = 0;
			for (var i = 0; i < this.ecBlocks.length; i++) {
				total += this.ecBlocks[i].length;
			}
			return total;
		});

		this.getECBlocks = function () {
			return this.ecBlocks;
		};
	}

	function Version(versionNumber, alignmentPatternCenters, ecBlocks1, ecBlocks2, ecBlocks3, ecBlocks4) {
		this.versionNumber = versionNumber;
		this.alignmentPatternCenters = alignmentPatternCenters;
		this.ecBlocks = new Array(ecBlocks1, ecBlocks2, ecBlocks3, ecBlocks4);

		var total = 0;
		var ecCodewords = ecBlocks1.ECCodewordsPerBlock;
		var ecbArray = ecBlocks1.getECBlocks();
		for (var i = 0; i < ecbArray.length; i++) {
			var ecBlock = ecbArray[i];
			total += ecBlock.Count * (ecBlock.DataCodewords + ecCodewords);
		}

		this.totalCodewords = total;

		this.__defineGetter__("VersionNumber", function () {
			return this.versionNumber;
		});

		this.__defineGetter__("AlignmentPatternCenters", function () {
			return this.alignmentPatternCenters;
		});
		this.__defineGetter__("TotalCodewords", function () {
			return this.totalCodewords;
		});
		this.__defineGetter__("DimensionForVersion", function () {
			return 17 + 4 * this.versionNumber;
		});

		this.buildFunctionPattern = function () {
			var dimension = this.DimensionForVersion;
			var bitMatrix = new BitMatrix(dimension);

			// Top left finder pattern + separator + format
			bitMatrix.setRegion(0, 0, 9, 9);
			// Top right finder pattern + separator + format
			bitMatrix.setRegion(dimension - 8, 0, 8, 9);
			// Bottom left finder pattern + separator + format
			bitMatrix.setRegion(0, dimension - 8, 9, 8);

			// Alignment patterns
			var max = this.alignmentPatternCenters.length;
			for (var x = 0; x < max; x++) {
				var i = this.alignmentPatternCenters[x] - 2;
				for (var y = 0; y < max; y++) {
					if (x === 0 && (y === 0 || y === max - 1) || x === max - 1 && y === 0) {
						// No alignment patterns near the three finder paterns
						continue;
					}
					bitMatrix.setRegion(this.alignmentPatternCenters[y] - 2, i, 5, 5);
				}
			}

			// Vertical timing pattern
			bitMatrix.setRegion(6, 9, 1, dimension - 17);
			// Horizontal timing pattern
			bitMatrix.setRegion(9, 6, dimension - 17, 1);

			if (this.versionNumber > 6) {
				// Version info, top right
				bitMatrix.setRegion(dimension - 11, 0, 3, 6);
				// Version info, bottom left
				bitMatrix.setRegion(0, dimension - 11, 6, 3);
			}

			return bitMatrix;
		};

		this.getECBlocksForLevel = function (ecLevel) {
			return this.ecBlocks[ecLevel.ordinal()];
		};
	}

	Version.VERSION_DECODE_INFO = new Array(0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6, 0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78, 0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683, 0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB, 0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250, 0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B, 0x2542E, 0x26A64, 0x27541, 0x28C69);

	Version.VERSIONS = buildVersions();

	Version.getVersionForNumber = function (versionNumber) {
		if (versionNumber < 1 || versionNumber > 40) {
			throw "ArgumentException";
		}
		return Version.VERSIONS[versionNumber - 1];
	};

	Version.getProvisionalVersionForDimension = function (dimension) {
		if (dimension % 4 !== 1) {
			throw "Error getProvisionalVersionForDimension";
		}
		try {
			return Version.getVersionForNumber(dimension - 17 >> 2);
		} catch (iae) {
			throw "Error getVersionForNumber";
		}
	};

	Version.decodeVersionInformation = function (versionBits) {
		var bestDifference = 0xffffffff;
		var bestVersion = 0;
		for (var i = 0; i < Version.VERSION_DECODE_INFO.length; i++) {
			var targetVersion = Version.VERSION_DECODE_INFO[i];
			// Do the version info bits match exactly? done.
			if (targetVersion === versionBits) {
				return this.getVersionForNumber(i + 7);
			}
			// Otherwise see if this is the closest to a real version info bit string
			// we have seen so far
			var bitsDifference = FormatInformation.numBitsDiffering(versionBits, targetVersion);
			if (bitsDifference < bestDifference) {
				bestVersion = i + 7;
				bestDifference = bitsDifference;
			}
		}
		// We can tolerate up to 3 bits of error since no two version info codewords will
		// differ in less than 4 bits.
		if (bestDifference <= 3) {
			return this.getVersionForNumber(bestVersion);
		}
		// If we didn't find a close enough match, fail
		return null;
	};

	function buildVersions() {
		return [new Version(1, [], new ECBlocks(7, new ECB(1, 19)), new ECBlocks(10, new ECB(1, 16)), new ECBlocks(13, new ECB(1, 13)), new ECBlocks(17, new ECB(1, 9))), new Version(2, [6, 18], new ECBlocks(10, new ECB(1, 34)), new ECBlocks(16, new ECB(1, 28)), new ECBlocks(22, new ECB(1, 22)), new ECBlocks(28, new ECB(1, 16))), new Version(3, [6, 22], new ECBlocks(15, new ECB(1, 55)), new ECBlocks(26, new ECB(1, 44)), new ECBlocks(18, new ECB(2, 17)), new ECBlocks(22, new ECB(2, 13))), new Version(4, [6, 26], new ECBlocks(20, new ECB(1, 80)), new ECBlocks(18, new ECB(2, 32)), new ECBlocks(26, new ECB(2, 24)), new ECBlocks(16, new ECB(4, 9))), new Version(5, [6, 30], new ECBlocks(26, new ECB(1, 108)), new ECBlocks(24, new ECB(2, 43)), new ECBlocks(18, new ECB(2, 15), new ECB(2, 16)), new ECBlocks(22, new ECB(2, 11), new ECB(2, 12))), new Version(6, [6, 34], new ECBlocks(18, new ECB(2, 68)), new ECBlocks(16, new ECB(4, 27)), new ECBlocks(24, new ECB(4, 19)), new ECBlocks(28, new ECB(4, 15))), new Version(7, [6, 22, 38], new ECBlocks(20, new ECB(2, 78)), new ECBlocks(18, new ECB(4, 31)), new ECBlocks(18, new ECB(2, 14), new ECB(4, 15)), new ECBlocks(26, new ECB(4, 13), new ECB(1, 14))), new Version(8, [6, 24, 42], new ECBlocks(24, new ECB(2, 97)), new ECBlocks(22, new ECB(2, 38), new ECB(2, 39)), new ECBlocks(22, new ECB(4, 18), new ECB(2, 19)), new ECBlocks(26, new ECB(4, 14), new ECB(2, 15))), new Version(9, [6, 26, 46], new ECBlocks(30, new ECB(2, 116)), new ECBlocks(22, new ECB(3, 36), new ECB(2, 37)), new ECBlocks(20, new ECB(4, 16), new ECB(4, 17)), new ECBlocks(24, new ECB(4, 12), new ECB(4, 13))), new Version(10, [6, 28, 50], new ECBlocks(18, new ECB(2, 68), new ECB(2, 69)), new ECBlocks(26, new ECB(4, 43), new ECB(1, 44)), new ECBlocks(24, new ECB(6, 19), new ECB(2, 20)), new ECBlocks(28, new ECB(6, 15), new ECB(2, 16))), new Version(11, [6, 30, 54], new ECBlocks(20, new ECB(4, 81)), new ECBlocks(30, new ECB(1, 50), new ECB(4, 51)), new ECBlocks(28, new ECB(4, 22), new ECB(4, 23)), new ECBlocks(24, new ECB(3, 12), new ECB(8, 13))), new Version(12, [6, 32, 58], new ECBlocks(24, new ECB(2, 92), new ECB(2, 93)), new ECBlocks(22, new ECB(6, 36), new ECB(2, 37)), new ECBlocks(26, new ECB(4, 20), new ECB(6, 21)), new ECBlocks(28, new ECB(7, 14), new ECB(4, 15))), new Version(13, [6, 34, 62], new ECBlocks(26, new ECB(4, 107)), new ECBlocks(22, new ECB(8, 37), new ECB(1, 38)), new ECBlocks(24, new ECB(8, 20), new ECB(4, 21)), new ECBlocks(22, new ECB(12, 11), new ECB(4, 12))), new Version(14, [6, 26, 46, 66], new ECBlocks(30, new ECB(3, 115), new ECB(1, 116)), new ECBlocks(24, new ECB(4, 40), new ECB(5, 41)), new ECBlocks(20, new ECB(11, 16), new ECB(5, 17)), new ECBlocks(24, new ECB(11, 12), new ECB(5, 13))), new Version(15, [6, 26, 48, 70], new ECBlocks(22, new ECB(5, 87), new ECB(1, 88)), new ECBlocks(24, new ECB(5, 41), new ECB(5, 42)), new ECBlocks(30, new ECB(5, 24), new ECB(7, 25)), new ECBlocks(24, new ECB(11, 12), new ECB(7, 13))), new Version(16, [6, 26, 50, 74], new ECBlocks(24, new ECB(5, 98), new ECB(1, 99)), new ECBlocks(28, new ECB(7, 45), new ECB(3, 46)), new ECBlocks(24, new ECB(15, 19), new ECB(2, 20)), new ECBlocks(30, new ECB(3, 15), new ECB(13, 16))), new Version(17, [6, 30, 54, 78], new ECBlocks(28, new ECB(1, 107), new ECB(5, 108)), new ECBlocks(28, new ECB(10, 46), new ECB(1, 47)), new ECBlocks(28, new ECB(1, 22), new ECB(15, 23)), new ECBlocks(28, new ECB(2, 14), new ECB(17, 15))), new Version(18, [6, 30, 56, 82], new ECBlocks(30, new ECB(5, 120), new ECB(1, 121)), new ECBlocks(26, new ECB(9, 43), new ECB(4, 44)), new ECBlocks(28, new ECB(17, 22), new ECB(1, 23)), new ECBlocks(28, new ECB(2, 14), new ECB(19, 15))), new Version(19, [6, 30, 58, 86], new ECBlocks(28, new ECB(3, 113), new ECB(4, 114)), new ECBlocks(26, new ECB(3, 44), new ECB(11, 45)), new ECBlocks(26, new ECB(17, 21), new ECB(4, 22)), new ECBlocks(26, new ECB(9, 13), new ECB(16, 14))), new Version(20, [6, 34, 62, 90], new ECBlocks(28, new ECB(3, 107), new ECB(5, 108)), new ECBlocks(26, new ECB(3, 41), new ECB(13, 42)), new ECBlocks(30, new ECB(15, 24), new ECB(5, 25)), new ECBlocks(28, new ECB(15, 15), new ECB(10, 16))), new Version(21, [6, 28, 50, 72, 94], new ECBlocks(28, new ECB(4, 116), new ECB(4, 117)), new ECBlocks(26, new ECB(17, 42)), new ECBlocks(28, new ECB(17, 22), new ECB(6, 23)), new ECBlocks(30, new ECB(19, 16), new ECB(6, 17))), new Version(22, [6, 26, 50, 74, 98], new ECBlocks(28, new ECB(2, 111), new ECB(7, 112)), new ECBlocks(28, new ECB(17, 46)), new ECBlocks(30, new ECB(7, 24), new ECB(16, 25)), new ECBlocks(24, new ECB(34, 13))), new Version(23, [6, 30, 54, 74, 102], new ECBlocks(30, new ECB(4, 121), new ECB(5, 122)), new ECBlocks(28, new ECB(4, 47), new ECB(14, 48)), new ECBlocks(30, new ECB(11, 24), new ECB(14, 25)), new ECBlocks(30, new ECB(16, 15), new ECB(14, 16))), new Version(24, [6, 28, 54, 80, 106], new ECBlocks(30, new ECB(6, 117), new ECB(4, 118)), new ECBlocks(28, new ECB(6, 45), new ECB(14, 46)), new ECBlocks(30, new ECB(11, 24), new ECB(16, 25)), new ECBlocks(30, new ECB(30, 16), new ECB(2, 17))), new Version(25, [6, 32, 58, 84, 110], new ECBlocks(26, new ECB(8, 106), new ECB(4, 107)), new ECBlocks(28, new ECB(8, 47), new ECB(13, 48)), new ECBlocks(30, new ECB(7, 24), new ECB(22, 25)), new ECBlocks(30, new ECB(22, 15), new ECB(13, 16))), new Version(26, [6, 30, 58, 86, 114], new ECBlocks(28, new ECB(10, 114), new ECB(2, 115)), new ECBlocks(28, new ECB(19, 46), new ECB(4, 47)), new ECBlocks(28, new ECB(28, 22), new ECB(6, 23)), new ECBlocks(30, new ECB(33, 16), new ECB(4, 17))), new Version(27, [6, 34, 62, 90, 118], new ECBlocks(30, new ECB(8, 122), new ECB(4, 123)), new ECBlocks(28, new ECB(22, 45), new ECB(3, 46)), new ECBlocks(30, new ECB(8, 23), new ECB(26, 24)), new ECBlocks(30, new ECB(12, 15), new ECB(28, 16))), new Version(28, [6, 26, 50, 74, 98, 122], new ECBlocks(30, new ECB(3, 117), new ECB(10, 118)), new ECBlocks(28, new ECB(3, 45), new ECB(23, 46)), new ECBlocks(30, new ECB(4, 24), new ECB(31, 25)), new ECBlocks(30, new ECB(11, 15), new ECB(31, 16))), new Version(29, [6, 30, 54, 78, 102, 126], new ECBlocks(30, new ECB(7, 116), new ECB(7, 117)), new ECBlocks(28, new ECB(21, 45), new ECB(7, 46)), new ECBlocks(30, new ECB(1, 23), new ECB(37, 24)), new ECBlocks(30, new ECB(19, 15), new ECB(26, 16))), new Version(30, [6, 26, 52, 78, 104, 130], new ECBlocks(30, new ECB(5, 115), new ECB(10, 116)), new ECBlocks(28, new ECB(19, 47), new ECB(10, 48)), new ECBlocks(30, new ECB(15, 24), new ECB(25, 25)), new ECBlocks(30, new ECB(23, 15), new ECB(25, 16))), new Version(31, [6, 30, 56, 82, 108, 134], new ECBlocks(30, new ECB(13, 115), new ECB(3, 116)), new ECBlocks(28, new ECB(2, 46), new ECB(29, 47)), new ECBlocks(30, new ECB(42, 24), new ECB(1, 25)), new ECBlocks(30, new ECB(23, 15), new ECB(28, 16))), new Version(32, [6, 34, 60, 86, 112, 138], new ECBlocks(30, new ECB(17, 115)), new ECBlocks(28, new ECB(10, 46), new ECB(23, 47)), new ECBlocks(30, new ECB(10, 24), new ECB(35, 25)), new ECBlocks(30, new ECB(19, 15), new ECB(35, 16))), new Version(33, [6, 30, 58, 86, 114, 142], new ECBlocks(30, new ECB(17, 115), new ECB(1, 116)), new ECBlocks(28, new ECB(14, 46), new ECB(21, 47)), new ECBlocks(30, new ECB(29, 24), new ECB(19, 25)), new ECBlocks(30, new ECB(11, 15), new ECB(46, 16))), new Version(34, [6, 34, 62, 90, 118, 146], new ECBlocks(30, new ECB(13, 115), new ECB(6, 116)), new ECBlocks(28, new ECB(14, 46), new ECB(23, 47)), new ECBlocks(30, new ECB(44, 24), new ECB(7, 25)), new ECBlocks(30, new ECB(59, 16), new ECB(1, 17))), new Version(35, [6, 30, 54, 78, 102, 126, 150], new ECBlocks(30, new ECB(12, 121), new ECB(7, 122)), new ECBlocks(28, new ECB(12, 47), new ECB(26, 48)), new ECBlocks(30, new ECB(39, 24), new ECB(14, 25)), new ECBlocks(30, new ECB(22, 15), new ECB(41, 16))), new Version(36, [6, 24, 50, 76, 102, 128, 154], new ECBlocks(30, new ECB(6, 121), new ECB(14, 122)), new ECBlocks(28, new ECB(6, 47), new ECB(34, 48)), new ECBlocks(30, new ECB(46, 24), new ECB(10, 25)), new ECBlocks(30, new ECB(2, 15), new ECB(64, 16))), new Version(37, [6, 28, 54, 80, 106, 132, 158], new ECBlocks(30, new ECB(17, 122), new ECB(4, 123)), new ECBlocks(28, new ECB(29, 46), new ECB(14, 47)), new ECBlocks(30, new ECB(49, 24), new ECB(10, 25)), new ECBlocks(30, new ECB(24, 15), new ECB(46, 16))), new Version(38, [6, 32, 58, 84, 110, 136, 162], new ECBlocks(30, new ECB(4, 122), new ECB(18, 123)), new ECBlocks(28, new ECB(13, 46), new ECB(32, 47)), new ECBlocks(30, new ECB(48, 24), new ECB(14, 25)), new ECBlocks(30, new ECB(42, 15), new ECB(32, 16))), new Version(39, [6, 26, 54, 82, 110, 138, 166], new ECBlocks(30, new ECB(20, 117), new ECB(4, 118)), new ECBlocks(28, new ECB(40, 47), new ECB(7, 48)), new ECBlocks(30, new ECB(43, 24), new ECB(22, 25)), new ECBlocks(30, new ECB(10, 15), new ECB(67, 16))), new Version(40, [6, 30, 58, 86, 114, 142, 170], new ECBlocks(30, new ECB(19, 118), new ECB(6, 119)), new ECBlocks(28, new ECB(18, 47), new ECB(31, 48)), new ECBlocks(30, new ECB(34, 24), new ECB(34, 25)), new ECBlocks(30, new ECB(20, 15), new ECB(61, 16)))];
	}

	function PerspectiveTransform(a11, a21, a31, a12, a22, a32, a13, a23, a33) {
		this.a11 = a11;
		this.a12 = a12;
		this.a13 = a13;
		this.a21 = a21;
		this.a22 = a22;
		this.a23 = a23;
		this.a31 = a31;
		this.a32 = a32;
		this.a33 = a33;
		this.transformPoints1 = function (points) {
			var max = points.length;
			var a11 = this.a11;
			var a12 = this.a12;
			var a13 = this.a13;
			var a21 = this.a21;
			var a22 = this.a22;
			var a23 = this.a23;
			var a31 = this.a31;
			var a32 = this.a32;
			var a33 = this.a33;
			for (var i = 0; i < max; i += 2) {
				var x = points[i];
				var y = points[i + 1];
				var denominator = a13 * x + a23 * y + a33;
				points[i] = (a11 * x + a21 * y + a31) / denominator;
				points[i + 1] = (a12 * x + a22 * y + a32) / denominator;
			}
		};
		this.transformPoints2 = function (xValues, yValues) {
			var n = xValues.length;
			for (var i = 0; i < n; i++) {
				var x = xValues[i];
				var y = yValues[i];
				var denominator = this.a13 * x + this.a23 * y + this.a33;
				xValues[i] = (this.a11 * x + this.a21 * y + this.a31) / denominator;
				yValues[i] = (this.a12 * x + this.a22 * y + this.a32) / denominator;
			}
		};

		this.buildAdjoint = function () {
			// Adjoint is the transpose of the cofactor matrix:
			return new PerspectiveTransform(this.a22 * this.a33 - this.a23 * this.a32, this.a23 * this.a31 - this.a21 * this.a33, this.a21 * this.a32 - this.a22 * this.a31, this.a13 * this.a32 - this.a12 * this.a33, this.a11 * this.a33 - this.a13 * this.a31, this.a12 * this.a31 - this.a11 * this.a32, this.a12 * this.a23 - this.a13 * this.a22, this.a13 * this.a21 - this.a11 * this.a23, this.a11 * this.a22 - this.a12 * this.a21);
		};

		this.times = function (other) {
			return new PerspectiveTransform(this.a11 * other.a11 + this.a21 * other.a12 + this.a31 * other.a13, this.a11 * other.a21 + this.a21 * other.a22 + this.a31 * other.a23, this.a11 * other.a31 + this.a21 * other.a32 + this.a31 * other.a33, this.a12 * other.a11 + this.a22 * other.a12 + this.a32 * other.a13, this.a12 * other.a21 + this.a22 * other.a22 + this.a32 * other.a23, this.a12 * other.a31 + this.a22 * other.a32 + this.a32 * other.a33, this.a13 * other.a11 + this.a23 * other.a12 + this.a33 * other.a13, this.a13 * other.a21 + this.a23 * other.a22 + this.a33 * other.a23, this.a13 * other.a31 + this.a23 * other.a32 + this.a33 * other.a33);
		};
	}

	PerspectiveTransform.quadrilateralToQuadrilateral = function (x0, y0, x1, y1, x2, y2, x3, y3, x0p, y0p, x1p, y1p, x2p, y2p, x3p, y3p) {

		var qToS = this.quadrilateralToSquare(x0, y0, x1, y1, x2, y2, x3, y3);
		var sToQ = this.squareToQuadrilateral(x0p, y0p, x1p, y1p, x2p, y2p, x3p, y3p);
		return sToQ.times(qToS);
	};

	PerspectiveTransform.squareToQuadrilateral = function (x0, y0, x1, y1, x2, y2, x3, y3) {
		dy2 = y3 - y2;
		dy3 = y0 - y1 + y2 - y3;
		if (dy2 === 0.0 && dy3 === 0.0) {
			return new PerspectiveTransform(x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0.0, 0.0, 1.0);
		} else {
			dx1 = x1 - x2;
			dx2 = x3 - x2;
			dx3 = x0 - x1 + x2 - x3;
			dy1 = y1 - y2;
			denominator = dx1 * dy2 - dx2 * dy1;
			a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
			a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
			return new PerspectiveTransform(x1 - x0 + a13 * x1, x3 - x0 + a23 * x3, x0, y1 - y0 + a13 * y1, y3 - y0 + a23 * y3, y0, a13, a23, 1.0);
		}
	};

	PerspectiveTransform.quadrilateralToSquare = function (x0, y0, x1, y1, x2, y2, x3, y3) {
		return this.squareToQuadrilateral(x0, y0, x1, y1, x2, y2, x3, y3).buildAdjoint();
	};

	function DetectorResult(bits, points) {
		this.bits = bits;
		this.points = points;
	}

	function Detector(image) {
		this.image = image;
		this.resultPointCallback = null;

		this.sizeOfBlackWhiteBlackRun = function (fromX, fromY, toX, toY) {
			// Mild variant of Bresenham's algorithm;
			// see http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
			var steep = Math.abs(toY - fromY) > Math.abs(toX - fromX);
			if (steep) {
				var temp = fromX;
				fromX = fromY;
				fromY = temp;
				temp = toX;
				toX = toY;
				toY = temp;
			}

			var dx = Math.abs(toX - fromX);
			var dy = Math.abs(toY - fromY);
			var error = -dx >> 1;
			var ystep = fromY < toY ? 1 : -1;
			var xstep = fromX < toX ? 1 : -1;
			var state = 0; // In black pixels, looking for white, first or second time
			for (var x = fromX, y = fromY; x !== toX; x += xstep) {

				var realX = steep ? y : x;
				var realY = steep ? x : y;
				if (state === 1) {
					// In white pixels, looking for black
					if (this.image[realX + realY * qrcode.width]) {
						state++;
					}
				} else {
					if (!this.image[realX + realY * qrcode.width]) {
						state++;
					}
				}

				if (state === 3) {
					// Found black, white, black, and stumbled back onto white; done
					var diffX = x - fromX;
					var diffY = y - fromY;
					return Math.sqrt(diffX * diffX + diffY * diffY);
				}
				error += dy;
				if (error > 0) {
					if (y === toY) {
						break;
					}
					y += ystep;
					error -= dx;
				}
			}
			var diffX2 = toX - fromX;
			var diffY2 = toY - fromY;
			return Math.sqrt(diffX2 * diffX2 + diffY2 * diffY2);
		};

		this.sizeOfBlackWhiteBlackRunBothWays = function (fromX, fromY, toX, toY) {

			var result = this.sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY);
			var scale = 1.0;
			var otherToX = fromX - (toX - fromX);
			if (otherToX < 0) {
				scale = fromX / (fromX - otherToX);
				otherToX = 0;
			} else if (otherToX >= qrcode.width) {
				scale = (qrcode.width - 1 - fromX) / (otherToX - fromX);
				otherToX = qrcode.width - 1;
			}
			var otherToY = Math.floor(fromY - (toY - fromY) * scale);

			scale = 1.0;
			if (otherToY < 0) {
				scale = fromY / (fromY - otherToY);
				otherToY = 0;
			} else if (otherToY >= qrcode.height) {
				scale = (qrcode.height - 1 - fromY) / (otherToY - fromY);
				otherToY = qrcode.height - 1;
			}
			otherToX = Math.floor(fromX + (otherToX - fromX) * scale);

			result += this.sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY);
			return result - 1.0; // -1 because we counted the middle pixel twice
		};

		this.calculateModuleSizeOneWay = function (pattern, otherPattern) {
			var moduleSizeEst1 = this.sizeOfBlackWhiteBlackRunBothWays(Math.floor(pattern.X), Math.floor(pattern.Y), Math.floor(otherPattern.X), Math.floor(otherPattern.Y));
			var moduleSizeEst2 = this.sizeOfBlackWhiteBlackRunBothWays(Math.floor(otherPattern.X), Math.floor(otherPattern.Y), Math.floor(pattern.X), Math.floor(pattern.Y));
			if (isNaN(moduleSizeEst1)) {
				return moduleSizeEst2 / 7.0;
			}
			if (isNaN(moduleSizeEst2)) {
				return moduleSizeEst1 / 7.0;
			}
			// Average them, and divide by 7 since we've counted the width of 3 black modules,
			// and 1 white and 1 black module on either side. Ergo, divide sum by 14.
			return (moduleSizeEst1 + moduleSizeEst2) / 14.0;
		};

		this.calculateModuleSize = function (topLeft, topRight, bottomLeft) {
			// Take the average
			return (this.calculateModuleSizeOneWay(topLeft, topRight) + this.calculateModuleSizeOneWay(topLeft, bottomLeft)) / 2.0;
		};

		this.distance = function (pattern1, pattern2) {
			xDiff = pattern1.X - pattern2.X;
			yDiff = pattern1.Y - pattern2.Y;
			return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
		};

		this.computeDimension = function (topLeft, topRight, bottomLeft, moduleSize) {

			var tltrCentersDimension = Math.round(this.distance(topLeft, topRight) / moduleSize);
			var tlblCentersDimension = Math.round(this.distance(topLeft, bottomLeft) / moduleSize);
			var dimension = (tltrCentersDimension + tlblCentersDimension >> 1) + 7;
			switch (dimension & 0x03) {

				// mod 4
				case 0:
					dimension++;
					break;
				// 1? do nothing

				case 2:
					dimension--;
					break;

				case 3:
					throw "Error";
			}
			return dimension;
		};

		this.findAlignmentInRegion = function (overallEstModuleSize, estAlignmentX, estAlignmentY, allowanceFactor) {
			// Look for an alignment pattern (3 modules in size) around where it
			// should be
			var allowance = Math.floor(allowanceFactor * overallEstModuleSize);
			var alignmentAreaLeftX = Math.max(0, estAlignmentX - allowance);
			var alignmentAreaRightX = Math.min(qrcode.width - 1, estAlignmentX + allowance);
			if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3) {
				throw "Error";
			}

			var alignmentAreaTopY = Math.max(0, estAlignmentY - allowance);
			var alignmentAreaBottomY = Math.min(qrcode.height - 1, estAlignmentY + allowance);

			var alignmentFinder = new AlignmentPatternFinder(this.image, alignmentAreaLeftX, alignmentAreaTopY, alignmentAreaRightX - alignmentAreaLeftX, alignmentAreaBottomY - alignmentAreaTopY, overallEstModuleSize, this.resultPointCallback);
			return alignmentFinder.find();
		};

		this.createTransform = function (topLeft, topRight, bottomLeft, alignmentPattern, dimension) {
			var dimMinusThree = dimension - 3.5;
			var bottomRightX;
			var bottomRightY;
			var sourceBottomRightX;
			var sourceBottomRightY;
			if (alignmentPattern !== null) {
				bottomRightX = alignmentPattern.X;
				bottomRightY = alignmentPattern.Y;
				sourceBottomRightX = sourceBottomRightY = dimMinusThree - 3.0;
			} else {
				// Don't have an alignment pattern, just make up the bottom-right point
				bottomRightX = topRight.X - topLeft.X + bottomLeft.X;
				bottomRightY = topRight.Y - topLeft.Y + bottomLeft.Y;
				sourceBottomRightX = sourceBottomRightY = dimMinusThree;
			}

			var transform = PerspectiveTransform.quadrilateralToQuadrilateral(3.5, 3.5, dimMinusThree, 3.5, sourceBottomRightX, sourceBottomRightY, 3.5, dimMinusThree, topLeft.X, topLeft.Y, topRight.X, topRight.Y, bottomRightX, bottomRightY, bottomLeft.X, bottomLeft.Y);

			return transform;
		};

		this.sampleGrid = function (image, transform, dimension) {

			var sampler = GridSampler;
			return sampler.sampleGrid3(image, dimension, transform);
		};

		this.processFinderPatternInfo = function (info) {

			var topLeft = info.TopLeft;
			var topRight = info.TopRight;
			var bottomLeft = info.BottomLeft;

			var moduleSize = this.calculateModuleSize(topLeft, topRight, bottomLeft);
			if (moduleSize < 1.0) {
				throw "Error";
			}
			var dimension = this.computeDimension(topLeft, topRight, bottomLeft, moduleSize);
			var provisionalVersion = Version.getProvisionalVersionForDimension(dimension);
			var modulesBetweenFPCenters = provisionalVersion.DimensionForVersion - 7;

			var alignmentPattern = null;
			// Anything above version 1 has an alignment pattern
			if (provisionalVersion.AlignmentPatternCenters.length > 0) {

				// Guess where a "bottom right" finder pattern would have been
				var bottomRightX = topRight.X - topLeft.X + bottomLeft.X;
				var bottomRightY = topRight.Y - topLeft.Y + bottomLeft.Y;

				// Estimate that alignment pattern is closer by 3 modules
				// from "bottom right" to known top left location
				var correctionToTopLeft = 1.0 - 3.0 / modulesBetweenFPCenters;
				var estAlignmentX = Math.floor(topLeft.X + correctionToTopLeft * (bottomRightX - topLeft.X));
				var estAlignmentY = Math.floor(topLeft.Y + correctionToTopLeft * (bottomRightY - topLeft.Y));

				// Kind of arbitrary -- expand search radius before giving up
				for (var i = 4; i <= 16; i <<= 1) {
					//try
					//{
					alignmentPattern = this.findAlignmentInRegion(moduleSize, estAlignmentX, estAlignmentY, i);
					break;
					//}
					//catch (re)
					//{
					// try next round
					//}
				}
				// If we didn't find alignment pattern... well try anyway without it
			}

			var transform = this.createTransform(topLeft, topRight, bottomLeft, alignmentPattern, dimension);

			var bits = this.sampleGrid(this.image, transform, dimension);

			var points;
			if (alignmentPattern === null) {
				points = new Array(bottomLeft, topLeft, topRight);
			} else {
				points = new Array(bottomLeft, topLeft, topRight, alignmentPattern);
			}
			return new DetectorResult(bits, points);
		};

		this.detect = function () {
			var info = new FinderPatternFinder().findFinderPattern(this.image);
			return this.processFinderPatternInfo(info);
		};
	}

	var FORMAT_INFO_MASK_QR = 0x5412;
	var FORMAT_INFO_DECODE_LOOKUP = new Array(new Array(0x5412, 0x00), new Array(0x5125, 0x01), new Array(0x5E7C, 0x02), new Array(0x5B4B, 0x03), new Array(0x45F9, 0x04), new Array(0x40CE, 0x05), new Array(0x4F97, 0x06), new Array(0x4AA0, 0x07), new Array(0x77C4, 0x08), new Array(0x72F3, 0x09), new Array(0x7DAA, 0x0A), new Array(0x789D, 0x0B), new Array(0x662F, 0x0C), new Array(0x6318, 0x0D), new Array(0x6C41, 0x0E), new Array(0x6976, 0x0F), new Array(0x1689, 0x10), new Array(0x13BE, 0x11), new Array(0x1CE7, 0x12), new Array(0x19D0, 0x13), new Array(0x0762, 0x14), new Array(0x0255, 0x15), new Array(0x0D0C, 0x16), new Array(0x083B, 0x17), new Array(0x355F, 0x18), new Array(0x3068, 0x19), new Array(0x3F31, 0x1A), new Array(0x3A06, 0x1B), new Array(0x24B4, 0x1C), new Array(0x2183, 0x1D), new Array(0x2EDA, 0x1E), new Array(0x2BED, 0x1F));
	var BITS_SET_IN_HALF_BYTE = new Array(0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4);

	function FormatInformation(formatInfo) {
		this.errorCorrectionLevel = ErrorCorrectionLevel.forBits(formatInfo >> 3 & 0x03);
		this.dataMask = formatInfo & 0x07;

		this.__defineGetter__("ErrorCorrectionLevel", function () {
			return this.errorCorrectionLevel;
		});
		this.__defineGetter__("DataMask", function () {
			return this.dataMask;
		});
		this.GetHashCode = function () {
			return this.errorCorrectionLevel.ordinal() << 3 | dataMask;
		};
		this.Equals = function (o) {
			var other = o;
			return this.errorCorrectionLevel === other.errorCorrectionLevel && this.dataMask === other.dataMask;
		};
	}

	FormatInformation.numBitsDiffering = function (a, b) {
		a ^= b; // a now has a 1 bit exactly where its bit differs with b's
		// Count bits set quickly with a series of lookups:
		return BITS_SET_IN_HALF_BYTE[a & 0x0F] + BITS_SET_IN_HALF_BYTE[URShift(a, 4) & 0x0F] + BITS_SET_IN_HALF_BYTE[URShift(a, 8) & 0x0F] + BITS_SET_IN_HALF_BYTE[URShift(a, 12) & 0x0F] + BITS_SET_IN_HALF_BYTE[URShift(a, 16) & 0x0F] + BITS_SET_IN_HALF_BYTE[URShift(a, 20) & 0x0F] + BITS_SET_IN_HALF_BYTE[URShift(a, 24) & 0x0F] + BITS_SET_IN_HALF_BYTE[URShift(a, 28) & 0x0F];
	};

	FormatInformation.decodeFormatInformation = function (maskedFormatInfo) {
		var formatInfo = FormatInformation.doDecodeFormatInformation(maskedFormatInfo);
		if (formatInfo !== null) {
			return formatInfo;
		}
		// Should return null, but, some QR codes apparently
		// do not mask this info. Try again by actually masking the pattern
		// first
		return FormatInformation.doDecodeFormatInformation(maskedFormatInfo ^ FORMAT_INFO_MASK_QR);
	};

	FormatInformation.doDecodeFormatInformation = function (maskedFormatInfo) {
		// Find the int in FORMAT_INFO_DECODE_LOOKUP with fewest bits differing
		var bestDifference = 0xffffffff;
		var bestFormatInfo = 0;
		for (var i = 0; i < FORMAT_INFO_DECODE_LOOKUP.length; i++) {
			var decodeInfo = FORMAT_INFO_DECODE_LOOKUP[i];
			var targetInfo = decodeInfo[0];
			if (targetInfo === maskedFormatInfo) {
				// Found an exact match
				return new FormatInformation(decodeInfo[1]);
			}
			var bitsDifference = this.numBitsDiffering(maskedFormatInfo, targetInfo);
			if (bitsDifference < bestDifference) {
				bestFormatInfo = decodeInfo[1];
				bestDifference = bitsDifference;
			}
		}
		// Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits
		// differing means we found a match
		if (bestDifference <= 3) {
			return new FormatInformation(bestFormatInfo);
		}
		return null;
	};

	function ErrorCorrectionLevel(ordinal, bits, name) {
		this.ordinal_Renamed_Field = ordinal;
		this.bits = bits;
		this.name = name;
		this.__defineGetter__("Bits", function () {
			return this.bits;
		});
		this.__defineGetter__("Name", function () {
			return this.name;
		});
		this.ordinal = function () {
			return this.ordinal_Renamed_Field;
		};
	}

	ErrorCorrectionLevel.forBits = function (bits) {
		if (bits < 0 || bits >= FOR_BITS.Length) {
			throw "ArgumentException";
		}
		return FOR_BITS[bits];
	};

	var L = new ErrorCorrectionLevel(0, 0x01, "L");
	var M = new ErrorCorrectionLevel(1, 0x00, "M");
	var Q = new ErrorCorrectionLevel(2, 0x03, "Q");
	var H = new ErrorCorrectionLevel(3, 0x02, "H");
	var FOR_BITS = new Array(M, L, H, Q);

	function BitMatrix(width, height) {
		if (!height) height = width;
		if (width < 1 || height < 1) {
			throw "Both dimensions must be greater than 0";
		}
		this.width = width;
		this.height = height;
		var rowSize = width >> 5;
		if ((width & 0x1f) !== 0) {
			rowSize++;
		}
		this.rowSize = rowSize;
		this.bits = new Array(rowSize * height);
		for (var i = 0; i < this.bits.length; i++) {
			this.bits[i] = 0;
		}this.__defineGetter__("Width", function () {
			return this.width;
		});
		this.__defineGetter__("Height", function () {
			return this.height;
		});
		this.__defineGetter__("Dimension", function () {
			if (this.width !== this.height) {
				throw "Can't call getDimension() on a non-square matrix";
			}
			return this.width;
		});

		this.get_Renamed = function (x, y) {
			var offset = y * this.rowSize + (x >> 5);
			return (URShift(this.bits[offset], x & 0x1f) & 1) !== 0;
		};
		this.set_Renamed = function (x, y) {
			var offset = y * this.rowSize + (x >> 5);
			this.bits[offset] |= 1 << (x & 0x1f);
		};
		this.flip = function (x, y) {
			var offset = y * this.rowSize + (x >> 5);
			this.bits[offset] ^= 1 << (x & 0x1f);
		};
		this.clear = function () {
			var max = this.bits.length;
			for (var i = 0; i < max; i++) {
				this.bits[i] = 0;
			}
		};
		this.setRegion = function (left, top, width, height) {
			if (top < 0 || left < 0) {
				throw "Left and top must be nonnegative";
			}
			if (height < 1 || width < 1) {
				throw "Height and width must be at least 1";
			}
			var right = left + width;
			var bottom = top + height;
			if (bottom > this.height || right > this.width) {
				throw "The region must fit inside the matrix";
			}
			for (var y = top; y < bottom; y++) {
				var offset = y * this.rowSize;
				for (var x = left; x < right; x++) {
					this.bits[offset + (x >> 5)] |= 1 << (x & 0x1f);
				}
			}
		};
	}

	function DataBlock(numDataCodewords, codewords) {
		this.numDataCodewords = numDataCodewords;
		this.codewords = codewords;

		this.__defineGetter__("NumDataCodewords", function () {
			return this.numDataCodewords;
		});
		this.__defineGetter__("Codewords", function () {
			return this.codewords;
		});
	}

	DataBlock.getDataBlocks = function (rawCodewords, version, ecLevel) {
		var i, j;

		if (rawCodewords.length !== version.TotalCodewords) {
			throw "ArgumentException";
		}

		// Figure out the number and size of data blocks used by this version and
		// error correction level
		var ecBlocks = version.getECBlocksForLevel(ecLevel);

		// First count the total number of data blocks
		var totalBlocks = 0;
		var ecBlockArray = ecBlocks.getECBlocks();
		for (i = 0; i < ecBlockArray.length; i++) {
			totalBlocks += ecBlockArray[i].Count;
		}

		// Now establish DataBlocks of the appropriate size and number of data codewords
		var result = new Array(totalBlocks);
		var numResultBlocks = 0;
		for (j = 0; j < ecBlockArray.length; j++) {
			ecBlock = ecBlockArray[j];
			for (i = 0; i < ecBlock.Count; i++) {
				var numDataCodewords = ecBlock.DataCodewords;
				var numBlockCodewords = ecBlocks.ECCodewordsPerBlock + numDataCodewords;
				result[numResultBlocks++] = new DataBlock(numDataCodewords, new Array(numBlockCodewords));
			}
		}

		// All blocks have the same amount of data, except that the last n
		// (where n may be 0) have 1 more byte. Figure out where these start.
		var shorterBlocksTotalCodewords = result[0].codewords.length;
		var longerBlocksStartAt = result.length - 1;
		while (longerBlocksStartAt >= 0) {
			var numCodewords = result[longerBlocksStartAt].codewords.length;
			if (numCodewords === shorterBlocksTotalCodewords) {
				break;
			}
			longerBlocksStartAt--;
		}
		longerBlocksStartAt++;

		var shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords - ecBlocks.ECCodewordsPerBlock;
		// The last elements of result may be 1 element longer;
		// first fill out as many elements as all of them have
		var rawCodewordsOffset = 0;
		for (i = 0; i < shorterBlocksNumDataCodewords; i++) {
			for (j = 0; j < numResultBlocks; j++) {
				result[j].codewords[i] = rawCodewords[rawCodewordsOffset++];
			}
		}
		// Fill out the last data block in the longer ones
		for (j = longerBlocksStartAt; j < numResultBlocks; j++) {
			result[j].codewords[shorterBlocksNumDataCodewords] = rawCodewords[rawCodewordsOffset++];
		}
		// Now add in error correction blocks
		var max = result[0].codewords.length;
		for (i = shorterBlocksNumDataCodewords; i < max; i++) {
			for (j = 0; j < numResultBlocks; j++) {
				var iOffset = j < longerBlocksStartAt ? i : i + 1;
				result[j].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
			}
		}
		return result;
	};

	function BitMatrixParser(bitMatrix) {
		var dimension = bitMatrix.Dimension;
		if (dimension < 21 || (dimension & 0x03) !== 1) {
			throw "Error BitMatrixParser";
		}
		this.bitMatrix = bitMatrix;
		this.parsedVersion = null;
		this.parsedFormatInfo = null;

		this.copyBit = function (i, j, versionBits) {
			return this.bitMatrix.get_Renamed(i, j) ? versionBits << 1 | 0x1 : versionBits << 1;
		};

		this.readFormatInformation = function () {
			var i, j;
			if (this.parsedFormatInfo !== null) {
				return this.parsedFormatInfo;
			}

			// Read top-left format info bits
			var formatInfoBits = 0;
			for (i = 0; i < 6; i++) {
				formatInfoBits = this.copyBit(i, 8, formatInfoBits);
			}
			// .. and skip a bit in the timing pattern ...
			formatInfoBits = this.copyBit(7, 8, formatInfoBits);
			formatInfoBits = this.copyBit(8, 8, formatInfoBits);
			formatInfoBits = this.copyBit(8, 7, formatInfoBits);
			// .. and skip a bit in the timing pattern ...
			for (j = 5; j >= 0; j--) {
				formatInfoBits = this.copyBit(8, j, formatInfoBits);
			}

			this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits);
			if (this.parsedFormatInfo !== null) {
				return this.parsedFormatInfo;
			}

			// Hmm, failed. Try the top-right/bottom-left pattern
			var dimension = this.bitMatrix.Dimension;
			formatInfoBits = 0;
			var iMin = dimension - 8;
			for (i = dimension - 1; i >= iMin; i--) {
				formatInfoBits = this.copyBit(i, 8, formatInfoBits);
			}
			for (j = dimension - 7; j < dimension; j++) {
				formatInfoBits = this.copyBit(8, j, formatInfoBits);
			}

			this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits);
			if (this.parsedFormatInfo !== null) {
				return this.parsedFormatInfo;
			}
			throw "Error readFormatInformation";
		};

		this.readVersion = function () {
			var i, j;
			if (this.parsedVersion !== null) {
				return this.parsedVersion;
			}

			var dimension = this.bitMatrix.Dimension;

			var provisionalVersion = dimension - 17 >> 2;
			if (provisionalVersion <= 6) {
				return Version.getVersionForNumber(provisionalVersion);
			}

			// Read top-right version info: 3 wide by 6 tall
			var versionBits = 0;
			var ijMin = dimension - 11;
			for (j = 5; j >= 0; j--) {
				for (i = dimension - 9; i >= ijMin; i--) {
					versionBits = this.copyBit(i, j, versionBits);
				}
			}

			this.parsedVersion = Version.decodeVersionInformation(versionBits);
			if (this.parsedVersion !== null && this.parsedVersion.DimensionForVersion === dimension) {
				return this.parsedVersion;
			}

			// Hmm, failed. Try bottom left: 6 wide by 3 tall
			versionBits = 0;
			for (i = 5; i >= 0; i--) {
				for (j = dimension - 9; j >= ijMin; j--) {
					versionBits = this.copyBit(i, j, versionBits);
				}
			}

			this.parsedVersion = Version.decodeVersionInformation(versionBits);
			if (this.parsedVersion !== null && this.parsedVersion.DimensionForVersion === dimension) {
				return this.parsedVersion;
			}
			throw "Error readVersion";
		};

		this.readCodewords = function () {

			var formatInfo = this.readFormatInformation();
			var version = this.readVersion();

			// Get the data mask for the format used in this QR Code. This will exclude
			// some bits from reading as we wind through the bit matrix.
			var dataMask = DataMask.forReference(formatInfo.DataMask);
			var dimension = this.bitMatrix.Dimension;
			dataMask.unmaskBitMatrix(this.bitMatrix, dimension);

			var functionPattern = version.buildFunctionPattern();

			var readingUp = true;
			var result = new Array(version.TotalCodewords);
			var resultOffset = 0;
			var currentByte = 0;
			var bitsRead = 0;
			// Read columns in pairs, from right to left
			for (var j = dimension - 1; j > 0; j -= 2) {
				if (j === 6) {
					// Skip whole column with vertical alignment pattern;
					// saves time and makes the other code proceed more cleanly
					j--;
				}
				// Read alternatingly from bottom to top then top to bottom
				for (var count = 0; count < dimension; count++) {
					var i = readingUp ? dimension - 1 - count : count;
					for (var col = 0; col < 2; col++) {
						// Ignore bits covered by the function pattern
						if (!functionPattern.get_Renamed(j - col, i)) {
							// Read a bit
							bitsRead++;
							currentByte <<= 1;
							if (this.bitMatrix.get_Renamed(j - col, i)) {
								currentByte |= 1;
							}
							// If we've made a whole byte, save it off
							if (bitsRead === 8) {
								result[resultOffset++] = currentByte;
								bitsRead = 0;
								currentByte = 0;
							}
						}
					}
				}
				readingUp ^= true; // readingUp = !readingUp; // switch directions
			}
			if (resultOffset !== version.TotalCodewords) {
				throw "Error readCodewords";
			}
			return result;
		};
	}

	var DataMask = {};

	DataMask.forReference = function (reference) {
		if (reference < 0 || reference > 7) {
			throw "System.ArgumentException";
		}
		return DataMask.DATA_MASKS[reference];
	};

	function DataMask000() {
		this.unmaskBitMatrix = function (bits, dimension) {
			for (var i = 0; i < dimension; i++) {
				for (var j = 0; j < dimension; j++) {
					if (this.isMasked(i, j)) {
						bits.flip(j, i);
					}
				}
			}
		};
		this.isMasked = function (i, j) {
			return (i + j & 0x01) === 0;
		};
	}

	function DataMask001() {
		this.unmaskBitMatrix = function (bits, dimension) {
			for (var i = 0; i < dimension; i++) {
				for (var j = 0; j < dimension; j++) {
					if (this.isMasked(i, j)) {
						bits.flip(j, i);
					}
				}
			}
		};
		this.isMasked = function (i, j) {
			return (i & 0x01) === 0;
		};
	}

	function DataMask010() {
		this.unmaskBitMatrix = function (bits, dimension) {
			for (var i = 0; i < dimension; i++) {
				for (var j = 0; j < dimension; j++) {
					if (this.isMasked(i, j)) {
						bits.flip(j, i);
					}
				}
			}
		};
		this.isMasked = function (i, j) {
			return j % 3 === 0;
		};
	}

	function DataMask011() {
		this.unmaskBitMatrix = function (bits, dimension) {
			for (var i = 0; i < dimension; i++) {
				for (var j = 0; j < dimension; j++) {
					if (this.isMasked(i, j)) {
						bits.flip(j, i);
					}
				}
			}
		};
		this.isMasked = function (i, j) {
			return (i + j) % 3 === 0;
		};
	}

	function DataMask100() {
		this.unmaskBitMatrix = function (bits, dimension) {
			for (var i = 0; i < dimension; i++) {
				for (var j = 0; j < dimension; j++) {
					if (this.isMasked(i, j)) {
						bits.flip(j, i);
					}
				}
			}
		};
		this.isMasked = function (i, j) {
			return (URShift(i, 1) + j / 3 & 0x01) === 0;
		};
	}

	function DataMask101() {
		this.unmaskBitMatrix = function (bits, dimension) {
			for (var i = 0; i < dimension; i++) {
				for (var j = 0; j < dimension; j++) {
					if (this.isMasked(i, j)) {
						bits.flip(j, i);
					}
				}
			}
		};
		this.isMasked = function (i, j) {
			var temp = i * j;
			return (temp & 0x01) + temp % 3 === 0;
		};
	}

	function DataMask110() {
		this.unmaskBitMatrix = function (bits, dimension) {
			for (var i = 0; i < dimension; i++) {
				for (var j = 0; j < dimension; j++) {
					if (this.isMasked(i, j)) {
						bits.flip(j, i);
					}
				}
			}
		};
		this.isMasked = function (i, j) {
			var temp = i * j;
			return ((temp & 0x01) + temp % 3 & 0x01) === 0;
		};
	}

	function DataMask111() {
		this.unmaskBitMatrix = function (bits, dimension) {
			for (var i = 0; i < dimension; i++) {
				for (var j = 0; j < dimension; j++) {
					if (this.isMasked(i, j)) {
						bits.flip(j, i);
					}
				}
			}
		};
		this.isMasked = function (i, j) {
			return ((i + j & 0x01) + i * j % 3 & 0x01) === 0;
		};
	}

	DataMask.DATA_MASKS = new Array(new DataMask000(), new DataMask001(), new DataMask010(), new DataMask011(), new DataMask100(), new DataMask101(), new DataMask110(), new DataMask111());

	function ReedSolomonDecoder(field) {
		this.field = field;
		this.decode = function (received, twoS) {
			var i;
			var poly = new GF256Poly(this.field, received);
			var syndromeCoefficients = new Array(twoS);
			for (i = 0; i < syndromeCoefficients.length; i++) {
				syndromeCoefficients[i] = 0;
			}var dataMatrix = false; //this.field.Equals(GF256.DATA_MATRIX_FIELD);
			var noError = true;
			for (i = 0; i < twoS; i++) {
				// Thanks to sanfordsquires for this fix:
				var eval1 = poly.evaluateAt(this.field.exp(dataMatrix ? i + 1 : i));
				syndromeCoefficients[syndromeCoefficients.length - 1 - i] = eval1;
				if (eval1 !== 0) {
					noError = false;
				}
			}
			if (noError) {
				return;
			}
			var syndrome = new GF256Poly(this.field, syndromeCoefficients);
			var sigmaOmega = this.runEuclideanAlgorithm(this.field.buildMonomial(twoS, 1), syndrome, twoS);
			var sigma = sigmaOmega[0];
			var omega = sigmaOmega[1];
			var errorLocations = this.findErrorLocations(sigma);
			var errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations, dataMatrix);
			for (i = 0; i < errorLocations.length; i++) {
				var position = received.length - 1 - this.field.log(errorLocations[i]);
				if (position < 0) {
					throw "ReedSolomonException Bad error location";
				}
				received[position] = GF256.addOrSubtract(received[position], errorMagnitudes[i]);
			}
		};

		this.runEuclideanAlgorithm = function (a, b, R) {
			// Assume a's degree is >= b's
			if (a.Degree < b.Degree) {
				var temp = a;
				a = b;
				b = temp;
			}

			var rLast = a;
			var r = b;
			var sLast = this.field.One;
			var s = this.field.Zero;
			var tLast = this.field.Zero;
			var t = this.field.One;

			// Run Euclidean algorithm until r's degree is less than R/2
			while (r.Degree >= Math.floor(R / 2)) {
				var rLastLast = rLast;
				var sLastLast = sLast;
				var tLastLast = tLast;
				rLast = r;
				sLast = s;
				tLast = t;

				// Divide rLastLast by rLast, with quotient in q and remainder in r
				if (rLast.Zero) {
					// Oops, Euclidean algorithm already terminated?
					throw "r_{i-1} was zero";
				}
				r = rLastLast;
				var q = this.field.Zero;
				var denominatorLeadingTerm = rLast.getCoefficient(rLast.Degree);
				var dltInverse = this.field.inverse(denominatorLeadingTerm);
				while (r.Degree >= rLast.Degree && !r.Zero) {
					var degreeDiff = r.Degree - rLast.Degree;
					var scale = this.field.multiply(r.getCoefficient(r.Degree), dltInverse);
					q = q.addOrSubtract(this.field.buildMonomial(degreeDiff, scale));
					r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
					//r.EXE();
				}

				s = q.multiply1(sLast).addOrSubtract(sLastLast);
				t = q.multiply1(tLast).addOrSubtract(tLastLast);
			}

			var sigmaTildeAtZero = t.getCoefficient(0);
			if (sigmaTildeAtZero === 0) {
				throw "ReedSolomonException sigmaTilde(0) was zero";
			}

			var inverse = this.field.inverse(sigmaTildeAtZero);
			var sigma = t.multiply2(inverse);
			var omega = r.multiply2(inverse);
			return new Array(sigma, omega);
		};

		this.findErrorLocations = function (errorLocator) {
			// This is a direct application of Chien's search
			var numErrors = errorLocator.Degree;
			if (numErrors === 1) {
				// shortcut
				return new Array(errorLocator.getCoefficient(1));
			}
			var result = new Array(numErrors);
			var e = 0;
			for (var i = 1; i < 256 && e < numErrors; i++) {
				if (errorLocator.evaluateAt(i) === 0) {
					result[e] = this.field.inverse(i);
					e++;
				}
			}
			if (e !== numErrors) {
				throw "Error locator degree does not match number of roots";
			}
			return result;
		};

		this.findErrorMagnitudes = function (errorEvaluator, errorLocations, dataMatrix) {
			// This is directly applying Forney's Formula
			var s = errorLocations.length;
			var result = new Array(s);
			for (var i = 0; i < s; i++) {
				var xiInverse = this.field.inverse(errorLocations[i]);
				var denominator = 1;
				for (var j = 0; j < s; j++) {
					if (i !== j) {
						denominator = this.field.multiply(denominator, GF256.addOrSubtract(1, this.field.multiply(errorLocations[j], xiInverse)));
					}
				}
				result[i] = this.field.multiply(errorEvaluator.evaluateAt(xiInverse), this.field.inverse(denominator));
				// Thanks to sanfordsquires for this fix:
				if (dataMatrix) {
					result[i] = this.field.multiply(result[i], xiInverse);
				}
			}
			return result;
		};
	}

	function GF256Poly(field, coefficients) {
		if (coefficients === null || coefficients.length === 0) {
			throw "System.ArgumentException";
		}
		this.field = field;
		var coefficientsLength = coefficients.length;
		if (coefficientsLength > 1 && coefficients[0] === 0) {
			// Leading term must be non-zero for anything except the constant polynomial "0"
			var firstNonZero = 1;
			while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
				firstNonZero++;
			}
			if (firstNonZero === coefficientsLength) {
				this.coefficients = field.Zero.coefficients;
			} else {
				this.coefficients = new Array(coefficientsLength - firstNonZero);
				for (var i = 0; i < this.coefficients.length; i++) {
					this.coefficients[i] = 0;
				} //Array.Copy(coefficients, firstNonZero, this.coefficients, 0, this.coefficients.length);
				for (var ci = 0; ci < this.coefficients.length; ci++) {
					this.coefficients[ci] = coefficients[firstNonZero + ci];
				}
			}
		} else {
			this.coefficients = coefficients;
		}

		this.__defineGetter__("Zero", function () {
			return this.coefficients[0] === 0;
		});
		this.__defineGetter__("Degree", function () {
			return this.coefficients.length - 1;
		});
		this.__defineGetter__("Coefficients", function () {
			return this.coefficients;
		});

		this.getCoefficient = function (degree) {
			return this.coefficients[this.coefficients.length - 1 - degree];
		};

		this.evaluateAt = function (a) {
			var i;
			if (a === 0) {
				// Just return the x^0 coefficient
				return this.getCoefficient(0);
			}
			var size = this.coefficients.length;
			if (a === 1) {
				// Just the sum of the coefficients
				var result = 0;
				for (i = 0; i < size; i++) {
					result = GF256.addOrSubtract(result, this.coefficients[i]);
				}
				return result;
			}
			var result2 = this.coefficients[0];
			for (i = 1; i < size; i++) {
				result2 = GF256.addOrSubtract(this.field.multiply(a, result2), this.coefficients[i]);
			}
			return result2;
		};

		this.addOrSubtract = function (other) {
			if (this.field !== other.field) {
				throw "GF256Polys do not have same GF256 field";
			}
			if (this.Zero) {
				return other;
			}
			if (other.Zero) {
				return this;
			}

			var smallerCoefficients = this.coefficients;
			var largerCoefficients = other.coefficients;
			if (smallerCoefficients.length > largerCoefficients.length) {
				var temp = smallerCoefficients;
				smallerCoefficients = largerCoefficients;
				largerCoefficients = temp;
			}
			var sumDiff = new Array(largerCoefficients.length);
			var lengthDiff = largerCoefficients.length - smallerCoefficients.length;
			// Copy high-order terms only found in higher-degree polynomial's coefficients
			//Array.Copy(largerCoefficients, 0, sumDiff, 0, lengthDiff);
			for (var ci = 0; ci < lengthDiff; ci++) {
				sumDiff[ci] = largerCoefficients[ci];
			}for (var i = lengthDiff; i < largerCoefficients.length; i++) {
				sumDiff[i] = GF256.addOrSubtract(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
			}

			return new GF256Poly(field, sumDiff);
		};

		this.multiply1 = function (other) {
			if (this.field !== other.field) {
				throw "GF256Polys do not have same GF256 field";
			}
			if (this.Zero || other.Zero) {
				return this.field.Zero;
			}
			var aCoefficients = this.coefficients;
			var aLength = aCoefficients.length;
			var bCoefficients = other.coefficients;
			var bLength = bCoefficients.length;
			var product = new Array(aLength + bLength - 1);
			for (var i = 0; i < aLength; i++) {
				var aCoeff = aCoefficients[i];
				for (var j = 0; j < bLength; j++) {
					product[i + j] = GF256.addOrSubtract(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
				}
			}
			return new GF256Poly(this.field, product);
		};

		this.multiply2 = function (scalar) {
			if (scalar === 0) {
				return this.field.Zero;
			}
			if (scalar === 1) {
				return this;
			}
			var size = this.coefficients.length;
			var product = new Array(size);
			for (var i = 0; i < size; i++) {
				product[i] = this.field.multiply(this.coefficients[i], scalar);
			}
			return new GF256Poly(this.field, product);
		};

		this.multiplyByMonomial = function (degree, coefficient) {
			var i;
			if (degree < 0) {
				throw "System.ArgumentException";
			}
			if (coefficient === 0) {
				return this.field.Zero;
			}
			var size = this.coefficients.length;
			var product = new Array(size + degree);
			for (i = 0; i < product.length; i++) {
				product[i] = 0;
			}for (i = 0; i < size; i++) {
				product[i] = this.field.multiply(this.coefficients[i], coefficient);
			}
			return new GF256Poly(this.field, product);
		};

		this.divide = function (other) {
			if (this.field !== other.field) {
				throw "GF256Polys do not have same GF256 field";
			}
			if (other.Zero) {
				throw "Divide by 0";
			}

			var quotient = this.field.Zero;
			var remainder = this;

			var denominatorLeadingTerm = other.getCoefficient(other.Degree);
			var inverseDenominatorLeadingTerm = this.field.inverse(denominatorLeadingTerm);

			while (remainder.Degree >= other.Degree && !remainder.Zero) {
				var degreeDifference = remainder.Degree - other.Degree;
				var scale = this.field.multiply(remainder.getCoefficient(remainder.Degree), inverseDenominatorLeadingTerm);
				var term = other.multiplyByMonomial(degreeDifference, scale);
				var iterationQuotient = this.field.buildMonomial(degreeDifference, scale);
				quotient = quotient.addOrSubtract(iterationQuotient);
				remainder = remainder.addOrSubtract(term);
			}

			return new Array(quotient, remainder);
		};
	}

	function GF256(primitive) {
		this.expTable = new Array(256);
		this.logTable = new Array(256);
		var x = 1,
		    i;
		for (i = 0; i < 256; i++) {
			this.expTable[i] = x;
			x <<= 1; // x = x * 2; we're assuming the generator alpha is 2
			if (x >= 0x100) {
				x ^= primitive;
			}
		}
		for (i = 0; i < 255; i++) {
			this.logTable[this.expTable[i]] = i;
		}
		// logTable[0] === 0 but this should never be used
		var at0 = new Array(1);
		at0[0] = 0;
		this.zero = new GF256Poly(this, new Array(at0));
		var at1 = new Array(1);
		at1[0] = 1;
		this.one = new GF256Poly(this, new Array(at1));

		this.__defineGetter__("Zero", function () {
			return this.zero;
		});
		this.__defineGetter__("One", function () {
			return this.one;
		});
		this.buildMonomial = function (degree, coefficient) {
			if (degree < 0) {
				throw "System.ArgumentException";
			}
			if (coefficient === 0) {
				return zero;
			}
			var coefficients = new Array(degree + 1);
			for (var i = 0; i < coefficients.length; i++) {
				coefficients[i] = 0;
			}coefficients[0] = coefficient;
			return new GF256Poly(this, coefficients);
		};
		this.exp = function (a) {
			return this.expTable[a];
		};
		this.log = function (a) {
			if (a === 0) {
				throw "System.ArgumentException";
			}
			return this.logTable[a];
		};
		this.inverse = function (a) {
			if (a === 0) {
				throw "System.ArithmeticException";
			}
			return this.expTable[255 - this.logTable[a]];
		};
		this.multiply = function (a, b) {
			if (a === 0 || b === 0) {
				return 0;
			}
			if (a === 1) {
				return b;
			}
			if (b === 1) {
				return a;
			}
			return this.expTable[(this.logTable[a] + this.logTable[b]) % 255];
		};
	}

	GF256.QR_CODE_FIELD = new GF256(0x011D);
	GF256.DATA_MATRIX_FIELD = new GF256(0x012D);

	GF256.addOrSubtract = function (a, b) {
		return a ^ b;
	};

	var Decoder = {};
	Decoder.rsDecoder = new ReedSolomonDecoder(GF256.QR_CODE_FIELD);

	Decoder.correctErrors = function (codewordBytes, numDataCodewords) {
		var numCodewords = codewordBytes.length,
		    i;
		// First read into an array of ints, i
		var codewordsInts = new Array(numCodewords);
		for (i = 0; i < numCodewords; i++) {
			codewordsInts[i] = codewordBytes[i] & 0xFF;
		}
		var numECCodewords = codewordBytes.length - numDataCodewords;
		try {
			Decoder.rsDecoder.decode(codewordsInts, numECCodewords);
		} catch (rse) {
			throw rse;
		}
		for (i = 0; i < numDataCodewords; i++) {
			codewordBytes[i] = codewordsInts[i];
		}
	};

	Decoder.decode = function (bits) {
		var i, j;
		var parser = new BitMatrixParser(bits);
		var version = parser.readVersion();
		var ecLevel = parser.readFormatInformation().ErrorCorrectionLevel;

		var codewords = parser.readCodewords();
		var dataBlocks = DataBlock.getDataBlocks(codewords, version, ecLevel);
		var totalBytes = 0;

		for (i = 0; i < dataBlocks.Length; i++) {
			totalBytes += dataBlocks[i].NumDataCodewords;
		}
		var resultBytes = new Array(totalBytes);
		var resultOffset = 0;

		// Error-correct and copy data blocks together into a stream of bytes
		for (j = 0; j < dataBlocks.length; j++) {
			var dataBlock = dataBlocks[j];
			var codewordBytes = dataBlock.Codewords;
			var numDataCodewords = dataBlock.NumDataCodewords;
			Decoder.correctErrors(codewordBytes, numDataCodewords);
			for (i = 0; i < numDataCodewords; i++) {
				resultBytes[resultOffset++] = codewordBytes[i];
			}
		}

		var reader = new QRCodeDataBlockReader(resultBytes, version.VersionNumber, ecLevel.Bits);
		return reader;
	};

	var qrcode = {};
	qrcode.imagedata = null;
	qrcode.width = 0;
	qrcode.height = 0;
	qrcode.qrCodeSymbol = null;
	qrcode.debug = false;

	qrcode.sizeOfDataLengthInfo = [[10, 9, 8, 8], [12, 11, 16, 10], [14, 13, 16, 12]];

	qrcode.callback = null;

	qrcode.decode = function (src) {

		if (arguments.length === 0) {
			var canvas_qr = document.getElementById("qr-scanner-qr-canvas");
			var context = canvas_qr.getContext('2d');
			qrcode.width = canvas_qr.width;
			qrcode.height = canvas_qr.height;
			qrcode.imagedata = context.getImageData(0, 0, qrcode.width, qrcode.height);
			qrcode.result = qrcode.process(context);
			if (qrcode.callback !== null) qrcode.callback(qrcode.result);
			return qrcode.result;
		} else {
			var image = new Image();
			image.onload = function () {
				//var canvas_qr = document.getElementById("qr-canvas");
				var canvas_qr = document.createElement('canvas');
				var context = canvas_qr.getContext('2d');
				var canvas_out = document.getElementById("out-canvas");
				if (canvas_out !== null) {
					var outctx = canvas_out.getContext('2d');
					outctx.clearRect(0, 0, 320, 240);
					outctx.drawImage(image, 0, 0, 320, 240);
				}
				canvas_qr.width = image.width;
				canvas_qr.height = image.height;
				context.drawImage(image, 0, 0);
				qrcode.width = image.width;
				qrcode.height = image.height;
				try {
					qrcode.imagedata = context.getImageData(0, 0, image.width, image.height);
				} catch (e) {
					qrcode.result = "Cross domain image reading not supported in your browser! Save it to your computer then drag and drop the file!";
					if (qrcode.callback !== null) qrcode.callback(qrcode.result);
					return;
				}

				try {
					qrcode.result = qrcode.process(context);
				} catch (e) {
					qrcode.result = "error decoding QR Code";
				}
				if (qrcode.callback !== null) qrcode.callback(qrcode.result);
			};
			image.src = src;
		}
	};

	qrcode.decode_utf8 = function (s) {
		return decodeURIComponent(escape(s));
	};

	qrcode.process = function (ctx) {

		var start = new Date().getTime();

		var image = qrcode.grayScaleToBitmap(qrcode.grayscale());
		if (qrcode.debug) {
			for (var y = 0; y < qrcode.height; y++) {
				for (var x = 0; x < qrcode.width; x++) {
					var point = x * 4 + y * qrcode.width * 4;
					qrcode.imagedata.data[point] = image[x + y * qrcode.width] ? 0 : 0;
					qrcode.imagedata.data[point + 1] = image[x + y * qrcode.width] ? 0 : 0;
					qrcode.imagedata.data[point + 2] = image[x + y * qrcode.width] ? 255 : 0;
				}
			}
			ctx.putImageData(qrcode.imagedata, 0, 0);
		}

		var detector = new Detector(image);
		var qRCodeMatrix = detector.detect();

		if (qrcode.debug) ctx.putImageData(qrcode.imagedata, 0, 0);

		var reader = Decoder.decode(qRCodeMatrix.bits);
		var data = reader.DataByte;
		var str = "";
		for (var i = 0; i < data.length; i++) {
			for (var j = 0; j < data[i].length; j++) {
				str += String.fromCharCode(data[i][j]);
			}
		}

		var end = new Date().getTime();
		var time = end - start;

		return str;
		//alert("Time:" + time + " Code: "+str);
	};

	qrcode.getPixel = function (x, y) {
		if (qrcode.width < x) {
			throw "point error";
		}
		if (qrcode.height < y) {
			throw "point error";
		}
		point = x * 4 + y * qrcode.width * 4;
		p = (qrcode.imagedata.data[point] * 33 + qrcode.imagedata.data[point + 1] * 34 + qrcode.imagedata.data[point + 2] * 33) / 100;
		return p;
	};

	qrcode.binarize = function (th) {
		var ret = new Array(qrcode.width * qrcode.height);
		for (var y = 0; y < qrcode.height; y++) {
			for (var x = 0; x < qrcode.width; x++) {
				var gray = qrcode.getPixel(x, y);

				ret[x + y * qrcode.width] = gray <= th ? true : false;
			}
		}
		return ret;
	};

	qrcode.getMiddleBrightnessPerArea = function (image) {
		var ay, ax;
		var numSqrtArea = 4;
		//obtain middle brightness((min + max) / 2) per area
		var areaWidth = Math.floor(qrcode.width / numSqrtArea);
		var areaHeight = Math.floor(qrcode.height / numSqrtArea);
		var minmax = new Array(numSqrtArea);
		for (var i = 0; i < numSqrtArea; i++) {
			minmax[i] = new Array(numSqrtArea);
			for (var i2 = 0; i2 < numSqrtArea; i2++) {
				minmax[i][i2] = new Array(0, 0);
			}
		}
		for (ay = 0; ay < numSqrtArea; ay++) {
			for (ax = 0; ax < numSqrtArea; ax++) {
				minmax[ax][ay][0] = 0xFF;
				for (var dy = 0; dy < areaHeight; dy++) {
					for (var dx = 0; dx < areaWidth; dx++) {
						var target = image[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width];
						if (target < minmax[ax][ay][0]) minmax[ax][ay][0] = target;
						if (target > minmax[ax][ay][1]) minmax[ax][ay][1] = target;
					}
				}
			}
		}
		var middle = new Array(numSqrtArea);
		for (var i3 = 0; i3 < numSqrtArea; i3++) {
			middle[i3] = new Array(numSqrtArea);
		}
		for (ay = 0; ay < numSqrtArea; ay++) {
			for (ax = 0; ax < numSqrtArea; ax++) {
				middle[ax][ay] = Math.floor((minmax[ax][ay][0] + minmax[ax][ay][1]) / 2);
			}
		}

		return middle;
	};

	qrcode.grayScaleToBitmap = function (grayScale) {
		var middle = qrcode.getMiddleBrightnessPerArea(grayScale);
		var sqrtNumArea = middle.length;
		var areaWidth = Math.floor(qrcode.width / sqrtNumArea);
		var areaHeight = Math.floor(qrcode.height / sqrtNumArea);
		var bitmap = new Array(qrcode.height * qrcode.width);

		for (var ay = 0; ay < sqrtNumArea; ay++) {
			for (var ax = 0; ax < sqrtNumArea; ax++) {
				for (var dy = 0; dy < areaHeight; dy++) {
					for (var dx = 0; dx < areaWidth; dx++) {
						bitmap[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width] = grayScale[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width] < middle[ax][ay] ? true : false;
					}
				}
			}
		}
		return bitmap;
	};

	qrcode.grayscale = function () {
		var ret = new Array(qrcode.width * qrcode.height);
		for (var y = 0; y < qrcode.height; y++) {
			for (var x = 0; x < qrcode.width; x++) {
				var gray = qrcode.getPixel(x, y);

				ret[x + y * qrcode.width] = gray;
			}
		}
		return ret;
	};

	function URShift(number, bits) {
		if (number >= 0) return number >> bits;else return (number >> bits) + (2 << ~bits);
	}

	Array.prototype.remove = function (from, to) {
		var rest = this.slice((to || from) + 1 || this.length);
		this.length = from < 0 ? this.length + from : from;
		return this.push.apply(this, rest);
	};

	var MIN_SKIP = 3;
	var MAX_MODULES = 57;
	var INTEGER_MATH_SHIFT = 8;
	var CENTER_QUORUM = 2;

	qrcode.orderBestPatterns = function (patterns) {

		function distance(pattern1, pattern2) {
			xDiff = pattern1.X - pattern2.X;
			yDiff = pattern1.Y - pattern2.Y;
			return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
		}

		function crossProductZ(pointA, pointB, pointC) {
			var bX = pointB.x;
			var bY = pointB.y;
			return (pointC.x - bX) * (pointA.y - bY) - (pointC.y - bY) * (pointA.x - bX);
		}

		var zeroOneDistance = distance(patterns[0], patterns[1]);
		var oneTwoDistance = distance(patterns[1], patterns[2]);
		var zeroTwoDistance = distance(patterns[0], patterns[2]);

		var pointA, pointB, pointC;
		// Assume one closest to other two is B; A and C will just be guesses at first
		if (oneTwoDistance >= zeroOneDistance && oneTwoDistance >= zeroTwoDistance) {
			pointB = patterns[0];
			pointA = patterns[1];
			pointC = patterns[2];
		} else if (zeroTwoDistance >= oneTwoDistance && zeroTwoDistance >= zeroOneDistance) {
			pointB = patterns[1];
			pointA = patterns[0];
			pointC = patterns[2];
		} else {
			pointB = patterns[2];
			pointA = patterns[0];
			pointC = patterns[1];
		}

		if (crossProductZ(pointA, pointB, pointC) < 0.0) {
			var temp = pointA;
			pointA = pointC;
			pointC = temp;
		}

		patterns[0] = pointA;
		patterns[1] = pointB;
		patterns[2] = pointC;
	};

	function FinderPattern(posX, posY, estimatedModuleSize) {
		this.x = posX;
		this.y = posY;
		this.count = 1;
		this.estimatedModuleSize = estimatedModuleSize;

		this.__defineGetter__("EstimatedModuleSize", function () {
			return this.estimatedModuleSize;
		});
		this.__defineGetter__("Count", function () {
			return this.count;
		});
		this.__defineGetter__("X", function () {
			return this.x;
		});
		this.__defineGetter__("Y", function () {
			return this.y;
		});
		this.incrementCount = function () {
			this.count++;
		};
		this.aboutEquals = function (moduleSize, i, j) {
			if (Math.abs(i - this.y) <= moduleSize && Math.abs(j - this.x) <= moduleSize) {
				var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
				return moduleSizeDiff <= 1.0 || moduleSizeDiff / this.estimatedModuleSize <= 1.0;
			}
			return false;
		};
	}

	function FinderPatternInfo(patternCenters) {
		this.bottomLeft = patternCenters[0];
		this.topLeft = patternCenters[1];
		this.topRight = patternCenters[2];
		this.__defineGetter__("BottomLeft", function () {
			return this.bottomLeft;
		});
		this.__defineGetter__("TopLeft", function () {
			return this.topLeft;
		});
		this.__defineGetter__("TopRight", function () {
			return this.topRight;
		});
	}

	function FinderPatternFinder() {
		this.image = null;
		this.possibleCenters = [];
		this.hasSkipped = false;
		this.crossCheckStateCount = new Array(0, 0, 0, 0, 0);
		this.resultPointCallback = null;

		this.__defineGetter__("CrossCheckStateCount", function () {
			this.crossCheckStateCount[0] = 0;
			this.crossCheckStateCount[1] = 0;
			this.crossCheckStateCount[2] = 0;
			this.crossCheckStateCount[3] = 0;
			this.crossCheckStateCount[4] = 0;
			return this.crossCheckStateCount;
		});

		this.foundPatternCross = function (stateCount) {
			var totalModuleSize = 0;
			for (var i = 0; i < 5; i++) {
				var count = stateCount[i];
				if (count === 0) {
					return false;
				}
				totalModuleSize += count;
			}
			if (totalModuleSize < 7) {
				return false;
			}
			var moduleSize = Math.floor((totalModuleSize << INTEGER_MATH_SHIFT) / 7);
			var maxVariance = Math.floor(moduleSize / 2);
			// Allow less than 50% variance from 1-1-3-1-1 proportions
			return Math.abs(moduleSize - (stateCount[0] << INTEGER_MATH_SHIFT)) < maxVariance && Math.abs(moduleSize - (stateCount[1] << INTEGER_MATH_SHIFT)) < maxVariance && Math.abs(3 * moduleSize - (stateCount[2] << INTEGER_MATH_SHIFT)) < 3 * maxVariance && Math.abs(moduleSize - (stateCount[3] << INTEGER_MATH_SHIFT)) < maxVariance && Math.abs(moduleSize - (stateCount[4] << INTEGER_MATH_SHIFT)) < maxVariance;
		};
		this.centerFromEnd = function (stateCount, end) {
			return end - stateCount[4] - stateCount[3] - stateCount[2] / 2.0;
		};
		this.crossCheckVertical = function (startI, centerJ, maxCount, originalStateCountTotal) {
			var image = this.image;

			var maxI = qrcode.height;
			var stateCount = this.CrossCheckStateCount;

			// Start counting up from center
			var i = startI;
			while (i >= 0 && image[centerJ + i * qrcode.width]) {
				stateCount[2]++;
				i--;
			}
			if (i < 0) {
				return NaN;
			}
			while (i >= 0 && !image[centerJ + i * qrcode.width] && stateCount[1] <= maxCount) {
				stateCount[1]++;
				i--;
			}
			// If already too many modules in this state or ran off the edge:
			if (i < 0 || stateCount[1] > maxCount) {
				return NaN;
			}
			while (i >= 0 && image[centerJ + i * qrcode.width] && stateCount[0] <= maxCount) {
				stateCount[0]++;
				i--;
			}
			if (stateCount[0] > maxCount) {
				return NaN;
			}

			// Now also count down from center
			i = startI + 1;
			while (i < maxI && image[centerJ + i * qrcode.width]) {
				stateCount[2]++;
				i++;
			}
			if (i === maxI) {
				return NaN;
			}
			while (i < maxI && !image[centerJ + i * qrcode.width] && stateCount[3] < maxCount) {
				stateCount[3]++;
				i++;
			}
			if (i === maxI || stateCount[3] >= maxCount) {
				return NaN;
			}
			while (i < maxI && image[centerJ + i * qrcode.width] && stateCount[4] < maxCount) {
				stateCount[4]++;
				i++;
			}
			if (stateCount[4] >= maxCount) {
				return NaN;
			}

			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
			if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
				return NaN;
			}

			return this.foundPatternCross(stateCount) ? this.centerFromEnd(stateCount, i) : NaN;
		};
		this.crossCheckHorizontal = function (startJ, centerI, maxCount, originalStateCountTotal) {
			var image = this.image;

			var maxJ = qrcode.width;
			var stateCount = this.CrossCheckStateCount;

			var j = startJ;
			while (j >= 0 && image[j + centerI * qrcode.width]) {
				stateCount[2]++;
				j--;
			}
			if (j < 0) {
				return NaN;
			}
			while (j >= 0 && !image[j + centerI * qrcode.width] && stateCount[1] <= maxCount) {
				stateCount[1]++;
				j--;
			}
			if (j < 0 || stateCount[1] > maxCount) {
				return NaN;
			}
			while (j >= 0 && image[j + centerI * qrcode.width] && stateCount[0] <= maxCount) {
				stateCount[0]++;
				j--;
			}
			if (stateCount[0] > maxCount) {
				return NaN;
			}

			j = startJ + 1;
			while (j < maxJ && image[j + centerI * qrcode.width]) {
				stateCount[2]++;
				j++;
			}
			if (j === maxJ) {
				return NaN;
			}
			while (j < maxJ && !image[j + centerI * qrcode.width] && stateCount[3] < maxCount) {
				stateCount[3]++;
				j++;
			}
			if (j === maxJ || stateCount[3] >= maxCount) {
				return NaN;
			}
			while (j < maxJ && image[j + centerI * qrcode.width] && stateCount[4] < maxCount) {
				stateCount[4]++;
				j++;
			}
			if (stateCount[4] >= maxCount) {
				return NaN;
			}

			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
			if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= originalStateCountTotal) {
				return NaN;
			}

			return this.foundPatternCross(stateCount) ? this.centerFromEnd(stateCount, j) : NaN;
		};
		this.handlePossibleCenter = function (stateCount, i, j) {
			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
			var centerJ = this.centerFromEnd(stateCount, j); //float
			var centerI = this.crossCheckVertical(i, Math.floor(centerJ), stateCount[2], stateCountTotal); //float
			if (!isNaN(centerI)) {
				centerJ = this.crossCheckHorizontal(Math.floor(centerJ), Math.floor(centerI), stateCount[2], stateCountTotal);
				if (!isNaN(centerJ)) {
					var estimatedModuleSize = stateCountTotal / 7.0;
					var found = false;
					var max = this.possibleCenters.length;
					for (var index = 0; index < max; index++) {
						var center = this.possibleCenters[index];
						if (center.aboutEquals(estimatedModuleSize, centerI, centerJ)) {
							center.incrementCount();
							found = true;
							break;
						}
					}
					if (!found) {
						var point = new FinderPattern(centerJ, centerI, estimatedModuleSize);
						this.possibleCenters.push(point);
						if (this.resultPointCallback !== null) {
							this.resultPointCallback.foundPossibleResultPoint(point);
						}
					}
					return true;
				}
			}
			return false;
		};

		this.selectBestPatterns = function () {
			var i;
			var startSize = this.possibleCenters.length;
			if (startSize < 3) {
				throw "Couldn't find enough finder patterns";
			}

			if (startSize > 3) {
				var totalModuleSize = 0.0;
				for (i = 0; i < startSize; i++) {
					totalModuleSize += this.possibleCenters[i].EstimatedModuleSize;
				}
				var average = totalModuleSize / startSize;
				for (i = 0; i < this.possibleCenters.length && this.possibleCenters.length > 3; i++) {
					var pattern = this.possibleCenters[i];
					if (Math.abs(pattern.EstimatedModuleSize - average) > 0.2 * average) {
						this.possibleCenters.remove(i);
						i--;
					}
				}
			}

			return new Array(this.possibleCenters[0], this.possibleCenters[1], this.possibleCenters[2]);
		};

		this.findRowSkip = function () {
			var max = this.possibleCenters.length;
			if (max <= 1) {
				return 0;
			}
			var firstConfirmedCenter = null;
			for (var i = 0; i < max; i++) {
				var center = this.possibleCenters[i];
				if (center.Count >= CENTER_QUORUM) {
					if (firstConfirmedCenter === null) {
						firstConfirmedCenter = center;
					} else {
						this.hasSkipped = true;
						return Math.floor((Math.abs(firstConfirmedCenter.X - center.X) - Math.abs(firstConfirmedCenter.Y - center.Y)) / 2);
					}
				}
			}
			return 0;
		};

		this.haveMultiplyConfirmedCenters = function () {
			var confirmedCount = 0;
			var totalModuleSize = 0.0;
			var i;
			var pattern;
			var max = this.possibleCenters.length;
			for (i = 0; i < max; i++) {
				pattern = this.possibleCenters[i];
				if (pattern.Count >= CENTER_QUORUM) {
					confirmedCount++;
					totalModuleSize += pattern.EstimatedModuleSize;
				}
			}
			if (confirmedCount < 3) {
				return false;
			}
			var average = totalModuleSize / max;
			var totalDeviation = 0.0;
			for (i = 0; i < max; i++) {
				pattern = this.possibleCenters[i];
				totalDeviation += Math.abs(pattern.EstimatedModuleSize - average);
			}
			return totalDeviation <= 0.05 * totalModuleSize;
		};

		this.findFinderPattern = function (image) {
			var tryHarder = false;
			this.image = image;
			var maxI = qrcode.height;
			var maxJ = qrcode.width;
			var iSkip = Math.floor(3 * maxI / (4 * MAX_MODULES));
			if (iSkip < MIN_SKIP || tryHarder) {
				iSkip = MIN_SKIP;
			}
			var confirmed;
			var done = false;
			var stateCount = new Array(5);
			for (var i = iSkip - 1; i < maxI && !done; i += iSkip) {
				// Get a row of black/white values
				stateCount[0] = 0;
				stateCount[1] = 0;
				stateCount[2] = 0;
				stateCount[3] = 0;
				stateCount[4] = 0;
				var currentState = 0;
				for (var j = 0; j < maxJ; j++) {
					if (image[j + i * qrcode.width]) {
						// Black pixel
						if ((currentState & 1) === 1) {
							// Counting white pixels
							currentState++;
						}
						stateCount[currentState]++;
					} else {
						if ((currentState & 1) === 0) {
							if (currentState === 4) {
								if (this.foundPatternCross(stateCount)) {
									confirmed = this.handlePossibleCenter(stateCount, i, j);
									if (confirmed) {
										iSkip = 2;
										if (this.hasSkipped) {
											done = this.haveMultiplyConfirmedCenters();
										} else {
											var rowSkip = this.findRowSkip();
											if (rowSkip > stateCount[2]) {
												i += rowSkip - stateCount[2] - iSkip;
												j = maxJ - 1;
											}
										}
									} else {
										do {
											j++;
										} while (j < maxJ && !image[j + i * qrcode.width]);
										j--; // back up to that last white pixel
									}

									currentState = 0;
									stateCount[0] = 0;
									stateCount[1] = 0;
									stateCount[2] = 0;
									stateCount[3] = 0;
									stateCount[4] = 0;
								} else {
									// No, shift counts back by two
									stateCount[0] = stateCount[2];
									stateCount[1] = stateCount[3];
									stateCount[2] = stateCount[4];
									stateCount[3] = 1;
									stateCount[4] = 0;
									currentState = 3;
								}
							} else {
								stateCount[++currentState]++;
							}
						} else {
							// Counting white pixels
							stateCount[currentState]++;
						}
					}
				}
				if (this.foundPatternCross(stateCount)) {
					confirmed = this.handlePossibleCenter(stateCount, i, maxJ);
					if (confirmed) {
						iSkip = stateCount[0];
						if (this.hasSkipped) {
							// Found a third one
							done = haveMultiplyConfirmedCenters();
						}
					}
				}
			}

			var patternInfo = this.selectBestPatterns();
			qrcode.orderBestPatterns(patternInfo);

			return new FinderPatternInfo(patternInfo);
		};
	}

	function AlignmentPattern(posX, posY, estimatedModuleSize) {
		this.x = posX;
		this.y = posY;
		this.count = 1;
		this.estimatedModuleSize = estimatedModuleSize;

		this.__defineGetter__("EstimatedModuleSize", function () {
			return this.estimatedModuleSize;
		});
		this.__defineGetter__("Count", function () {
			return this.count;
		});
		this.__defineGetter__("X", function () {
			return Math.floor(this.x);
		});
		this.__defineGetter__("Y", function () {
			return Math.floor(this.y);
		});
		this.incrementCount = function () {
			this.count++;
		};
		this.aboutEquals = function (moduleSize, i, j) {
			if (Math.abs(i - this.y) <= moduleSize && Math.abs(j - this.x) <= moduleSize) {
				var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
				return moduleSizeDiff <= 1.0 || moduleSizeDiff / this.estimatedModuleSize <= 1.0;
			}
			return false;
		};
	}

	function AlignmentPatternFinder(image, startX, startY, width, height, moduleSize, resultPointCallback) {
		this.image = image;
		this.possibleCenters = [];
		this.startX = startX;
		this.startY = startY;
		this.width = width;
		this.height = height;
		this.moduleSize = moduleSize;
		this.crossCheckStateCount = new Array(0, 0, 0);
		this.resultPointCallback = resultPointCallback;

		this.centerFromEnd = function (stateCount, end) {
			return end - stateCount[2] - stateCount[1] / 2.0;
		};
		this.foundPatternCross = function (stateCount) {
			var moduleSize = this.moduleSize;
			var maxVariance = moduleSize / 2.0;
			for (var i = 0; i < 3; i++) {
				if (Math.abs(moduleSize - stateCount[i]) >= maxVariance) {
					return false;
				}
			}
			return true;
		};

		this.crossCheckVertical = function (startI, centerJ, maxCount, originalStateCountTotal) {
			var image = this.image;

			var maxI = qrcode.height;
			var stateCount = this.crossCheckStateCount;
			stateCount[0] = 0;
			stateCount[1] = 0;
			stateCount[2] = 0;

			var i = startI;
			while (i >= 0 && image[centerJ + i * qrcode.width] && stateCount[1] <= maxCount) {
				stateCount[1]++;
				i--;
			}
			if (i < 0 || stateCount[1] > maxCount) {
				return NaN;
			}
			while (i >= 0 && !image[centerJ + i * qrcode.width] && stateCount[0] <= maxCount) {
				stateCount[0]++;
				i--;
			}
			if (stateCount[0] > maxCount) {
				return NaN;
			}

			i = startI + 1;
			while (i < maxI && image[centerJ + i * qrcode.width] && stateCount[1] <= maxCount) {
				stateCount[1]++;
				i++;
			}
			if (i === maxI || stateCount[1] > maxCount) {
				return NaN;
			}
			while (i < maxI && !image[centerJ + i * qrcode.width] && stateCount[2] <= maxCount) {
				stateCount[2]++;
				i++;
			}
			if (stateCount[2] > maxCount) {
				return NaN;
			}

			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
			if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
				return NaN;
			}

			return this.foundPatternCross(stateCount) ? this.centerFromEnd(stateCount, i) : NaN;
		};

		this.handlePossibleCenter = function (stateCount, i, j) {
			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
			var centerJ = this.centerFromEnd(stateCount, j);
			var centerI = this.crossCheckVertical(i, Math.floor(centerJ), 2 * stateCount[1], stateCountTotal);
			if (!isNaN(centerI)) {
				var estimatedModuleSize = (stateCount[0] + stateCount[1] + stateCount[2]) / 3.0;
				var max = this.possibleCenters.length;
				for (var index = 0; index < max; index++) {
					var center = this.possibleCenters[index];
					if (center.aboutEquals(estimatedModuleSize, centerI, centerJ)) {
						return new AlignmentPattern(centerJ, centerI, estimatedModuleSize);
					}
				}
				var point = new AlignmentPattern(centerJ, centerI, estimatedModuleSize);
				this.possibleCenters.push(point);
				if (this.resultPointCallback !== null) {
					this.resultPointCallback.foundPossibleResultPoint(point);
				}
			}
			return null;
		};

		this.find = function () {
			var confirmed;
			var startX = this.startX;
			var height = this.height;
			var maxJ = startX + width;
			var middleI = startY + (height >> 1);
			var stateCount = new Array(0, 0, 0);
			for (var iGen = 0; iGen < height; iGen++) {
				var i = middleI + ((iGen & 0x01) === 0 ? iGen + 1 >> 1 : -(iGen + 1 >> 1));
				stateCount[0] = 0;
				stateCount[1] = 0;
				stateCount[2] = 0;
				var j = startX;

				while (j < maxJ && !image[j + qrcode.width * i]) {
					j++;
				}
				var currentState = 0;
				while (j < maxJ) {
					if (image[j + i * qrcode.width]) {
						if (currentState === 1) {
							stateCount[currentState]++;
						} else {
							if (currentState === 2) {
								if (this.foundPatternCross(stateCount)) {
									confirmed = this.handlePossibleCenter(stateCount, i, j);
									if (confirmed !== null) {
										return confirmed;
									}
								}
								stateCount[0] = stateCount[2];
								stateCount[1] = 1;
								stateCount[2] = 0;
								currentState = 1;
							} else {
								stateCount[++currentState]++;
							}
						}
					} else {
						if (currentState === 1) {
							currentState++;
						}
						stateCount[currentState]++;
					}
					j++;
				}
				if (this.foundPatternCross(stateCount)) {
					confirmed = this.handlePossibleCenter(stateCount, i, maxJ);
					if (confirmed !== null) {
						return confirmed;
					}
				}
			}

			if (this.possibleCenters.length > 0) {
				return this.possibleCenters[0];
			}

			throw "Couldn't find enough alignment patterns";
		};
	}

	function QRCodeDataBlockReader(blocks, version, numErrorCorrectionCode) {
		this.blockPointer = 0;
		this.bitPointer = 7;
		this.dataLength = 0;
		this.blocks = blocks;
		this.numErrorCorrectionCode = numErrorCorrectionCode;
		if (version <= 9) this.dataLengthMode = 0;else if (version >= 10 && version <= 26) this.dataLengthMode = 1;else if (version >= 27 && version <= 40) this.dataLengthMode = 2;

		this.getNextBits = function (numBits) {
			var bits = 0,
			    i;
			var mask1;
			if (numBits < this.bitPointer + 1) {
				// next word fits into current data block
				var mask = 0;
				for (i = 0; i < numBits; i++) {
					mask += 1 << i;
				}
				mask <<= this.bitPointer - numBits + 1;

				bits = (this.blocks[this.blockPointer] & mask) >> this.bitPointer - numBits + 1;
				this.bitPointer -= numBits;
				return bits;
			} else if (numBits < this.bitPointer + 1 + 8) {
				// next word crosses 2 data blocks
				mask1 = 0;
				for (i = 0; i < this.bitPointer + 1; i++) {
					mask1 += 1 << i;
				}
				bits = (this.blocks[this.blockPointer] & mask1) << numBits - (this.bitPointer + 1);
				this.blockPointer++;
				bits += this.blocks[this.blockPointer] >> 8 - (numBits - (this.bitPointer + 1));

				this.bitPointer = this.bitPointer - numBits % 8;
				if (this.bitPointer < 0) {
					this.bitPointer = 8 + this.bitPointer;
				}
				return bits;
			} else if (numBits < this.bitPointer + 1 + 16) {
				mask1 = 0; // mask of first block
				var mask3 = 0; // mask of 3rd block
				for (i = 0; i < this.bitPointer + 1; i++) {
					mask1 += 1 << i;
				}
				var bitsFirstBlock = (this.blocks[this.blockPointer] & mask1) << numBits - (this.bitPointer + 1);
				this.blockPointer++;

				var bitsSecondBlock = this.blocks[this.blockPointer] << numBits - (this.bitPointer + 1 + 8);
				this.blockPointer++;

				for (i = 0; i < numBits - (this.bitPointer + 1 + 8); i++) {
					mask3 += 1 << i;
				}
				mask3 <<= 8 - (numBits - (this.bitPointer + 1 + 8));
				var bitsThirdBlock = (this.blocks[this.blockPointer] & mask3) >> 8 - (numBits - (this.bitPointer + 1 + 8));

				bits = bitsFirstBlock + bitsSecondBlock + bitsThirdBlock;
				this.bitPointer = this.bitPointer - (numBits - 8) % 8;
				if (this.bitPointer < 0) {
					this.bitPointer = 8 + this.bitPointer;
				}
				return bits;
			} else {
				return 0;
			}
		};
		this.NextMode = function () {
			if (this.blockPointer > this.blocks.length - this.numErrorCorrectionCode - 2) return 0;else return this.getNextBits(4);
		};
		this.getDataLength = function (modeIndicator) {
			var index = 0;
			while (true) {
				if (modeIndicator >> index === 1) break;
				index++;
			}

			return this.getNextBits(qrcode.sizeOfDataLengthInfo[this.dataLengthMode][index]);
		};
		this.getRomanAndFigureString = function (dataLength) {
			var length = dataLength;
			var intData = 0;
			var strData = "";
			var tableRomanAndFigure = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ' ', '$', '%', '*', '+', '-', '.', '/', ':');
			do {
				if (length > 1) {
					intData = this.getNextBits(11);
					var firstLetter = Math.floor(intData / 45);
					var secondLetter = intData % 45;
					strData += tableRomanAndFigure[firstLetter];
					strData += tableRomanAndFigure[secondLetter];
					length -= 2;
				} else if (length === 1) {
					intData = this.getNextBits(6);
					strData += tableRomanAndFigure[intData];
					length -= 1;
				}
			} while (length > 0);

			return strData;
		};
		this.getFigureString = function (dataLength) {
			var length = dataLength;
			var intData = 0;
			var strData = "";
			do {
				if (length >= 3) {
					intData = this.getNextBits(10);
					if (intData < 100) strData += "0";
					if (intData < 10) strData += "0";
					length -= 3;
				} else if (length === 2) {
					intData = this.getNextBits(7);
					if (intData < 10) strData += "0";
					length -= 2;
				} else if (length === 1) {
					intData = this.getNextBits(4);
					length -= 1;
				}
				strData += intData;
			} while (length > 0);

			return strData;
		};
		this.get8bitByteArray = function (dataLength) {
			var length = dataLength;
			var intData = 0;
			var output = [];

			do {
				intData = this.getNextBits(8);
				output.push(intData);
				length--;
			} while (length > 0);
			return output;
		};
		this.getKanjiString = function (dataLength) {
			var length = dataLength;
			var intData = 0;
			var unicodeString = "";
			do {
				intData = getNextBits(13);
				var lowerByte = intData % 0xC0;
				var higherByte = intData / 0xC0;

				var tempWord = (higherByte << 8) + lowerByte;
				var shiftjisWord = 0;
				if (tempWord + 0x8140 <= 0x9FFC) {
					shiftjisWord = tempWord + 0x8140;
				} else {
					shiftjisWord = tempWord + 0xC140;
				}

				unicodeString += String.fromCharCode(shiftjisWord);
				length--;
			} while (length > 0);

			return unicodeString;
		};

		this.__defineGetter__("DataByte", function () {
			var output = [];
			var MODE_NUMBER = 1;
			var MODE_ROMAN_AND_NUMBER = 2;
			var MODE_8BIT_BYTE = 4;
			var MODE_KANJI = 8;
			var j;
			var temp_str, ta;
			do {
				var mode = this.NextMode();
				if (mode === 0) {
					if (output.length > 0) break;else throw "Empty data block";
				}
				if (mode !== MODE_NUMBER && mode !== MODE_ROMAN_AND_NUMBER && mode !== MODE_8BIT_BYTE && mode !== MODE_KANJI) {
					throw "Invalid mode: " + mode + " in (block:" + this.blockPointer + " bit:" + this.bitPointer + ")";
				}
				dataLength = this.getDataLength(mode);
				if (dataLength < 1) throw "Invalid data length: " + dataLength;
				switch (mode) {

					case MODE_NUMBER:
						temp_str = this.getFigureString(dataLength);
						ta = new Array(temp_str.length);
						for (j = 0; j < temp_str.length; j++) {
							ta[j] = temp_str.charCodeAt(j);
						}output.push(ta);
						break;

					case MODE_ROMAN_AND_NUMBER:
						temp_str = this.getRomanAndFigureString(dataLength);
						ta = new Array(temp_str.length);
						for (j = 0; j < temp_str.length; j++) {
							ta[j] = temp_str.charCodeAt(j);
						}output.push(ta);
						break;
					case MODE_8BIT_BYTE:
						var temp_sbyteArray3 = this.get8bitByteArray(dataLength);
						output.push(temp_sbyteArray3);
						break;
					case MODE_KANJI:
						temp_str = this.getKanjiString(dataLength);
						output.push(temp_str);
						break;
				}
			} while (true);
			return output;
		});
	}

	/**
	 * exports the created qrcode object.
	 */
	module.exports = qrcode;

/***/ }
/******/ ]);