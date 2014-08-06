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



function getJSON(path, callback)
{
	var options = {
		host: '127.0.0.1',
		port: config.lemmatizingserver.localPort,
		path: path,
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	};

    // console.log("rest::getJSON");
    // console.log(">> getJSON: " + path);

    var prot = options.port == 443 ? https : http;
    var req = prot.request(options, function(res)
    {
        var output = '';
        // console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
			// console.log(output);
            var obj = JSON.parse(output);
			if (res.statusCode == 200) {

				/* FUTURE IMPLEMENTATION
				if (obj.success) {
					callback(null, obj);
				} else
				if (obj.error && obj.error.errMsg) {
					callback(obj.error.errMsg, null);
				} else {
					callback("Unknown error!", null);
				} */

				// OLD IMPLEMENTATION
				callback(null, obj);

			} else {
				// TODO: pass information about error
				// callback("Error HTTP " + res.statusCode, null);
				callback(obj, null);
			}
        });
    });

    req.on('error', function(err) {
		callback(err.message, null);
    });

    req.end();
};



exports.apiFunctions = {

	// ----------------------------------------------------------------

	"morphgen": {
		argumentDescription : {
				"word"		: {		"type" : "str",			"required" : true		},
				"restrict"	: {		"type" : "json",		"required" : false		},
				"gramGrp"	: {		"type" : "json",		"required" : false		},
		},
		apiFunctionName: "morphgen",
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			var req = "/api/json/morphgen?word=" + encodeURIComponent(argsArray[0]);
			if (argsArray[1]) req += "&restrict=" + JSON.stringify(argsArray[1]);
			if (argsArray[2]) req += "&gramGrp=" + JSON.stringify(argsArray[2]);
			getJSON(req, callback);
		}
	},

	"morphgenbyid": {
		argumentDescription : {
				"id"		: {		"type" : "str",			"required" : true		},
		},
		apiFunctionName: "morphgenbyid",
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			var req = "/api/json/morphgen?id=" + encodeURIComponent(argsArray[0]);
			getJSON(req, callback);
		}
	},

	// ----------------------------------------------------------------

	"morphana": {
		argumentDescription : {
				"word"	: {		"type" : "str",			"required" : true		},
		},
		apiFunctionName: "morphana",
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			getJSON("/api/json/morphana?word=" + encodeURIComponent(argsArray[0]), callback);
		}
	},

	// ----------------------------------------------------------------

	"morphanand": {
		argumentDescription : {
				"word"	: {		"type" : "str",			"required" : true		},
		},
		apiFunctionName: "morphanand",
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			getJSON("/api/json/morphanand?word=" + encodeURIComponent(argsArray[0]), callback);
		}
	},

	// ----------------------------------------------------------------

	"lemma": {
		argumentDescription : {
				"word"	: {		"type" : "str",			"required" : true		},
		},
		apiFunctionName: "lemma",
		verifySessionAndPrivileges: true,
		exec : function(dict, argsArray, argsObject, userObj, callback) {
			getJSON("/api/json/lemma?word=" + encodeURIComponent(argsArray[0]), callback);
		}
	}

}



