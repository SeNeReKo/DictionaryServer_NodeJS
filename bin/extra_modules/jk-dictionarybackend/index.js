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

exports = module.exports

// internal variables

var internal = {};

internal.__bConnected = false;
internal.__db = false;
internal.__collection = false;
internal.__collections = { };
internal.__metaCollections = { };
internal.__collectionNames = [ ];
internal.__collectionNamePrefix = "undefined1_";
internal.__collectionMetaPrefix = "undefined2_";



//################################################################################################################################
//################################################################################################################################
//####
//####    General
//####
//################################################################################################################################
//################################################################################################################################


function __verifyKeyExists(configurationIniSection, key, callback)
{
	if (!configurationIniSection || !configurationIniSection[key]) {
		if (callback) {
			callback("Undefined key: Dictionary section, key \"" + key + "\"!", false);
		} else {
			console.log("ERROR: Undefined key: Dictionary section, key \"" + key + "\"!");
		}
		return false;
	} else {
		return true;
	}
}

Object.spawn = function (parent, props) {
	/*
	console.log("    >> spawning ...");
	console.log("    >>>> parent: " + JSON.stringify(parent));
	console.log("    >>>> props: " + JSON.stringify(props));
	*/
	var defs = {};
	for (var key in props) {
		if (props.hasOwnProperty(key)) {
		// 	console.log("    >>>>>> defining: " + key);
			defs[key] = {value: props[key], enumerable: true};
		// } else {
		// 	console.log("    >>>>>> skipping: " + key);
		}
	}
	var x = Object.create(parent, defs);
	/*
	for (var key in x) {
		console.log("    >>>>>> property: " + key + " " + props.hasOwnProperty(key));
	}
	console.log("    >>>> result: " + JSON.stringify(x));
	*/
	return x;
}




if (typeof __returnFirstMemberName != "undefined") {
	__returnFirstMemberName = function(object) {
		for (var s in object) return s;
		return null;
	}
}

if (typeof __isArray != "undefined") {
	__isArray = function(obj) {
		return obj.constructor === Array;
	}
}

if (typeof __isString != "undefined") {
	__isString = function(obj) {
		return obj.constructor === String;
	}
}

if (typeof __isObject != "undefined") {
	__isObject = function(obj) {
		return obj.constructor === Object;
	}
}

if (typeof __isNumber != "undefined") {
	__isNumber = function(n) {
		if ((n == null) || (n == "")) return false;
		return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
	}
}

if (typeof __isInteger != "undefined") {
	__isInteger = function(n) {
		if ((n == null) || (n == "")) return false;
		return /^-?[0-9]+$/.test(n);
	}
}

if (typeof __isFunction != "undefined") {
	__isFunction = function(obj) {
		if (!obj) return false;
		return typeof(obj) == "function";
	}
}


if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(prefix) {
		return this.indexOf(prefix) == 0;
	};
}

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

if (!String.prototype.trim) {  
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g,'');
	};  
}

////////////////////////////////////////////////////////////////
// Initialization
////////////////////////////////////////////////////////////////

var retrieveCollections = function(callback)
{
	internal.__db.collections(function(err, collections) {

		var metaCollectionsToCreate = [ ];

		if (err != null) {
			callback(err, null);
		} else {
			internal.__collections = { };
			internal.__collectionNames = [ ];
			internal.__metaCollections = { };
			
			// collect all collections

			var count = 0;
			for (var i = 0; i < collections.length; i++) {
				var collection = collections[i];
				if (collection.collectionName.startsWith(internal.__collectionNamePrefix)) {
					count++;
					var colName = collection.collectionName.substr(internal.__collectionNamePrefix.length);
					// console.log("DictionaryCore: Collection found: " + colName);
					internal.__collections[colName] = collection;
					internal.__collectionNames.push(colName);
				}
			}

			// see if there is a meta collection for each collection

			var countMetaCollectionsToCreate = 0;

			for (var i = 0; i < internal.__collectionNames.length; i++) {
				var colName = internal.__collectionNames[i];

				var collection = null;
				for (var j = 0; j < collections.length; j++) {
					var c = collections[j];
					if (c.collectionName == internal.__collectionMetaPrefix + colName) {
						collection = c;
						break;
					}
				}

				if (collection != null) {
					console.log("found : " + colName + " ---- meta collection exists");
					internal.__metaCollections[colName] = collection;
				} else {
					console.log("found : " + colName + " ---- meta collection does not exist -> scheduling it for creation");
					metaCollectionsToCreate.push(colName);
					countMetaCollectionsToCreate++;
				}
			}

			if (countMetaCollectionsToCreate) {
				console.log(countMetaCollectionsToCreate + " meta collection(s) need to be created!");

				__createMetaCollection(metaCollectionsToCreate, 0, callback);

			} else {
				callback(null, true);
			}
		}
	});
}

var __createMetaCollection = function(metaCollectionsToCreate, index, callback)
{
	if (index >= metaCollectionsToCreate.length) {
		callback(null, true);
		return;
	}

	var collectionName = metaCollectionsToCreate[index];
	if (collectionName) {
		console.log("Creating meta collection for: " + collectionName);

		internal.__db.createCollection(internal.__collectionMetaPrefix + collectionName, function(err, result) {
			if (err != null) {
				// failed!
				callback(err, null);
			} else {
				// retry to get the collection, should work as it's now created
				internal.__db.collection(internal.__collectionMetaPrefix + collectionName, {strict:true}, function(err, col) {
					if (err != null) {
						// failed!
						callback(err, null);
					} else {
						// success!
						internal.__metaCollections[collectionName] = col;
						__createMetaCollection(metaCollectionsToCreate, index + 1, callback);
					}
				});
			}
		});

	} else {
		__createMetaCollection(metaCollectionsToCreate, index + 1, callback);
	}
}

var init = function(configurationIniSection, collectionNamePrefix, collectionMetaPrefix, callback)
{
	if (!__verifyKeyExists(configurationIniSection, "dbHost", callback)) return;
	if (!__verifyKeyExists(configurationIniSection, "dbPort", callback)) return;
	if (!__verifyKeyExists(configurationIniSection, "dbName", callback)) return;

	// ----

	internal.__collectionNamePrefix = collectionNamePrefix;
	internal.__collectionMetaPrefix = collectionMetaPrefix;

	var MONGODB_HOST = configurationIniSection.dbHost;
	var MONGODB_PORT = parseInt(configurationIniSection.dbPort);
	var MONGODB_DBNAME = configurationIniSection.dbName;
	//var MONGODB_COLNAME = "words";

	MongoClient.connect("mongodb://" + MONGODB_HOST + ":" + MONGODB_PORT + "/" + MONGODB_DBNAME, function(err, db) {
		if (err) {
			if (callback) {
				callback("DictionaryCore: Failed to connect!", false);
			} else {
				console.log("ERROR: DictionaryCore: Failed to connect!");
			}
		} else {
			console.log("DictionaryCore: Connection to data base established.");
			internal.__db = db;
			internal.__bConnected = true;

			db.collections(function(err, collections) {
				if (err != null) {
					internal.__collections = { };
					internal.__db = false;
					internal.__bConnected = false;
					if (callback) {
						callback("ERROR: DictionaryCore: Failed to retrieve collections! Terminating connection.", false);
					} else {
						console.log("ERROR: DictionaryCore: Failed to retrieve collections! Terminating connection.");
					}
				} else {
					/*
					internal.__collections = { };
					internal.__collectionNames = [ ];
					var count = 0;
					for (var i = 0; i < collections.length; i++) {
						var collection = collections[i];
						if (collection.collectionName.startsWith(internal.__collectionNamePrefix)) {
							count++;
							var colName = collection.collectionName.substr(5);
							// console.log("Collection found: " + colName);
							internal.__collections[colName] = collection;
							internal.__collectionNames.push(colName);
						}
					}
					// console.log(count + " collections found.");
					if (callback) {
						callback(null, true);
					}
					*/
					retrieveCollections(callback);
				}
			});

			/*
			// Grab a collection with a callback in safe mode, ensuring it exists (should fail as it's not created)
			db.collection(MONGODB_COLNAME, {strict:true}, function(err, col) {
				if (err == null) {
					internal.__collection = col;
					console.log("Connection to collection established.");
				} else {
					// Create the collection
					console.log("Collection 'word' does not seem to exist. Creating it ....");
					db.createCollection(MONGODB_COLNAME, function(err, result) {
						// Retry to get the collection, should work as it's now created
						db.collection(MONGODB_COLNAME, {strict:true}, function(err, col) {
							if (err != null) {
								console.log(err);
								assert.equal(null, err);
							}
							internal.__collection = col;
							console.log("Connection to collection established.");
						});
					});
				};
			});
			*/
		};
	});
}

var getCollection = function(colName)
{
	return internal.__collections[colName];
}

////////////////////////////////////////////////////////////////
// Functions
////////////////////////////////////////////////////////////////

var listCollections = function(callback)
{
	// console.log("---- lemma: " + dataObj.lemma);
	// console.log("---- wordType: " + dataObj.wordType);

	var ret = [];
	for (var i = 0; i < internal.__collectionNames.length; i++) {
		ret.push(internal.__collectionNames[i]);
	}
	callback(null, ret);
}

var createCollection = function(collectionName, callback)
{
	// console.log("---- lemma: " + dataObj.lemma);
	// console.log("---- wordType: " + dataObj.wordType);

	internal.__db.collection(internal.__collectionNamePrefix + collectionName, {strict:true}, function(err, col) {
		if (err == null) {
			// collection already exists

			listCollections(callback);

		} else {
			// create the collection

			internal.__db.createCollection(internal.__collectionNamePrefix + collectionName, function(err, result) {
				if (err != null) {
					// failed!
					callback(err, null);
				} else {
					// retry to get the collection, should work as it's now created
					internal.__db.collection(internal.__collectionNamePrefix + collectionName, {strict:true}, function(err, col) {
						if (err != null) {
							// failed!
							callback(err, null);
						} else {
							// success!
							retrieveCollections(function(err, status) {
								if (err != null) {
									// failed!
									callback(err, null);
								} else {
									listCollections(callback);
								}
							});
						}
					});
				}
			});
		};
	});
}

var deleteAllWords = function(collectionName, callback)
{
	if (!internal.__collections[collectionName]) {
		callback("No such collection!", null);
		return;
	}

	internal.__db.dropCollection(internal.__collectionNamePrefix + collectionName, function(err, result) {
		if (err != null) {
			callback(err, null);
		} else {
			internal.__db.createCollection(internal.__collectionNamePrefix + collectionName, {strict:true}, function(err, result) {
				if (err != null) {
					callback(err, null);
				} else {
					callback(null, true);
				}
			});
		}
	});
}

var renameCollection = function(oldCollectionName, newCollectionName, callback)
{
	if (!internal.__collections[oldCollectionName]) {
		callback("No such collection!", null);
		return;
	}

	internal.__db.renameCollection(internal.__collectionNamePrefix + oldCollectionName, internal.__collectionNamePrefix + newCollectionName, function(err, result) {
		if (err != null) {
			callback(err, null);
		} else {
			retrieveCollections(callback);
		}
	});
}

var destroyCollection = function(collectionName, callback)
{
	if (!internal.__collections[collectionName]) {
		callback("No such collection!", null);
		return;
	}

	internal.__db.dropCollection(internal.__collectionNamePrefix + collectionName, function(err, result) {
		if (err != null) {
			callback(err, null);
		} else {
			retrieveCollections(callback);
		}
	});
}

var addWord = function(collectionName, dataObj, callback)
{
	// console.log("---- lemma: " + dataObj.lemma);
	// console.log("---- wordType: " + dataObj.wordType);

	internal.__collections[collectionName].insert(dataObj, {w:1}, function(err, result) {
		if (err != null) {
			callback(err, null);
		} else {
			getWordByID(collectionName, dataObj._id, callback);
		}
	});
}

var addWordIfNotExists = function(collectionName, dataObj, callback)
{
	// console.log("---- lemma: " + dataObj.lemma);
	// console.log("---- wordType: " + dataObj.wordType);

	internal.__collections[collectionName].find(dataObj).toArray(function(err, items) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("----" + items);
			// console.log("---- found: " + items.length + " items");
			if (items.length == 0) {
				// console.log("---- inserting ...");
				internal.__collections[collectionName].insert(dataObj, {w:1}, function(err, result) {
					if (err != null) {
						callback(err, null);
					} else {
						// console.log("---- _id: " + dataObj._id);
						// getWordByIDAsArray(collectionName, dataObj._id, callback);	?????????
						getWordByID(collectionName, dataObj._id, callback);
					}
				});
			} else {
				for (var i = 0; i < items.length; i++) {
					var o = items[i];
					var id = o._id;
					delete o._id;
					o.id = id;
				}
				callback(null, items);
			}
		}
	});
}

var getWordByID = function(collectionName, id, callback)
{
	// console.log("retrieving: " + id);

	var idObj;
	try {
		idObj = BSONPure.ObjectID.createFromHexString("" + id);
	} catch (ex) {
		callback("Failed to parse object id!", null);
		return;
	}

	internal.__collections[collectionName].findOne({_id: idObj }, function(err, item) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("----" + item);
			if (item != null) {
				delete item._id;
				item.id = id;
				callback(null, item);
			} else {
				callback(null, null);
			}
		}
	});
}

var updateWordByID = function(collectionName, id, set, unset, callback)
{
	getWordByID(collectionName, id, function(err, storedDataObj) {
		if (err) {
			callback(err, null);
		} else {
			var idObj;
			try {
				idObj = BSONPure.ObjectID.createFromHexString("" + id);
			} catch (ex) {
				callback("Failed to parse object id!", null);
				return;
			}

			var modify = {};
			var b = false;
			if (set) {
				b = true;
				modify["$set"] = set;
			}
			if (unset) {
				b = true;
				if (__isObject(unset)) {
					var unsetGroup = {};
					for (var s in unset) {
						unsetGroup[s] = 1;
					}
					modify["$unset"] = unsetGroup;
				} else
				if (__isArray(unset)) {
					var unsetGroup = {};
					for (var i = 0; i < unset.length; i++) {
						unsetGroup[unset[i]] = 1;
					}
					modify["$unset"] = unsetGroup;
				} else {
					callback("Invalid data specified for 'unset'!", null);
					return;
				}
			}
			if (!b) {
				getWordByID(collectionName, id, callback);
				return;
			}
			// console.log(modify);
			internal.__collections[collectionName].update({ _id: idObj }, modify, function(err, result) {
				if (err != null) {
					callback(err, null);
				} else {
					getWordByID(collectionName, id, callback);
				}
			});
		}
	});
}

var setWordByID = function(collectionName, id, dataObj, callback)
{
	getWordByID(collectionName, id, function(err, storedDataObj) {
		if (err) {
			callback(err, null);
		} else {
			var idObj;
			try {
				idObj = BSONPure.ObjectID.createFromHexString("" + id);
			} catch (ex) {
				callback("Failed to parse object id!", null);
				return;
			}

			dataObj._id = idObj;

			// console.log("---- idObj: " + JSON.stringify(idObj));
			// console.log("---- collectionName: " + collectionName);
			// console.log("---- dataObj: " + JSON.stringify(dataObj));

			internal.__collections[collectionName].save(dataObj, {w:1}, function(err, result) {
				if (err != null) {
					callback(err, null);
				} else {
					// console.log("---- _id: " + dataObj._id);
					getWordByID(collectionName, id, callback);
				}
			});
		}
	});
}

var getWordByIDAsArray = function(collectionName, id, callback)
{
	// console.log("retrieving: " + id);

	var idObj;
	try {
		idObj = BSONPure.ObjectID.createFromHexString("" + id);
	} catch (ex) {
		callback("Failed to parse object id!", null);
		return;
	}

	internal.__collections[collectionName].findOne({_id: idObj}, function(err, item) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("----" + item);
			if (item != null) {
				delete item._id;
				item.id = id;
				callback(null, [ item ]);
			} else {
				callback(null, null);
			}
		}
	});
}

var getWordsByTags = function(collectionName, tagSelector, callback)
{
	// console.log("retrieving: " + tagSelector);

	internal.__collections[collectionName].find(tagSelector).toArray(function(err, items) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("----" + items);
			for (var i = 0; i < items.length; i++) {
				var o = items[i];
				var id = o._id;
				delete o._id;
				o.id = id;
				items[i] = o;
			}
			// console.log(JSON.stringify(items[0]));
			callback(null, items);
		}
	});
}

var getMetaData = function(collectionName, metaDataKey, callback)
{
	// console.log("retrieving: " + metaDataKey);

	internal.__metaCollections[collectionName].find({key: metaDataKey}).toArray(function(err, items) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log(JSON.stringify(items[0]));
			if (items.length == 0) {
				callback(null, null);
			} else {
				callback(null, items[0].value);
			}
		}
	});
}

var putMetaData = function(collectionName, metaDataKey, metaData, callback)
{
	// console.log("retrieving: " + metaDataKey);

	internal.__metaCollections[collectionName].find({key: metaDataKey}).toArray(function(err, items) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log(JSON.stringify(items[0]));
			var dataObj = {};
			dataObj.key = metaDataKey;
			dataObj.value = metaData;

			if (items.length == 0) {
				// no existing data -> insert new data
			} else {
				// existing data -> update existing data
				dataObj._id = items[0]._id;
			}

			internal.__metaCollections[collectionName].save(dataObj, {w:1}, function(err, result) {
				if (err != null) {
					callback(err, null);
				} else {
					callback(null, true);
				}
			});
		}
	});
}

var getWordsByRegEx = function(collectionName, tagNameSelector, regexValueExpression, callback)
{
	var obj = {};
	obj[tagNameSelector] = {$regex: new RegExp(regexValueExpression), $options: "i" };

	// console.log(regexValueExpression);
	// console.log(JSON.stringify(obj));

	getWordsByTags(
		collectionName,
		obj,
		callback);
}

var countWordsByTags = function(collectionName, tagSelector, callback)
{
	// console.log("retrieving: " + tagSelector);

	internal.__collections[collectionName].find(tagSelector).toArray(function(err, items) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("----" + items);
			callback(null, items.length);
		}
	});
}

var getWordIDs = function(collectionName, offset, count, callback)
{
	// console.log("retrieving: " + tagSelector);

	internal.__collections[collectionName].find({}, {skip: offset, limit: count, fields:{_id: 1}}).toArray(function(err, items) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("----" + items);
			var retItems = new Array();
			for (var i = 0; i < items.length; i++) {
				var o = items[i];
				var id = o._id;
				retItems.push(id);
			}
			callback(null, retItems);
		}
	});
}

var getCollectionInfo = function(collectionName, callback)
{
	internal.__collections[collectionName].count(function(err, countItems) {
		if (err != null) {
			callback(err, null);
		} else {
			internal.__collections[collectionName].indexes(function(err, indexes) {
				if (err) {
					callback(err, null);
				} else {
					// create collection of data we want to output, this way hiding other data we do not want to output
					var indexList = new Array();
					for (var i = 0; i < indexes.length; i++) {
						indexList.push({
							"name" : indexes[i].name,
							"key" : __returnFirstMemberName(indexes[i].key)
						});
					}
					// perform output via callback function
					callback(null, {
						"collectionName" : collectionName,
						"count" : countItems,
						"indexes" : indexList
					});
				}
			});
		}
	});
}

var createIndex = function(collectionName, fieldName, callback)
{
	internal.__collections[collectionName].ensureIndex(fieldName, {w:1}, function(err, indexName) {
		if (err != null) {
			callback(err, null);
		} else {
			callback(null, true);
		}
	});
}

var countWords = function(collectionName, callback)
{
	// console.log("retrieving: " + tagSelector);

	internal.__collections[collectionName].count(function(err, countItems) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("----" + items);
			callback(null, countItems);
		}
	});
}

var deleteWordByID = function(collectionName, id, callback)
{
	// console.log("deleting: " + id);

	var idObj;
	try {
		idObj = BSONPure.ObjectID.createFromHexString("" + id);
	} catch (ex) {
		callback("Failed to parse object id!", null);
		return;
	}

	internal.__collections[collectionName].remove({_id: idObj}, {w:1}, function(err, numberOfRemovedDocs) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("---- numberOfRemovedDocs=" + numberOfRemovedDocs);
			callback(null, numberOfRemovedDocs);
		}
	});
}

var deleteWordsByTags = function(collectionName, tagSelector, callback)
{
	// console.log("deleting: " + tagSelector);

	internal.__collections[collectionName].remove(tagSelector, {w:1}, function(err, numberOfRemovedDocs) {
		if (err != null) {
			callback(err, null);
		} else {
			// console.log("---- numberOfRemovedDocs=" + numberOfRemovedDocs);
			callback(null, numberOfRemovedDocs);
		}
	});
}

//################################################################################################################################
//################################################################################################################################
//####
//####    Initialization
//####
//################################################################################################################################
//################################################################################################################################


// define public functions

exports.init = init;
exports.addWord = addWord;
exports.getWordByID = getWordByID;
exports.updateWordByID = updateWordByID;
exports.setWordByID = setWordByID;
exports.countWordsByTags = countWordsByTags;
exports.getWordsByTags = getWordsByTags;
exports.getWordsByRegEx = getWordsByRegEx;
exports.getWordIDs = getWordIDs;
exports.deleteWordByID = deleteWordByID;
exports.deleteWordsByTags = deleteWordsByTags;
exports.addWordIfNotExists = addWordIfNotExists;
exports.listCollections = listCollections;
exports.createCollection = createCollection;
exports.deleteAllWords = deleteAllWords;
exports.countWords = countWords;
exports.destroyCollection = destroyCollection;
exports.renameCollection = renameCollection;
exports.getCollectionInfo = getCollectionInfo;
exports.createIndex = createIndex;
exports.getMetaData = getMetaData;
exports.putMetaData = putMetaData;
