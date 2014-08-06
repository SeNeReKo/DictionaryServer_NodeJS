var crypto = require('crypto');


exports = module.exports

// internal variables

exports.__RANDCHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
exports.__TEMPFILENAMELENGTH = 128;

// public methods

exports.generateRandomASCIIString = generateRandomASCIIString;
exports.generateRandomTempFileNamePath = generateRandomTempFileNamePath;

// ----



function generateRandomASCIIString(len)
{
	var buf = crypto.randomBytes(len);
        var s = "";
        for (var i = 0; i < len; i++) {
                s += exports.__RANDCHARS.charAt(buf[i] % 32);
        }
	return s;
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function generateRandomTempFileNamePath(tempDir)
{
	if (!tempDir.endsWith("/")) {
		tempDir += "/";
	}
	return tempDir + generateRandomASCIIString(exports.TEMPFILENAMELENGTH) + ".data";
}

