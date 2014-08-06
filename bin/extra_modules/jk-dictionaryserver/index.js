var apiServerCore = require('../jk-apiservercore');

exports = module.exports

// internal variables

var internal = {};


//################################################################################################################################
//################################################################################################################################
//####
//####    Public Functions
//####
//################################################################################################################################
//################################################################################################################################


exports.apiFunctions = {

	// ----------------------------------------------------------------

	"listcollections": {
		argumentDescription : {
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.listCollections(callback);
		}
	},

	// ----------------------------------------------------------------
	// ----------------------------------------------------------------
	// ----------------------------------------------------------------

	"getwordbyid" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"id"		: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.getWordByID(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"updatewordbyid" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"id"		: {		"type" : "str",			"required" : true		},
				"set"		: {		"type" : "json",		"required" : false		},
				"unset"		: {		"type" : "json",		"required" : false		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.updateWordByID(argsArray[0], argsArray[1], argsArray[2], argsArray[3], callback);
		}
	},

	// ----------------------------------------------------------------

	"setwordbyid" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"id"		: {		"type" : "str",			"required" : true		},
				"data"		: {		"type" : "json",		"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.setWordByID(argsArray[0], argsArray[1], argsArray[2], callback);
		}
	},

	// ----------------------------------------------------------------

	"getwordsbytags" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"filter"	: {		"type" : "json",		"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.getWordsByTags(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"getwordsbyregex" : {
		argumentDescription : {
				"colname"		: {		"type" : "str",			"required" : true		},
				"tagname"		: {		"type" : "str",			"required" : true		},
				"regexvalue"	: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.getWordsByRegEx(argsArray[0], argsArray[1], argsArray[2], callback);
		}
	},

	// ----------------------------------------------------------------

	"countwordsbytags" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"filter"	: {		"type" : "json",		"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.countWordsByTags(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"getwordids" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"ofs"		: {		"type" : "int",			"required" : true		},
				"count"		: {		"type" : "int",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.getWordIDs(argsArray[0], argsArray[1], argsArray[2], callback);
		}
	},

	// ----------------------------------------------------------------

	"countwords" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.countWords(argsArray[0], callback);
		}
	},

	// ----------------------------------------------------------------

	"getcollectioninfo" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.getCollectionInfo(argsArray[0], callback);
		}
	},

	// ----------------------------------------------------------------

	"createindex" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"fieldname"	: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.createIndex(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"addword" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"data"		: {		"type" : "json",		"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.addWord(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"addwordifnotexists" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"data"		: {		"type" : "json",		"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.addWordIfNotExists(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"deletewordbyid" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"id"		: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.deleteWordByID(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"deletewordsbytags": {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"filter"	: {		"type" : "json",		"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.deleteWordsByTags(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"deleteallwords" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.deleteAllWords(argsArray[0], callback);
		}
	},

	// ----------------------------------------------------------------

	"createcollection": {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.createCollection(argsArray[0], callback);
		}
	},

	// ----------------------------------------------------------------

	"renamecollection": {
		argumentDescription : {
				"colname"		: {		"type" : "str",			"required" : true		},
				"newcolname"	: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.renameCollection(argsArray[0], argsArray[1], callback);
		}
	},

	// ----------------------------------------------------------------

	"destroycollection": {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.destroyCollection(argsArray[0], callback);
		}
	},

	// ----------------------------------------------------------------

	"getmetadata" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"key"		: {		"type" : "str",			"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.getMetaData(argsArray[0], argsArray[1], callback);
		}
	},


	// ----------------------------------------------------------------

	"putmetadata" : {
		argumentDescription : {
				"colname"	: {		"type" : "str",			"required" : true		},
				"key"		: {		"type" : "str",			"required" : true		},
				"value"		: {		"type" : "json",		"required" : true		},
		},
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			dict.putMetaData(argsArray[0], argsArray[1], argsArray[2], callback);
		}
	}

}



