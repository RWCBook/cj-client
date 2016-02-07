/*******************************************************
 * siren-json representor 
 * siren representor (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Motown Classics Gold (2005)
 *******************************************************/

/*
  REFERENCE:
    https://github.com/kevinswiber/siren
    
  DEPENDS:
    - has fatal dependency to transitions.js
    
  HACKS:
    - Siren supports "type"(DATA) for fields. 
      transitions inputs don't currently carry a data type.
    - Siren supports "type"(IANA) for links and actions. 
      transitions don't currently have this.
    
  ISSUES:
    - emits "entities" for collections & no root properties. 
      a single data record causes it to emit an "entity" and no "entities"
    - doesn't support links within subentities
*/

module.exports = siren;

// dependencies
var utils = require('../connectors/utils.js');

// defaults
var g = {};
g.ctype = "application/x-www-form-urlencoded";
g.atype = "application/vnd.siren+json";

// emit valid siren body
function siren(object, root) {
  var siren;
  
  siren = {};
  root = root.replace(/^\/\//,"http://");
  
  for(var o in object) {
    if(!siren.class) {
      siren.class = [];
    }
    siren.class.push(o);
    
    if(o==="error") {
      siren = getError(siren, object[o], o);
    }
    
    if(object[o].data) {
      if(object[o].data.length===1) {
        siren = getEntity(siren, object[o], o);
      }
      else {
        siren = getSubEntities(siren, object[o], o);
      }
    }
    if(object[o].actions) {
      siren.actions = getActions(object[o].actions, o, object[o].data);
      siren.links = getLinks(object[o].actions, o, object[o].data);    
    }
  }
       
  return JSON.stringify(siren, null, 2);
}

// handle any error info
function getError(siren, object, o) {
  var properties;
  
  if(siren.properties) {
    properties = siren.properties;
  }
  else {
    properties = {};
  }
  
  for(var p in object) {
    properties[p] = object[p];
  }

  siren.class = [o];
  siren.properties = properties;
  
  return siren;
}

// handle single entity
function getEntity(siren, object, o) {
  var props, properties;
  
  props = object.data[0];
  if(siren.properties) {
    properties = siren.properties;
  } 
  else {
    properties = {};
  }
  
  if(object.content) {
    properties.content = object.content;
  }
  
  for(var p in props) {
    properties[p] = props[p];
  }
  
  siren.class = [o]
  siren.properties = properties;
  
  return siren;
}

// handle collection of subentities
function getSubEntities(siren, object, o) {
  var items, item, i, x, data, actions;
  
  data = object.data;
  actions = object.actions;
  items= [];
  
  if(object.content) {
    if(!siren.properties) {
      siren.properties = {};
    }
    siren.properties.content = object.content;
  }
  
  if(data) {
    for(i=0,x=data.length;i<x;i++) {
      item = {};
      item.class = [o];
      item.href = "#";
      item.rel = [];
      item.type = g.atype;

      for(var p in data[i]) {
        if(p!=='meta') {
          item[p] = data[i][p];
        }
      }
      
      if(actions) {
        link = getItemLink(actions);
        if(link) {
          item.href = link.href.replace(/{key}/g,item.id);
          item.rel = link.rel;
          item.type = link.contentType||g.atype;
        }
      }
      
      items.push(item);
    }
  }
  
  siren.entities = items;
  
  return siren;
}

// handle actions
function getActions(actions, o, data) {
  var coll, form, action, input, i, x;
  
  coll = [];
  for(i=0, x=actions.length; i<x; i++) {
    if(actions[i].inputs && actions[i].inputs.length!==0 && actions[i].target.indexOf("siren")!==-1) {
      action = actions[i];
      form = {};
      form.name = action.name;
      form.title = action.prompt||action.name;
      form.href = action.href.replace(/^\/\//,"http://")||"#";
      if(data && data.length==1) {
        form.href = form.href.replace(/{key}/g,data[0].id||"");
        form.href = form.href.replace(/{id}/g,data[0].id||"");
      }
      if(action.type!=="safe") {
        form.type = action.contentType||g.ctype;
        form.method = utils.actionMethod(action.action)
      }
      else {
        form.method = "GET";
      }
      form.fields = [];
      for(j=0,y=action.inputs.length; j<y; j++) {
        input = action.inputs[j];
        field = {};
        if(input.name) {
          field.name = input.name;
          field.type = input.type||"text";
          field.value = input.value||"";
          field.title = input.prompt||input.name;
          field.class = [o];
          field.readOnly = input.readOnly||false;
          field.required = input.required||false;
          if(input.pattern) {
            field.pattern = input.pattern;
          }
          form.fields.push(field);
        }
      }
      coll.push(form);
    }
  }
  return coll;
}

// handle links
function getLinks(actions, o, data) {
  var coll, link, action, i, x;
  var single, item;
  
  single = (data && data.length===1);
  if(data && data.length===1) {
    item = data[0];
  }
  
  coll = [];
  for(i=0, x=actions.length; i<x; i++) {
    if(actions[i].type==="safe" && actions[i].target.indexOf("siren")!==-1 && 
      (actions[i].inputs===undefined || actions[i].inputs.length===0)) 
    {
      if(single===true && actions[i].target.indexOf("item")!==-1) {
        action = actions[i];
        link = {};
        link.rel = action.rel;
        link.href = action.href.replace(/^\/\//,"http://");
        if(item) {
          link.href = link.href.replace(/{key}/g,item.id||"");
          link.href = link.href.replace(/{id}/g,item.id)||"";
        }
        link.class = [o];
        link.title = action.prompt||"";
        link.type = action.contentType||g.atype;
        coll.push(link);
      }
      if(single===false && actions[i].target.indexOf("list")!==-1) {
        action = actions[i];
        link = {};
        link.rel = action.rel;
        link.href = action.href.replace(/^\/\//,"http://");
        if(item) {
          link.href = link.href.replace(/{key}/g,item.id||"");
          link.href = link.href.replace(/{id}/g,item.id)||"";
        }
        link.class = [o];
        link.title = action.prompt||"";
        link.type = action.contentType||g.atype;
        coll.push(link);
      }
      if(actions[i].target.indexOf("app")!==-1) {
        action = actions[i];
        link = {};
        link.rel = action.rel;
        link.href = action.href.replace(/^\/\//,"http://");
        if(item) {
          link.href = link.href.replace(/{key}/g,item.id||"");
          link.href = link.href.replace(/{id}/g,item.id)||"";
        }
        link.class = [o];
        link.title = action.prompt||"";
        link.type = action.contentType||g.atype;
        coll.push(link);
      }
    }
  }
  return coll;
}

function getItemLink(actions) {
  var i, x, link;
  
  for(i=0, x=actions.length;i<x;i++) {
    if(actions[i].target.indexOf("item")!==-1 && actions[i].target.indexOf("siren")!==-1) {
      link = actions[i];
      break;
    }
  }
  return link;
}

// EOF

