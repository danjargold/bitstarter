#!/usr/bin/env node

/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var util    = require('util');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT= "checks.json";
var URL_DEFAULT = "";
//"http://fierce-reaches-1073.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); 
	//Exit with exit code 1='failure'. Default is 0='success
    }
    return instr;
};

var assertURLExists = function(inURL) {
    var instr = inURL.toString();
    restler.get(instr).on('complete', function(result, response) {
	if (result instanceof Error) {
	    console.error('Error (getting URL)): ' + util.format(response.message) );
	    this.retry(5000);
	    //process.exit(1);
	} else {
//	    console.log(result); // used for debugging
	}		  
    });
    return instr;
}

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile)); 
    // reads in & loads the HTML
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
    // readin and convert JSON str->JS object 
};
 
var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    //$ is valid identifier. but usually signifies
    //machine generated code and thus should be reserved for that
    var checks = loadChecks(checksfile).sort();
    // sort() sorts an array alphabetically
    var out = {};
    for (var ii in checks) {
	var present = $(checks[ii]).length > 0;
	//$(x) searches within $ for x
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // workaround for commander.js issue
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) { 
    // obtaining the input args. Assigned to variable names follwing -- 
    // ('checks' and 'file' from --checks (or -c) and --file (or -f))
    program
    	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    	.option('-u, --url <some_url>', 'URL at which file can be downloaded', clone(assertURLExists), URL_DEFAULT)
	.parse(process.argv);
    if (!program.url) {
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	//converts JS object->JSON string.  
	// JSON.stringify is opposite of JSON.parse (JSON string->JS object)                                 
	// replacer='null' means its unused but need null to pass 3rd arg (can be fn/array to                
	// transform the results. space=4 - returned text isindented by 4 spaces at each level               
	console.log(outJson);
    } else {
	restler.get(program.url).on('complete', function(result, response) {
	
	    //Saving resulting html to file    
	    var urlFile = "urlFile.html";
            // create file if it doesnt exist ('w')    
            fs.openSync(urlFile, 'w');                                                       
            fs.writeFileSync(urlFile, result);                                
            
	    var checkJson = checkHtmlFile(urlFile, program.checks);
            var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
	});
    } 
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
