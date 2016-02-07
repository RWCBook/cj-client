/*******************************************************
 * TPS - Task Processing Service
 * representation router (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

// handles internal representation routing (based on conneg)

// load representors
//var html = require('./representors/html.js');
var json = require('./representors/json.js');
var haljson = require('./representors/haljson.js');
var wstljson = require('./representors/wstljson.js');
var siren = require('./representors/siren.js');
var cj = require('./representors/cj.js');

var defaultFormat = "application/vnd.collection+json";

module.exports = main;

function main(object, mimeType, root) {
  var doc;

  // clueless? assume JSON
  if (!mimeType) {
    mimeType = defaultFormat;
  }

  // dispatch to requested representor
  switch (mimeType.toLowerCase()) {
    case "application/vnd.wstl+json":
      doc = wstljson(object, root);
      break;
    case "application/json":
      doc = json(object, root);
      break;
    case "application/vnd.hal+json":
      doc = haljson(object, root);
      break;
    case "application/vnd.siren+json":
      doc = siren(object, root);
      break;  
    case "application/vnd.collection+json":
      doc = cj(object, root);
      break;  
    default:
      doc = cj(object, root);
      break;
  }

  return doc;
}

// EOF

