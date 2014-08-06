var randomdatagen = require('../jk-randomdatagen');

var Db = require('mongodb').Db;
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var ReplSetServers = require('mongodb').ReplSetServers;
var ObjectID = require('mongodb').ObjectID;
var Binary = require('mongodb').Binary;
var GridStore = require('mongodb').GridStore;
var Grid = require('mongodb').Grid;
var Code = require('mongodb').Code;
var BSON = require('mongodb').pure().BSON;
var BSONPure = require('mongodb').BSONPure;
var assert = require('assert');
var ini = require('ini');							// https://npmjs.org/package/ini



exports = module.exports

// internal variables

exports.__SESSION_TIMEOUT_MILLISECONDS = false;
exports.__SID_LENGTH = false;
exports.__bInitialized = false;

exports.__bConnected = false;
exports.__db = false;
exports.__collection = false;
exports.__sessions = { };

// public methods

exports.init = init;
exports.login = login;
exports.verify = verify;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// General /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function __verifyKeyExists(configurationIniSection, key, callback)
{
	if (!configurationIniSection || !configurationIniSection[key]) {
		if (callback) {
			callback("Undefined key: Authentification section, key \"" + key + "\"!", false);
		} else {
			console.log("ERROR: Undefined key: Authentification section, key \"" + key + "\"!");
		}
		return false;
	} else {
		return true;
	}
}

String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) == 0;
};

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Initialization //////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function init(configurationIniSection, callback)
{
	if (!__verifyKeyExists(configurationIniSection, "sessionTimeOut", callback)) return;
	if (!__verifyKeyExists(configurationIniSection, "sidLength", callback)) return;
	if (!__verifyKeyExists(configurationIniSection, "dbHost", callback)) return;
	if (!__verifyKeyExists(configurationIniSection, "dbPort", callback)) return;
	if (!__verifyKeyExists(configurationIniSection, "dbName", callback)) return;
	if (!__verifyKeyExists(configurationIniSection, "dbColName", callback)) return;

	// ----

	exports.__SESSION_TIMEOUT_MILLISECONDS = parseInt(configurationIniSection.sessionTimeOut) * 1000;
	exports.__SID_LENGTH = parseInt(configurationIniSection.sidLength);

	var MONGODB_HOST = configurationIniSection.dbHost;
	var MONGODB_PORT = parseInt(configurationIniSection.dbPort);
	var MONGODB_DBNAME = configurationIniSection.dbName;
	var MONGODB_COLNAME = configurationIniSection.dbColName;

	MongoClient.connect("mongodb://" + MONGODB_HOST + ":" + MONGODB_PORT + "/" + MONGODB_DBNAME, function(err, db) {
		if (err) {
			if (callback) {
				callback("SimpleMongoDBAuth: Failed to connect!", false);
			} else {
				console.log("SimpleMongoDBAuth: Failed to connect!");
			}
		} else {
			console.log("SimpleMongoDBAuth: Connection to data base established.");
			exports.__db = db;
			exports.__bConnected = true;

			// Grab a collection with a callback in safe mode, ensuring it exists (should fail as it's not created)
			db.collection(MONGODB_COLNAME, {strict:true}, function(err, col) {
				if (err == null) {
					exports.__collection = col;
					console.log("SimpleMongoDBAuth: Connection to collection '" + MONGODB_COLNAME + "' established.");
					exports.__bInitialized = true;
					callback(null, true);
				} else {
					// Create the collection
					console.log("SimpleMongoDBAuth: Collection '" + MONGODB_COLNAME + "' does not seem to exist. Creating it ....");
					db.createCollection(MONGODB_COLNAME, function(err, result) {
						// Retry to get the collection, should work as it's now created
						db.collection(MONGODB_COLNAME, {strict:true}, function(err, col) {
							if (err != null) {
								if (callback) {
									callback(err, true);
								} else {
									console.log(err);
									assert.equal(null, err);
								}
							} else {
								exports.__collection = col;
								console.log("SimpleMongoDBAuth: Connection to collection '" + MONGODB_COLNAME + "' established.");
								exports.__bInitialized = true;
								callback(null, true);
							}
						});
					});
				};
			});
		};
	});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Performs authentification by querying the data base.
 *
 * @param	username	The name of the user
 * @param	password	The (unencrypted) password presented by the user
 * @param	callback	The callback method provided by the user in order to notify the caller about success or failure of the operation.
 *						Parameter 1 receives an error object if an error occurred, or null on success.
 *						Parameter 2 receives the user data object on success, or null if authentification failed.
 */
function __verifyAuthData(username, password, callback)
{
	exports.__collection.findOne({ "username" : username }, function(err, item) {
		if (err != null) {
			callback(err, null);
		} else
		if (item == null) {
			return callback(null, null);
		} else {
			delete item._id;
			if (item.password == password) {
				delete item.password;
				return callback(null, item);
			} else {
				return callback(null, null);
			}
		}
	});
}

function __createRegisterNewSessionID(username, userObj)
{
	var r;
	while (true) {
		r = randomdatagen.generateRandomASCIIString(exports.__SID_LENGTH);
		if (!exports.__sessions[r]) break;
	}

	exports.__sessions[r] = {
		"username" : username,
		"timestamp" : new Date().getTime(),
		"userObj" : userObj
	};

	return r;
}

function __removeOldSessions()
{
	var sessionsToRemove = [];
	var t = new Date().getTime();
	for (var sid in exports.__sessions) {
		var session = exports.__sessions[sid];
		if (session.timestamp < t - exports.__SESSION_TIMEOUT_MILLISECONDS) {
			// schedule for removal
			sessionsToRemove.push(sid);
		}
	}
	for (var i = 0; i < sessionsToRemove.length; i++) {
		var sid = sessionsToRemove[i];
		// console.log("SimpleMongoDBAuth: Session removed: " + sid);
		delete exports.__sessions[sid];
	}
	for (var i = 0; i < sessionsToRemove.length; i++) {
		if (exports.__sessions[sid]) {
			console.log("ERROR: SimpleMongoDBAuth: Session still exists: " + sid);
		}
	}
}

/**
 * Returns the user object on success, null on error.
 */
function __verifyTouchSession(sid)
{
	if (!exports.__sessions[sid]) return null;

	var session = exports.__sessions[sid];
	var t = new Date().getTime();
	if (session.timestamp < t - exports.__SESSION_TIMEOUT_MILLISECONDS) {
		// remove session
		delete exports.__sessions.sid;
		return null;
	}

	session.timestamp = t;
	return session.userObj;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * Performs authentification by querying the data base.
 *
 * @param	username	The name of the user
 * @param	password	The (unencrypted) password presented by the user
 * @param	callback	The callback method provided by the user in order to notify the caller about success or failure of the operation.
 *						Parameter 1 receives a string or an error object if an error occurred, or null on success.
 *						Parameter 2 receives the user data object on success, or null if authentification failed.
 */
function login(username, password, callback)
{
	if (!exports.__bInitialized) {
		return callback("Not initialized!", null);
	}

	__removeOldSessions();
	__verifyAuthData(username, password, function(err, userObj) {
		if (err != null) {
			callback(err, null);
		} else {
			if (userObj == null) {
				callback(null, null);
			} else {
				userObj.sid = __createRegisterNewSessionID(username, userObj);
				callback(null, userObj);
			}
		}
	});
}

/**
 * Check if the session ID returned is still valid.
 *
 * @return	Returns either <code>null</code> or a valid user object.
 */
function verify(sid)
{
	if (!exports.__bInitialized) return null;

	var userObj = __verifyTouchSession(sid);
	return userObj;
}

