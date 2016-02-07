/*******************************************************
 * TPS - Task Processing Service
 * task connector (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

// handles HTTP resource operations 
var qs = require('querystring');
var wstl = require('./../wstl.js');
var utils = require('./utils.js');

var components = {}
components.task = require('./../components/task-component.js');
components.user = require('./../components/user-component.js');

var content = "";
content += '<div class="ui segment">';
content += '<h3>Manage your TPS Tasks here.</h3>';
content += '<p>You can do the following:</p>';
content += '<ul>';
content += '<li>Add, Edit and Delete tasks</li>';
content += '<li>Mark tasks "complete", assign tasks to a user</li>';
content += '<li>Filter the list by Title, Assigned User, and Completed Status</li>';
content += '</ul>';
content += '</div>';

module.exports = main;

// http-level actions for tasks
function main(req, res, parts, respond) {
  var flag;

  flag = false;
  switch (req.method) {
    case 'GET':
      if(flag===false && parts[1]==="assign" && parts[2]) {
        flag=true;
        sendAssignPage(req, res, respond, parts[2]);
      }
      if(flag===false && parts[1]==="completed" && parts[2]) {
        flag=true;
        sendCompletedPage(req, res, respond, parts[2]);
      }
      if(flag===false && parts[1] && parts[1].indexOf('?')===-1) {
        flag = true;
        sendItemPage(req, res, respond, parts[1]);
      }
      if(flag===false) {
        sendListPage(req, res, respond);
      }
    break;
    case 'POST':
      if(parts[1] && parts[1].indexOf('?')===-1) {
        switch(parts[1].toLowerCase()) {
          case "update":
            updateTask(req, res, respond, parts[2]); 
            break;
          case "remove":
            removeTask(req, res, respond, parts[2]);
            break;
          case "completed":
            markCompleted(req, res, respond, parts[2]);
            break;  
          case "active":
            markActive(req, res, respond, parts[2]);
            break;  
          case "assign":
            assignUser(req, res, respond, parts[2]);
            break;
          default:
            respond(req, res, 
              utils.errorResponse(req, res, 'Method Not Allowed', 405)
            );          
        }
      }
      else {
        addTask(req, res, respond);
      }
    break;
    case 'PUT':
      if(parts[1] && parts[1].indexOf('?')===-1) {
        updateTask(req, res, respond, parts[1]);
      }
      else {
        respond(req, res, 
          utils.errorResponse(req, res, 'Method Not Allowed', 405)
        );          
      }
    break;
    case 'DELETE':
      if(parts[1] && parts[1].indexOf('?')===-1) {
        removeTask(req, res, respond, parts[1]);
      }
      else {
        respond(req, res, 
          utils.errorResponse(req, res, 'Method Not Allowed', 405)
        );          
      }
    break;    
  default:
    respond(req, res, utils.errorResponse(req, res, 'Method Not Allowed', 405));
    break;
  }
}

function sendListPage(req, res, respond) {
  var doc, coll, root, q, qlist, code, data, related;

  root = '//'+req.headers.host;
  coll = [];
  data = [];
  related = {};
  
  // parse any filter on the URL line
  // or just pull the full set
  q = req.url.split('?');
  if(q[1]!==undefined) {
    qlist = qs.parse(q[1]);
    data = components.task('filter', qlist);
  }
  else {
    data = components.task('list');
  }
      
  // top-level links
  wstl.append({name:"homeLink",href:"/home/",
    rel:["home","collection"],root:root}, coll);
  wstl.append({name:"taskLink",href:"/task/",
    rel:["self", "task","collection"],root:root},coll); 
  wstl.append({name:"userLink",href:"/user/",
    rel:["user","collection"],root:root},coll);
  wstl.append({name:"taskProfile",href:"/files/task.profile",
    rel:["profile"],root:root},coll);
  
  // item actions
  wstl.append({name:"taskLinkItem",href:"/task/{id}",
    rel:["item"],root:root},coll);
  wstl.append({name:"taskAssignLink",href:"/task/assign/{id}",
    rel:["assignUser","edit-form"],root:root},coll);
  wstl.append({name:"taskCompletedLink",href:"/task/completed/{id}",
    rel:["markCompleted","edit-form"],root:root},coll);
  
  // add template
  wstl.append({name:"taskFormAdd",href:"/task/",
    rel:["create-form","/rels/taskAdd"],root:root},coll);

  // list queries
  wstl.append({name:"taskFormListCompleted",href:"/task/",
    rel:["completed","search"],root:root},coll);
  wstl.append({name:"taskFormListActive",href:"/task/",
    rel:["active","search"],root:root},coll);
  wstl.append({name:"taskFormListByTitle",href:"/task/",
    rel:["byTitle","search",],root:root},coll);
  wstl.append({name:"taskFormListByUser",href:"/task/",
    rel:["byUser","search"],root:root},coll);
  wstl.append({name:"taskFormListByTag",href:"/task/",
    rel:["byTag","search"],root:root},coll);

  // compose and send graph 
  doc = {};
  doc.title = "TPS - Tasks";
  doc.actions = coll;
  doc.data =  data;
  doc.content = content;
  doc.related = related;
  respond(req, res, {code:200, doc:{task:doc}});
  
}

function sendItemPage(req, res, respond, id) {
  var item, doc, coll, root, data, related;
  
  root = '//'+req.headers.host;
  coll = [];
  data = [];
  related = {};
  
  // load data item
  item = components.task('read',id);
  if(item.length===0) {
    respond(req, res, utils.errorResponse(req, res, "File Not Found", 404));
  }
  else {
    data = item;

    // top-level links
    wstl.append({name:"homeLink",href:"/home/",
      rel:["home","collection"],root:root}, coll);
    wstl.append({name:"taskLink",href:"/task/",
      rel:["self","task","collection"],root:root},coll); 
    wstl.append({name:"userLink",href:"/user/",
      rel:["user","collection"],root:root},coll);
    wstl.append({name:"taskProfile",href:"/files/task.profile",
      rel:["profile"],root:root},coll);
    
    // item links
    wstl.append({name:"taskLinkItem",href:"/task/{id}",
      rel:["item"],root:root},coll);
    wstl.append({name:"taskAssignLink",href:"/task/assign/{id}",
      rel:["assignUser","edit-form"],root:root},coll);
    wstl.append({name:"taskCompletedLink",href:"/task/completed/{id}",
      rel:["markCompleted","edit-form"],root:root},coll);
    
    // item forms
    tran = wstl.append({name:"taskFormEditPost",href:"/task/update/{id}",
      rel:["post-edit","edit-form"],root:root},coll);
    tran = wstl.append({name:"taskFormEdit",href:"/task/{id}",
      rel:["edit","task"],root:root},coll);
    tran = wstl.append({name:"taskFormRemovePost",href:"/task/remove/{id}",
      rel:["post-remove","edit-form"],root:root},coll);
    tran = wstl.append({name:"taskFormRemove",href:"/task/{key}",
      rel:["remove","edit-form"],root:root},coll);
    tran = wstl.append({name:"taskCompletedForm",href:"/task/completed/{id}",
      rel:["markCompleted","edit-form"],root:root},coll);
    tran = wstl.append({name:"taskAssignForm",href:"/task/assign/{id}",
      rel:["assignUser","edit-form"],root:root},coll);
      
    tran = wstl.append({name:"taskActiveForm",href:"/task/active/{id}",
      rel:["markActive","edit-form"],root:root},coll);

    // compose and send graph 
    doc = {};
    doc.title = "TPS - Tasks";
    doc.actions = coll;
    doc.data =  data;
    doc.content = content;
    doc.related = related;
    respond(req, res, {code:200, doc:{task:doc}});        
  }
}

function sendAssignPage(req, res, respond, id) {
  var item, doc, coll, root, data, related;
  
  root = '//'+req.headers.host;
  coll = [];
  data = [];
  related = {};
  
  // load any related data
  related.userlist = components.user('list');
  
  // load data item
  item = components.task('read',id);
  if(item.length===0) {
    respond(req, res, utils.errorResponse(req, res, "File Not Found", 404));
  }
  else {
    data = item;

    // top-level links
    wstl.append({name:"homeLink",href:"/home/",
      rel:["home","collection"],root:root}, coll);
    wstl.append({name:"taskLink",href:"/task/",
      rel:["task","collection"],root:root},coll); 
    wstl.append({name:"userLink",href:"/user/",
      rel:["user","collection"],root:root},coll);
    wstl.append({name:"taskProfile",href:"/files/task.profile",
      rel:["profile"],root:root},coll);
    
    // item links
    wstl.append({name:"taskLinkItem",href:"/task/{id}",
      rel:["item"],root:root},coll);
    wstl.append({name:"taskLinkDetail",href:"/task/{id}",
      rel:["item"],root:root},coll);
    wstl.append({name:"taskAssignLink",href:"/task/assign/{id}",
      rel:["assignUser","edit-form"],root:root},coll);
    wstl.append({name:"taskCompletedLink",href:"/task/completed/{id}",
      rel:["markCompleted","edit-form"],root:root},coll);
    
    // item forms
    tran = wstl.append({name:"taskAssignForm",href:"/task/assign/{id}",
      rel:["assignUser","edit-form"],root:root},coll);

    // compose & send graph 
    doc = {};
    doc.title = "TPS - Tasks";
    doc.actions = coll;
    doc.data =  data;
    doc.content = content;
    doc.related = related;
    respond(req, res, {code:200, doc:{task:doc}});
  }
}

function sendCompletedPage(req, res, respond, id) {
  var item, doc, coll, root, data, related;
  
  root = '//'+req.headers.host;
  coll = [];
  data = [];
  related = {};
  
  // load data item
  item = components.task('read',id);
  if(item.length===0) {
    respond(req, res, utils.errorResponse(req, res, "File Not Found", 404));
  }
  else {
    data = item;

    // top-level links
    wstl.append({name:"homeLink",href:"/home/",
      rel:["home","collection"],root:root}, coll);
    wstl.append({name:"taskLink",href:"/task/",
      rel:["task","collection"],root:root},coll); 
    wstl.append({name:"userLink",href:"/user/",
      rel:["user","collection"],root:root},coll);
    wstl.append({name:"taskProfile",href:"/files/task.profile",
      rel:["profile"],root:root},coll);

    // item links
    wstl.append({name:"taskLinkItem",href:"/task/{id}",
      rel:["item","/rels/item"],root:root},coll);
    wstl.append({name:"taskLinkDetail",href:"/task/{id}",
      rel:["item"],root:root},coll);
    wstl.append({name:"taskAssignLink",href:"/task/assign/{id}",
      rel:["assignUser","edit-form"],root:root},coll);
    wstl.append({name:"taskCompletedLink",href:"/task/completed/{id}",
      rel:["markCompleted","edit-form"],root:root},coll);
    
    // item forms
    tran = wstl.append({name:"taskCompletedForm",href:"/task/completed/{id}",
      rel:["markCompleted","edit-form"],root:root},coll);
        
    // compose & send graph 
    doc = {};
    doc.title = "TPS - Tasks";
    doc.actions = coll;
    doc.data =  data;
    doc.content = content;
    doc.related = related;
    respond(req, res, {code:200, doc:{task:doc}});
  }
}


// handle add operation
function addTask(req, res, respond) {
  var body, doc, msg;

  body = '';
  
  // collect body
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    try {
      msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.task('add', msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, {code:303, doc:"", 
        headers:{'location':'//'+req.headers.host+"/task/"}
      });
    } 
    else {
      respond(req, res, doc);
    }
  });
}

// handle update operation
function updateTask(req, res, respond, id) {
  var body, doc, msg;

  body = '';
  
  // collect body
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    try {
      msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.task('update', id, msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, 
        {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
      );
    } 
    else {
      respond(req, res, doc);
    }
  })
}

// handle remove operation (no body)
function removeTask(req, res, respond, id) {
  var doc;
  
  // execute
  try {
    doc = components.task('remove', id);
    if(doc && doc.type==='error') {
      doc = utils.errorResponse(req, res, doc.message, doc.code);    
    }
  } 
  catch (ex) {
    doc = utils.errorResponse(req, res, 'Server Error', 500);
  }
  
  if (!doc) {
    respond(req, res, 
      {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
    );
  } 
  else {
    respond(req, res, doc);
  }
}

// handle mark complete operation (no body)
function markCompleted(req, res, respond, id) {
  var doc;

  // execute
  try {
    doc = components.task('mark-completed', id);
    if(doc && doc.type==='error') {
      doc = utils.errorResponse(req, res, doc.message, doc.code);    
    }
  }
  catch (ex) {
    doc = utils.errorResponse(req, res, 'Server Error', 500);
  }

  if (!doc) {
    respond(req, res, 
      {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
    );
  } 
  else {
    respond(req, res, doc);
  }
}

// handle mark complete operation (no body)
function markActive(req, res, respond, id) {
  var doc;

  // execute
  try {
    doc = components.task('mark-active', id);
    if(doc && doc.type==='error') {
      doc = utils.errorResponse(req, res, doc.message, doc.code);    
    }
  }
  catch (ex) {
    doc = utils.errorResponse(req, res, 'Server Error', 500);
  }

  if (!doc) {
    respond(req, res, 
      {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
    );
  } 
  else {
    respond(req, res, doc);
  }
}

// handle assign user operation 
function assignUser(req, res, respond, id) {
  var body, doc, msg;

  body = '';
  
  // collect body
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    try {
      msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.task('assign-user', id, msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, 
        {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
      );
    } 
    else {
      respond(req, res, doc);
    }
  })
}

// EOF

