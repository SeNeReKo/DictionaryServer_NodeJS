var os = require('os');
var batchflow = require('batchflow');
var url = require('url');
var jstoxml = require('jstoxml');			// https://github.com/davidcalhoun/jstoxml
var simpleAuth = require('../jk-simpleauthmongodb');

exports = module.exports

//################################################################################################################################
//################################################################################################################################
//####
//####    General
//####
//################################################################################################################################
//################################################################################################################################


var internal = {};

internal.__serverName = false;
internal.__serverVersion = false;
internal.__simpleAuth = null;
internal.__functionalServerCore = false;
internal.__config = false;
internal.__apiFunctions = {}
internal.__outputFormatters = {}


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




if (typeof __returnFirstMemberName == "undefined") {
	__returnFirstMemberName = function(object) {
		for (var s in object) return s;
		return null;
	}
}

if (typeof __isArray == "undefined") {
	__isArray = function(obj) {
		return obj.constructor === Array;
	}
}

if (typeof __isString == "undefined") {
	__isString = function(obj) {
		return obj.constructor === String;
	}
}

if (typeof __isObject == "undefined") {
	__isObject = function(obj) {
		return obj.constructor === Object;
	}
}

if (typeof __isNumber == "undefined") {
	__isNumber = function(n) {
		if ((n == null) || (n == "")) return false;
		return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
	}
}

if (typeof __isInteger == "undefined") {
	__isInteger = function(n) {
		if ((n == null) || (n == "")) return false;
		return /^-?[0-9]+$/.test(n);
	}
}

if (typeof __isFunction == "undefined") {
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

var __writeErrorResponse1 = function(request, response, errMsg, errID, details, duration) {
	response.writeHeader(500, {"Content-Type": "application/json; charset=utf-8"});
	var errObj = __createErrObj(errMsg, errID, details);
	var objWrapper = { "error" : errObj };
	if (!(typeof duration === "undefined")) {
		objWrapper["duration"] = duration;
	}
	response.write(JSON.stringify(objWrapper));
	response.end();
	return null;
}

var __writeErrorResponse2 = function(request, response, errObj, duration) {
	response.writeHeader(500, {"Content-Type": "application/json; charset=utf-8"});
	var objWrapper = { "error" : errObj };
	if (!(typeof duration === "undefined")) {
		objWrapper["duration"] = duration;
	}
	response.write(JSON.stringify(objWrapper));
	response.end();
	return null;
}

var __writeSuccessResponse = function(request, response, data, duration) {
	var objWrapper = { "success" : data };
	if (!(typeof duration === "undefined")) {
		objWrapper["duration"] = duration;
	}

	var outputType = __detectOutputTypeFromPath(request.path);

	var outputFormatter = internal.__outputFormatters[outputType];
	if (!outputFormatter) {
		response.writeHeader(200, {"Content-Type": "text/plain; charset=utf-8"});
		response.write("Implementation error: Invalid output type detected: " + outputType);
	} else {
		response.writeHeader(200, { "Content-Type": outputFormatter.mimeType + "; charset=utf-8" });
		response.write(outputFormatter.format(objWrapper));
	}
	response.end();
	return null;
}

var __createErrObj = function(errMsg, errID, details) {
	var errObj = { "errMsg" : errMsg };
	if (errID) errObj["errID"] = errID;
	if (details) errObj["details"] = details;
	return errObj;
}

var __getIPAddress = function() {
	var ifs = os.networkInterfaces().eth0;
	for (var i = 0; i < ifs.length; i++) {
		if (ifs[i].family == "IPv4") {
			return ifs[i].address;
		}
	}
	return null;
}

function ConfigFileError(message) {
	this.message = message;
}
ConfigFileError.prototype = new Error;

function ImplementationError(message) {
	if (message) {
		this.message = message;
	} else {
		this.message = "Implementation error!";
	}
}
ImplementationError.prototype = new Error;

function GeneralError(message) {
	this.message = message;
}
GeneralError.prototype = new Error;


var __verifyConfigKeyExists = function(config, iniSectionName, key) {
	if (!config[iniSectionName]) {
		console.log("ERROR: Section \"" + iniSectionName + "\" not defined in configuration!");
		throw new ConfigFileError(iniSectionName + " is missing!");
	}

	// for (var key in config[iniSectionName]) {
	// 	console.log("YY " + key + " = " + config[iniSectionName][key]);
	// }
	// console.log("XX " + config[iniSectionName]);

	if (!config[iniSectionName][key]) {
		console.log("ERROR: Undefined key in HTTP section \"" + iniSectionName + "\": \"" + key + "\"!");
		throw new ConfigFileError(iniSectionName + "|" + key + " is missing!");
	}

	return 1;
}

var __detectOutputTypeFromPath = function(apiPath) {
	if (!apiPath.startsWith("/api/")) throw new ImplementationError();
	apiPath = apiPath.substr(5);
	var i = apiPath.indexOf('/');
	if (i <= 0) throw new ImplementationError();
	return apiPath.substr(0, i);
}


var setOutputFormatter = function(formatName, formatMimeType, formatFunction) {
	if (!formatName) throw new GeneralError("formatName not specified!");
	if (!formatMimeType) throw new GeneralError("formatMimeType not specified!");
	if (!formatFunction) throw new GeneralError("formatFunction not specified!");

	internal.__outputFormatters[formatName] = Object.spawn(OutputFormatter, { "formatName" : formatName, "mimeType" : formatMimeType, "format" : formatFunction });
}

var __buildPathListAsStr = function(functionName) {
	var s = "/api/{";
	var bFirst = true;
	for (var key in internal.__outputFormatters) {
		if (bFirst) {
			bFirst = false;
		} else {
			s += "|";
		}
		s += key;
	}
	s += "}/" + functionName;
	return s;
}

var __buildPathListAsStrLong = function(functionName) {
	var s = "";
	var bFirst = true;
	for (var key in internal.__outputFormatters) {
		if (bFirst) {
			bFirst = false;
		} else {
			s += ", ";
		}
		s += "/api/" + key + "/" + functionName;
	}
	return s;
}



//################################################################################################################################
//################################################################################################################################
//####
//####    Internal Classes
//####
//################################################################################################################################
//################################################################################################################################

var OutputFormatter = {

	formatName : false,

	mimeType : false,

	format : function(outputData, response) {
		return null;
	}
}

var APIFunction = {

	apiFunctionName : false,

	verifySessionAndPrivileges : false,

	/**
	 * @return	Return <code>null</code> to indicate termination.
	 */
	getAndVerifyArgumentsFromJSONStruct : function(obj, callback) {
		if (!this.argumentDescription) {
			callback(__createErrObj("Internal error: Parsing arguments not yet implemented!", "internal"));
			return null;
		}

		var resultO = {};	// result object
		var resultA = [];	// result array

		var present = {};	// remember all arguments that are required
		for (var key in this.argumentDescription) {
			if (this.argumentDescription[key].required) present[key] = false;
		}

		for (var key in obj) {
			var value = obj[key];
			var argDescr = this.argumentDescription[key];
			if (!argDescr) {
				callback(__createErrObj("Unexpected argument: '" + key + "'", "invalidRequest"));
				return null;
			}
			if (("str" == argDescr.type) || ("string" == argDescr.type)) {
				// nothing to do
			} else
			if (("int" == argDescr.type) || ("integer" == argDescr.type)) {
				// nothing to do
			} else
			if (("float" == argDescr.type) || ("double" == argDescr.type)) {
				// nothing to do
			} else
			if (("bool" == argDescr.type) || ("boolean" == argDescr.type)) {
				// nothing to do
			} else
			if ("json" == argDescr.type) {
				// nothing to do
			} else {
				callback(__createErrObj("Internal error: Invalid argument type description for '" + key + "'", "internal"));
				return null;
			}
			present[key] = true;
			resultO[key] = value;
			resultA[argDescr.index] = value;
		}

		for (var key in present) {
			if (!present[key]) {
				callback(__createErrObj("Argument expected: ''" + key + "'", "invalidRequest"));
				return null;
			}
		}

		return [ resultA, resultO ];
	},

	/**
	 * @return	Return <code>null</code> to indicate termination.
	 */
	getAndVerifyArgumentsFromURLQuery : function(request, urlArgs, response) {
		if (!this.argumentDescription) return __writeErrorResponse1(request, response, "Internal error: No argument description defined!", "internal");

		var resultO = {};	// result object
		var resultA = [];	// result array

		var present = {};	// remember all arguments that are required
		for (var key in this.argumentDescription) {
			if (this.argumentDescription[key].required) present[key] = false;
		}

		for (var key in urlArgs) {
			var value = urlArgs[key].trim();
			if (value.length == 0) continue;
			var argDescr = this.argumentDescription[key];
			if (!argDescr) return __writeErrorResponse1(request, response, "Unexpected argument: '" + key + "'", "invalidRequest");
			// console.log(key + " - " + value);
			// console.log(key + " - " + argDescr.type);
			var orgVal = value;
			if (("str" == argDescr.type) || ("string" == argDescr.type)) {
				// nothing to do
			} else
			if (("int" == argDescr.type) || ("integer" == argDescr.type)) {
				if (!__isInteger(value)) return __writeErrorResponse1(request, response, "Argument '" + key + "' is expected to be an integer! (Value found: " + orgVal + ") A", "invalidRequest");
				value = parseInt(value);
				if (("" + value) == "NaN") return __writeErrorResponse1(request, response, "Argument '" + key + "' is expected to be an integer! (Value found: " + orgVal + ") B", "invalidRequest");
			} else
			if (("float" == argDescr.type) || ("double" == argDescr.type)) {
				if (!__isNumber(value)) __writeErrorResponse1(request, response, "Argument '" + key + "' is expected to be a floating point number! (Value found: " + orgVal + ")", "invalidRequest");
				value = parseFloat(value);
				if (("" + value) == "NaN") return __writeErrorResponse1(request, response, "Argument '" + key + "' is expected to be a floating point number! (Value found: " + orgVal + ")", "invalidRequest");
			} else
			if (("bool" == argDescr.type) || ("boolean" == argDescr.type)) {
				value = value.toLowerCase();
				if ("true" == value) value = true;
				else
				if ("false" == value) value = false;
				else {
					if (!__isInteger(value)) return __writeErrorResponse1(request, response, "Argument '" + key + "' is expected to be a boolean! (Value found: " + orgVal + ")", "invalidRequest");
					value = parseInt(value);
					if ((value == 0) || (value == -1)) value = false;
					else
					if (value == 1) value = true;
					else
						return __writeErrorResponse1(request, response, "Argument '" + key + "' is expected to be a boolean! (Value found: " + orgVal + ")", "invalidRequest");
				}
			} else
			if ("json" == argDescr.type) {
				try {
					value = JSON.parse(value);
				} catch (ee) {
					return __writeErrorResponse1(request, response, "Argument '" + key + "' is not a valid JSON object! (Value found: " + orgVal + ")", "invalidRequest");
				}
			} else {
				return __writeErrorResponse1(request, response, "Internal error: Invalid argument type description for '" + key + "'", "internal");
			}
			present[key] = true;
			resultO[key] = value;
			resultA[argDescr.index] = value;
		}

		for (var key in present) {
			if (!present[key]) {
				return __writeErrorResponse1(request, response, "Argument expected: ''" + key + "'", "invalidRequest");
			}
		}

		return [ resultA, resultO ];
	},

	__verifyArgExistsHttp : function(request, argName, arg, response) {
		if (arg) {
			return true;
		} else {
			__writeErrorResponse1(request, response, "Missing: " + argName, "invalidRequest");
			return false;
		}
	},

	__verifyArgExistsJSON : function(argName, arg, callback) {
		if (arg) {
			return true;
		} else {
			callback({ "errMsg" : "Missing: '" + argName + "'", "errID": "invalidRequest" }, null);
			return false;
		}
	},

	exec : function(dict, argsArray, argsObject, callback) {
		callback("Executing " + this.apiFunctionName + " not yet implemented!", null);
	},

	__verifyPrivilegeJSON : function(userObj) {
		if (!internal.__config.auth.enabled) return null;
		if (!this.verifySessionAndPrivileges) return null;
		if (userObj && this.apiFunctionName && userObj.privileges && userObj.privileges[this.apiFunctionName]) {
			return null;
		} else {
			return __createErrObj("Insufficient privileges to call API function '" + this.apiFunctionName + "'!", "insufficientPrivileges");
		}
	},

	callfunctionalServerCoreFunctionHttp : function(request, response) {
		// console.log(">>>> API function called: " + this.apiFunctionName);
		// console.log(">> HTTP-Request: " + request.url);

		var parsedQuery = url.parse(request.url, true).query;

		var userObj = null;
		if (this.verifySessionAndPrivileges && internal.__simpleAuth) {
			// retrieve session ID

			var sid = parsedQuery.sid;
			if (!this.__verifyArgExistsHttp(request, "sid", sid, response)) return;

			// verify if session is valid

			userObj = internal.__simpleAuth.verify(sid);
			if (userObj == null) {
				__writeErrorResponse1(request, response, "Session ID is invalid.", "invalidSessionID");
				return;
			}

			var privCheckErrMsg = this.__verifyPrivilegeJSON(userObj);
			if (privCheckErrMsg) {
				__writeErrorResponse2(request, response, privCheckErrMsg);
				return;
			}

			delete parsedQuery.sid;
		}

		var argsObject;
		var argsArray;
		if (!this.argumentDescription) {
			__writeErrorResponse1(request, response, "Internal error: Argument description is missing!", "internal");
			return;
		}
		{
			var x = this.getAndVerifyArgumentsFromURLQuery(request, parsedQuery, response);
			if (x == null) return;
			argsArray = x[0];
			argsObject = x[1];
		}

		var tStart = new Date().getTime();

		this.exec(internal.__functionalServerCore, argsArray, argsObject, userObj, function(err, resultData) {
			var tEnd = new Date().getTime();
			var tDuration = tEnd - tStart;

			if (err) {
				// console.log("--Error: " + err);
				// console.log("--response: " + response);

				var errMsg;
				if ((err.error !== null) & (err.error.errMsg !== null)) errMsg = err.error.errMsg;
				else errMsg = "Error encountered executing " + this.apiFunctionName;
				var errID;
				if ((err.error !== null) & (err.error.errID !== null)) errID = err.error.errID;
				else errID = "general";
				var details;
				if ((err.error !== null) & (err.error.details !== null)) details = err.error.details;
				else details = err;

				__writeErrorResponse1(request, response, errMsg, errID, details, tDuration);
			} else {
				// console.log(">>>> " + resultData);
				__writeSuccessResponse(request, response,
					resultData,
					tDuration);
			}
		})
	},

	callfunctionalServerCoreFunctionCDone : function(objArgs, userObj, doneCallback) {
		// console.log(">>>> API function called: " + this.apiFunctionName);

		if (internal.__config.auth.enabled) {
			var privCheckErrMsg = this.__verifyPrivilegeJSON(userObj);
			if (privCheckErrMsg) {
				doneCallback(privCheckErrMsg.error, null);
				return;
			}
		}

		if (!this.argumentDescription) {
			callback(__createErrObj(response, "Internal error: Argument description is missing!", "internal"), null);
			return;
		}
		var argsObject;
		var argsArray;
		// console.log(">>>> " + this.apiFunctionName + " - " + JSON.stringify(this.argumentDescription) + " - " + JSON.stringify(objArgs));
		{
			var x = this.getAndVerifyArgumentsFromJSONStruct(objArgs, doneCallback);
			if (x == null) return;
			argsArray = x[0];
			argsObject = x[1];
		}

		this.exec(internal.__functionalServerCore, argsArray, argsObject, userObj, function(err, resultData) {
			if (err) {
				// console.log("--Error: " + err);
				// console.log("--response: " + response);
				doneCallback({
					"errMsg": "Error encountered executing " + this.apiFunctionName,
					"errID": "general",
					"details": err
					}, null);
			} else {
				// console.log(">>>> " + resultData);
				doneCallback(null, resultData);
			}
		})

	}

}

//################################################################################################################################
//################################################################################################################################
//####
//####    Internal Data Structures
//####
//################################################################################################################################
//################################################################################################################################

var defaultAPIFunctions = {

	// ----------------------------------------------------------------

	/*
	"argtest" : {
		argumentDescription : {
				"a" : {		"type" : "str",			"required" : true		},
				"b" : {		"type" : "int",			"required" : true		},
				"c" : {		"type" : "json",		"required" : true		}
		},
		exec : function(functionalServerCore, argsArray, argsObject, userObj, callback) {
			callback(null, { "a" : argsArray[0], "b" : argsArray[1], "c" : argsArray[2] });
		}
	},
	*/

	// ----------------------------------------------------------------

	"noop" : {
		argumentDescription : {
		},
		exec : function(functionalServerCore, argsArray, argsObject, userObj, callback) {
			callback(null, true);
		}
	},

	// ----------------------------------------------------------------

	"batch" : {
		argumentDescription : {
				"data" : {		"type" : "json",			"required" : true		},
		},
		exec : function(functionalServerCore, argsArray, argsObject, userObj, callback) {

			var batchCalls = argsArray[0].commands;
			var responseData = new Array();
			for (var i = 0; i < batchCalls.length; i++) {
				for (var functionName in batchCalls[i]) {
					responseData.push({ functionName : {}});
					break;
				}
			}

			// ----

			batchflow(batchCalls).sequential().each(function(i, item, done) {

				var functionName = __returnFirstMemberName(item);

				var apiObj = internal.__apiFunctions[functionName];
				if (!apiObj) {
					var ret = new Object();
					ret[functionName] = { "error" : { "errMsg" : "No such function: " + functionName, "errID": "invalidRequest" }};
					done(ret);
				} else {
					internal.__apiFunctions[functionName].callfunctionalServerCoreFunctionCDone(item[functionName], userObj, function(err, result) {
						var ret = new Object();
						if (err) {
							ret[functionName] = {
								"error" : err
								};
						} else {
							ret[functionName] = {
								"success" : result
								};
						}
						done(ret);
					})
				}

			}).end(function(processingResults) {
				callback(null, processingResults);
			});

		}
	},

	// ----------------------------------------------------------------

	"login" : {
		argumentDescription : {
				"u" : {		"type" : "str",			"required" : true		},
				"p" : {		"type" : "str",			"required" : true		},
		},
		exec : function(functionalServerCore, argsArray, argsObject, userObj, callback) {
			if (internal.__simpleAuth) {
				internal.__simpleAuth.login(argsArray[0], argsArray[1], function(err, result) {
					if (err != null) {
						callback({ "errMsg" : "Authentication failed!", "errID": "authError", "details" : err }, null);
					} else
					if (result == null) {
						callback({ "errMsg" : "Authentication failed!", "errID": "authError" }, null);
					} else {
						callback(null, { "sid" : result.sid });
					}
				})
			} else {
				callback({ "errMsg" : "No authentication required!", "errID": "noAuthRequired" }, null);
			}
		}
	},

	// ----------------------------------------------------------------

	"verifysession" : {
		argumentDescription : {
				"sid" : {		"type" : "str",			"required" : true		},
		},
		exec : function(functionalServerCore, argsArray, argsObject, userObj, callback) {
			if (internal.__simpleAuth) {
				var userObj = internal.__simpleAuth.verify(argsArray[0]);
				if (userObj == null) {
					callback(null, "invalid");
				} else {
					callback(null, "valid");
				}
			} else {
				callback(null, "valid");
			}
		}
	},

	// ----------------------------------------------------------------

	"listprivileges" : {
		argumentDescription : {
		},
		verifySessionAndPrivileges: true,
		exec : function(functionalServerCore, argsArray, argsObject, userObj, callback) {
			var ret = new Array();
			for (var key in userObj.privileges) {
				ret.push(key);
			}
			callback(null, ret);
		}
	},

	// ----------------------------------------------------------------

	"info" : {
		argumentDescription : {
		},
		exec : function(functionalServerCore, argsArray, argsObject, userObj, callback) {
			var retObj = {
					"server" : internal.__serverName,
					"version" : internal.__serverVersion,
					"auth" : {
						"enabled" : internal.__config.auth.enabled
					},
					"api" : {
						"functions" : [],
						"outputFormats" : []
					},
				}

			for (var key in internal.__apiFunctions) {
				retObj.api.functions.push(key);
			}
			retObj.api.functions.sort();

			for (var key in internal.__outputFormatters) {
				retObj.api.outputFormats.push(key);
			}
			retObj.api.outputFormats.sort();

			callback(null, retObj);
		}
	},

}


//################################################################################################################################
//################################################################################################################################
//####
//####    Internal Functions
//####
//################################################################################################################################
//################################################################################################################################

var batchCall = function(request, response) {

	var userObj = null;
	if (internal.__simpleAuth) {
		// retrieve session ID

		var parsedQuery = url.parse(request.url, true).query;
		var sid = parsedQuery.sid;
		if (!sid) sid = request.body.sid;

		if (!sid) {
			__writeErrorResponse1(request, response, "Missing: 'sid'", "noSessionID");
			return;
		}

		// verify if session is valid

		userObj = internal.__simpleAuth.verify(sid);
		if (userObj == null) {
			__writeErrorResponse1(request, response, "Session ID is invalid.", "invalidSessionID");
			return;
		}
	}

	// ----

	// console.log(batchCalls.length + " batch calls to process!");
	var batchCalls = request.body.commands;
	var responseData = new Array();
	for (var i = 0; i < batchCalls.length; i++) {
		for (var functionName in batchCalls[i]) {
			responseData.push({ functionName : {}});
			break;
		}
	}

	// ----

	var tStart = new Date().getTime();

	batchflow(batchCalls).sequential().each(function(i, item, done) {

		var functionName = __returnFirstMemberName(item);

		var apiObj = internal.__apiFunctions[functionName];
		if (!apiObj) {
			var ret = new Object();
			ret[functionName] = { "error" : { "errMsg" : "No such function: " + functionName, "errID": "invalidRequest" }};
			done(ret);
		} else {
			internal.__apiFunctions[functionName].callfunctionalServerCoreFunctionCDone(item[functionName], userObj, function(err, result) {
				var ret = new Object();
				if (err) {
					ret[functionName] = {
						"error" : err
						};
				} else {
					ret[functionName] = {
						"success" : result
						};
				}
				done(ret);
			})
		}

	}).end(function(processingResults) {
		var tEnd = new Date().getTime();
		var tDuration = tEnd - tStart;

		__writeSuccessResponse(request, response, processingResults, tDuration);
	});
}


/**
 * Call this function once to initialize the server.
 */
var start = function(app, config, serverName, serverVersion, functionalServerCore, namePrefixAPIFunctionMap,
	myOutputFormats)
{
	// namePrefix
	// myApiFunctions

	console.log("Initializing API framework ...");

	__verifyConfigKeyExists(config, "http", "wwwroot");
	__verifyConfigKeyExists(config, "http", "port");
	__verifyConfigKeyExists(config, "dbserver", "dbHost");
	__verifyConfigKeyExists(config, "dbserver", "dbPort");
	__verifyConfigKeyExists(config, "dbserver", "dbName");
	__verifyConfigKeyExists(config, "auth", "enabled");

	if (config.auth.enabled) {
		__verifyConfigKeyExists(config, "auth", "sessionTimeOut");
		__verifyConfigKeyExists(config, "auth", "sidLength");
		__verifyConfigKeyExists(config, "auth", "dbHost");
		__verifyConfigKeyExists(config, "auth", "dbPort");
		__verifyConfigKeyExists(config, "auth", "dbName");
		__verifyConfigKeyExists(config, "auth", "dbColName");

		simpleAuth.init(config.auth, function(err, result) {
			if (!result) {
				console.log(err);
				process.exit(1);
			}
		});
		internal.__simpleAuth = simpleAuth;
	} else {
		internal.__simpleAuth = null;
	}

	internal.__serverName = serverName;
	internal.__serverVersion = serverVersion;
	internal.__functionalServerCore = functionalServerCore;
	internal.__config = config;
	internal.__app = app;

	if (myOutputFormats) {
		for (var myOutputFormatName in myOutputFormats) {
			var customOutputFormat = myOutputFormats[myOutputFormatName];
			if (!customOutputFormat) continue;
			if (!__isObject(customOutputFormat)) throw new GeneralException("Custom output format '" + myOutputFormatName + "' is not an object!");

			var formatMimeType = customOutputFormat["mimeType"];
			if (!__isString(formatMimeType)) throw new GeneralException("Invalid property 'mimeType' of custom output format '" + myOutputFormatName + "'!");
			var formatFunction = customOutputFormat["format"];
			if (!__isFunction(formatFunction)) throw new GeneralException("Invalid property 'format' of custom output format '" + myOutputFormatName + "'!");
			setOutputFormatter(myOutputFormatName, formatMimeType, formatFunction);
		}
	}

	for (var keyx in defaultAPIFunctions) {
		var key = "core_" + keyx;

		var obj = defaultAPIFunctions[keyx];
		obj["apiFunctionName"] = key;

		var index = 0;
		for (var argName in obj.argumentDescription) {
			var argDef = obj.argumentDescription[argName];
			argDef["index"] = index;
			index++;
		}

		var obj2 = Object.spawn(APIFunction, obj);
		internal.__apiFunctions[key] = obj2;

		(function(key, obj2) {
			var f = function(request, response) { obj2.callfunctionalServerCoreFunctionHttp(request, response) };
			console.log("Defining default URL path GET-handler(s): " + __buildPathListAsStr(key));
			for (var outputFormat in internal.__outputFormatters) {
				app.get("/api/" + outputFormat + "/" + key, f);
			}
		})(key, obj2);
	}

	console.log("Defining default URL path POST-handler: /api/json/core_batch");
	app.post('/api/json/core_batch', batchCall);

	for (var namePrefix in namePrefixAPIFunctionMap) {
		var myApiFunctions = namePrefixAPIFunctionMap[namePrefix];

		for (var keyx in myApiFunctions) {
			var key = namePrefix + "_" + keyx;

			var obj = myApiFunctions[keyx];
			obj["apiFunctionName"] = key;

			var index = 0;
			for (var argName in obj.argumentDescription) {
				var argDef = obj.argumentDescription[argName];
				argDef["index"] = index;
				index++;
			}

			var obj2 = Object.spawn(APIFunction, obj);
			internal.__apiFunctions[key] = obj2;

			(function(key, obj2) {
				var f = function(request, response) { obj2.callfunctionalServerCoreFunctionHttp(request, response) };
				console.log("Defining custom URL path GET-handler(s): " + __buildPathListAsStr(key));
				for (var outputFormat in internal.__outputFormatters) {
					app.get("/api/" + outputFormat + "/" + key, f);
				}
			})(key, obj2);
		}
	}

	console.log("API framework initialization completed. (Silent asynchroneous initialization aspects may still continue in the background.)");

	setTimeout(function() {
		app.listen(parseInt(config.http.port));
		console.log("Web server is now running on " + __getIPAddress() + ":" + config.http.port);
	}, 500);
}

//################################################################################################################################
//################################################################################################################################
//####
//####    Initialization
//####
//################################################################################################################################
//################################################################################################################################

// define outputters

setOutputFormatter("json", "application/json", function(jsonData) {
	return JSON.stringify(jsonData)
});

setOutputFormatter("jsonpretty", "application/json", function(jsonData) {
	return JSON.stringify(jsonData, null, 4);
});

setOutputFormatter("xml", "application/xml", function(jsonData) {
	return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><result>" + jstoxml.toXML(jsonData) + "</result>";
});

setOutputFormatter("xmlpretty", "application/xml", function(jsonData) {
	return jstoxml.toXML({ "result" : jsonData }, {header: true, indent: '\t'});
});

// define public functions

exports.start = start;
exports.verifyKeyExists = __verifyConfigKeyExists;

