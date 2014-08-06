#!/usr/local/bin/node

var express = require('express');
var app = express();
var util = require('util')
var exec = require('child_process').exec;
var fs = require("fs");
var crypto = require('crypto');
var url = require('url');
var os = require('os');
var functionalServerCore = require('./extra_modules/jk-dictionarybackend');
var batchflow = require('batchflow');
var ini = require('ini');							// https://npmjs.org/package/ini
var apiServerCore = require('./extra_modules/jk-apiservercore');
var dictionaryServer = require('./extra_modules/jk-dictionaryserver');
var paliLemmatizingServer = require('./extra_modules/jk-palilemmatizingserver');
var http = require("http");
var https = require("https");


var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'))

if (!apiServerCore.verifyKeyExists(config, "lemmatizingserver", "localPort")) process.exit(1);

/*
if (!__verifyKeyExists(config.http, "wwwroot")) process.exit(1);
if (!__verifyKeyExists(config.http, "port")) process.exit(1);
if (!__verifyKeyExists(config.dbserver, "dbHost")) process.exit(1);
if (!__verifyKeyExists(config.dbserver, "dbPort")) process.exit(1);
if (!__verifyKeyExists(config.dbserver, "dbName")) process.exit(1);
if (!__verifyKeyExists(config.auth, "enabled")) process.exit(1);
*/

functionalServerCore.init(config.dbserver, "dictd_", "dictm_", function(err, result) {
	if (!result) {
		console.log(err);
		process.exit(1);
	}
});

app.use(express.static(config.http.wwwroot));
app.use(express.bodyParser());




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
function __writeResponse(response, errMsg, errID)
{
	response.writeHeader(500, {"Content-Type": "text/plain"});
	var errObj = __createErrObj(errMsg, errID);
	response.write(JSON.stringify({ "error" : errObj }));
	response.end();
	return null;
}

function __createErrObj(errMsg, errID)
{
	var errObj = { "errMsg" : errMsg };
	if (errID) errObj["errID"] = errID;
	return errObj;
}
*/




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



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




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var index = function(request, response) {
	response.send('Hello World');
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.get('/', index);
app.get('/index.html', index);

apiServerCore.start(app, config, "dictserver", "1.0.0", functionalServerCore, {
	"dict" : dictionaryServer.apiFunctions,
	"pmg" : paliLemmatizingServer.apiFunctions
}, null);

