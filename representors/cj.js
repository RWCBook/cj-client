/*******************************************************
 * task service implementation
 * cj representor (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

var urit = require('uritemplate');
var g = {};
g.tvars = {};

// json representor
module.exports = cj;

function cj(object, root) {
  var rtn;
  
  rtn = {};
  rtn.collection = {};
  rtn.collection.version = "1.0";

  for(var o in object) {
    g.tvars = {}; // clear item state
    rtn.collection.href = root+"/"+o+"/".replace(/^\/\//,"http://")||"";
    rtn.collection.title = getTitle(object[o]);
    rtn.collection.content = getContent(object[o]);
    rtn.collection.links = getLinks(object[o].actions);
    rtn.collection.items = getItems(object[o],root);
    rtn.collection.queries = getQueries(object[o].actions);
    rtn.collection.template = getTemplate(object[o].actions);
  
    // move template href to document level
    if(rtn.collection.template.href) {
      rtn.collection.href = rtn.collection.template.href;
      delete rtn.collection.template.href;
    }
    
    // handle any error
    if(object.error) {
      rtn.collection.error = getError(object.error);
    }
  }
  // send results to caller
  return JSON.stringify(rtn, null, 2);
}

// belt out the title
function getTitle(obj) {
  return obj.title||"Cj Representor";
}

// handle any content in the response
function getContent(obj) {
  var rtn;
  
  if(obj.content) {
    rtn = obj.content;
  }
  else {
    rtn = {};
  }
  return rtn;
}

// get top-level links
function getLinks(obj, root, target, tvars) {
  var link, rtn, tgt, i, x, tmpl, url;

  rtn = [];
  if(Array.isArray(obj)!==false) {
    for(i=0,x=obj.length;i<x;i++) {
      link = obj[i];
      if(link.type==="safe" && 
        link.target.indexOf("app")!==-1 && 
        link.target.indexOf("cj")!==-1) 
      {
        if(!link.inputs) {
          tpl = urit.parse(link.href);
          url = tpl.expand(tvars);
          rtn.push({
            href: url.replace(/^\/\//,"http://"),
            rel: link.rel.join(" ")||"",
            prompt: link.prompt||""
          });
        }
      }
    }
  }
  return rtn;
}

// get list of items 
function getItems(obj, root) {
  var coll, temp, item, data, links, rtn, i, x, j, y;
  
  rtn = [];
  coll = obj.data;
  if(coll && Array.isArray(coll)!==false) {
    for(i=0,x=coll.length;i<x;i++) {
      temp = coll[i];

      // create item & link
      item = {};
      link = getItemLink(obj.actions);
      if(link) {
        item.rel = (Array.isArray(link.rel)?link.rel.join(" "):link.rel);
        item.href = link.href;
        if(link.readOnly===true) {
          item.readOnly="true";
        }
      }
      
      // add item properties
      tvars = {}
      data = [];
      for(var d in temp) {
        if(d!=="meta") {
          data.push({name : d, value : temp[d], prompt : d});
          tvars[d] = temp[d];
        }
      }
      item.data = data;
      
      // resolve URL template
      tpl = urit.parse(link.href);
      url = tpl.expand(tvars);
      item.href = url;

      // share item set for others
      if(coll.length===1) {
        g.tvars = tvars;
      }
      
      // add any item-level links
      links = getItemLinks(obj.actions, tvars);
      if(Array.isArray(links) && links.length!==0) {
        item.links = links;
      }

      rtn.push(item);
    }
  }
  return rtn;
}

// get query templates
function getQueries(obj) {
  var data, d, query, q, rtn, i, x, j, y;
  
  rtn = [];
  if(Array.isArray(obj)!==false) {
    for(i=0,x=obj.length;i<x;i++) {
      query = obj[i];
      if(query.type==="safe" && 
        query.target.indexOf("list")!==-1 && 
        query.target.indexOf("cj") !==-1)
      {
        q = {};
        q.rel = query.rel.join(" ");
        q.href = query.href.replace(/^\/\//,"http://")||"";
        q.prompt = query.prompt||"";
        data = [];
        for(j=0,y=query.inputs.length;j<y;j++) {
          d = query.inputs[j];
          data.push({name:d.name||"input"+j,value:d.value||"",prompt:d.prompt||d.name})
        }
        q.data = data;
        rtn.push(q);
      }
    }
  }
  return rtn;
}

// get the add template
function getTemplate(obj) {
  var data, temp, field, rtn, tpl, url, d, i, x, j, y;
  
  rtn = {};
  data = [];
  
  if(Array.isArray(obj)!==false) {
    for(i=0,x=obj.length;i<x;i++) {
      if(obj[i].target.indexOf("cj-template")!==-1) {
        temp = obj[i];
        
        isAdd=obj[i].target.indexOf("add")!==-1;
        
        // build template
        rtn.prompt = temp.prompt;
        rtn.rel = temp.rel.join(" ");
        rtn.href = temp.href;
        
        // fix up template vars
        if(g.tvars) {
          tpl = urit.parse(rtn.href);
          url = tpl.expand(g.tvars);
          rtn.href = url;
        }
        
        // emit data elements
        data = [];
        for(j=0,y=temp.inputs.length;j<y;j++) {
          d = temp.inputs[j];
          field = {
            name:d.name||"input"+j,
            value:(isAdd===true?d.value:g.tvars[d.name])||"",
            prompt:d.prompt||d.name,
            required:d.required||false,
            readOnly:d.readOnly||false,
            patttern:d.pattern||""
          };
          data.push(field);
        }
      }
    }
  }
  
  rtn.data = data;
  
  return rtn;
}

// get item-level links
function getItemLinks(obj, tvars) {
  var data, temp, coll, rtn, tpl, url, d, i, x, j, y;
  
  rtn = {};
  coll = [];
  
  if(Array.isArray(obj)!==false) {
    for(i=0,x=obj.length;i<x;i++) {
      if(obj[i].target.indexOf("item")!==-1 && 
        obj[i].target.indexOf("read")!==-1 &&
        obj[i].target.indexOf("cj")!==-1
      ) 
      {
        temp = obj[i];
        rtn = {};
        rtn.prompt = temp.prompt;
        rtn.rel = temp.rel.join(" ");
        rtn.href = temp.href;

        tpl = urit.parse(rtn.href);
        url = tpl.expand(tvars);
        rtn.href = url;
        
        coll.push(rtn);
      }
    }
  }
  return coll;
}

// get special link info for each item
function getItemLink(obj) {
  var data, temp, rtn, d, i, x, j, y;
  
  rtn = {};
  data = [];
  
  if(Array.isArray(obj)!==false) {
    for(i=0,x=obj.length;i<x;i++) {
      if(obj[i].target.indexOf("item")!==-1 && 
        obj[i].target.indexOf("href")!==-1 &&
        obj[i].target.indexOf("cj")!==-1
      ) 
      {
        temp = obj[i];
        rtn.prompt = temp.prompt;
        rtn.rel = temp.rel.join(" ");
        rtn.href = temp.href;
        rtn.readOnly = temp.target.indexOf("ro")!==-1;
        break;
      }
    }
  }
  return rtn;
}

// get any error info
function getError(obj) {
  var rtn = {};

  rtn.title = "Error";
  rtn.message = (obj.message||"");
  rtn.code = (obj.code||"");
  rtn.url = (obj.url||"");
  
  return rtn;
}
// EOF

