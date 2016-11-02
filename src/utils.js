var zpad = function (value, length) {
    value = "" + value;
    length -= value.length;
    while (length-- > 0) value = '0' + value;
    return value;
};

var exports = module.exports = {zpad: zpad};