/*******************************************************
 * TPS - Task Processing Service
 * wstl document (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

// library for managing the state transitions
// function set for finding transitions at runtime
// holds the list of *all* possible state transitions for this service

// ************************
// run on first load;
// ************************
var trans = loadTrans();

// low-level finder
exports.find = function(name) {
  var rtn, i, x;
 
  rtn = null;
  for(i=0,x=trans.length;i<x;i++) {
    if(trans[i].name===name) {
      rtn = trans[i];
      break;
    }
  }

  return rtn;
}

// make a base transition
// object = {name,href,rel[],root}
exports.make = function(object) {
  var rtn, name, rel, href, root;
  
  if(!object.name || object.name===null || object.name==="") {
    rtn = null;
  }
  else {
    name = object.name;
    root = object.root||"";
    href = object.href||"#";
    rel = object.rel||"";
    
    tran = this.find(name);
    if(tran!==null) {
      rtn = tran;
      rtn.href = root + href;
      rtn.rel = [];
      if(Array.isArray(rel)===true) {
        for(i=0,x=rel.length;i<x;i++) {
          rtn.rel.push((rel[i].indexOf('/')===0?root+rel[i]:rel[i]));
        }        
      }
      else {
        rtn.rel.push((rel.indexOf('/')===0?root+rel:rel));
      }
    }
    else {
      rtn = null;
    }
  }
  return rtn;
}

// append a base transition to a collection
exports.append = function(object, coll) {
  var trans;
  
  trans = this.make(object);
  if(trans!==null) {
    coll.splice(coll.length, 0, trans);
  }
  return coll;
}

// NOT USED
exports.findByTarget = function(val) {
  var coll, i, x;
 
  coll = [];
  for(i=0,x=trans.length;i<x;i++) {
    if(trans[i].target && trans[i].target.indexOf(val)!==-1) {
      coll.push(trans[i]);
    }
  }
 
  return coll;
}

exports.all = function all() {
  return trans;
}

// internal filling routine
function loadTrans() {
  var trans;
  trans = [];

  /************************************
  HOME
  *************************************/
  trans.push({
    name : "homeLink",
    type : "safe",
    action : "read",
    kind : "home",
    target : "app menu hal siren cj",
    prompt : "Home"
  });
  trans.push({
    name : "taskLink",
    type : "safe",
    action : "read",
    kind : "task",
    target : "app menu hal siren cj",
    prompt : "Tasks"
  });  
  trans.push({
    name : "userLink",
    type : "safe",
    action : "read",
    kind : "user",
    target : "app menu hal siren cj",
    prompt : "Users"
  });
  trans.push({
    name : "noteLink",
    type : "safe",
    action : "read",
    kind : "note",
    target : "app menu hal siren cj",
    prompt : "Notes"
  });
  trans.push({
    name : "homeProfile",
    type : "safe",
    action : "read",
    kind : "home",
    target : "app menu siren",
    prompt : "Profile"
  });

  /************************************
  TASKS
  *************************************/
  trans.push({
    name : "taskProfile",
    type : "safe",
    action : "read",
    kind : "task",
    target : "app menu siren",
    prompt : "Profile"
  });

  trans.push({
    name : "taskFormListActive",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query hal siren cj",
    prompt : "Active Tasks",
    inputs : [
      {name : "completeFlag", prompt : "Complete", value : "false", readOnly:true}
    ]
  });
  trans.push({
    name : "taskFormListCompleted",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query hal siren cj",
    prompt : "Completed Tasks",
    inputs : [
      {name : "completeFlag", prompt : "Complete", value : "true", readOnly:true}
    ]
  });

  trans.push({
    name : "taskFormListByTitle cj",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query hal siren",
    prompt : "Search By Title",
    inputs : [
      {name : "title", prompt : "Title", value : ""}
    ]
  });

  trans.push({
    name : "taskFormListByUser cj",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query hal siren",
    prompt : "Search By Assigned User",
    inputs : [
      {name : "assignedUser", prompt : "User", value : ""}
    ]
  });

  trans.push({
    name : "taskFormListByTag",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query hal siren cj",
    prompt : "Search By Tag",
    inputs : [
      {name : "tags", prompt : "Tags", value : ""}
    ]
  });
  
  trans.push({
    name : "taskLinkItem",
    type : "safe",
    action : "read",
    kind : "task",
    target : "item hal siren cj href",
    prompt : "Detail",
    html : {
      className : "item link ui basic blue button"
    }
  });

  trans.push({
    name : "taskLinkDetail",
    type : "safe",
    action : "read",
    kind : "task",
    target : "item hal siren cj read",
    prompt : "Detail",
    html : {
      className : "item link ui basic blue button"
    }
  });
  
  // add task
  trans.push({
    name : "taskFormAdd",
    type : "unsafe",
    action : "append",
    kind : "task",
    target : "list add hal siren cj-template",
    prompt : "Add Task",
    inputs : [
      {name : "title", prompt : "Title", required : true},
      {name : "tags", prompt : "Tags"},
      {name : "completeFlag", prompt : "Complete", value : "false", 
        pattern :"true|false",
        type:"select",
        suggest:[{value:"false"},{value:"true"}] 
      }
    ]
  });

  // edit task
  trans.push({
    name : "taskFormEdit",
    type : "unsafe",
    action : "replace",
    kind : "task",
    prompt : "Edit Task",
    target : "item edit hal siren cj",
    inputs : [
      {name : "id", prompt : "ID", value : "", readOnly : true},
      {name : "title", prompt : "Title", value : ""},
      {name : "tags", prompt : "Tags", value : ""},
      {name : "completeFlag", prompt : "Complete", value : "false", 
        pattern :"true|false",
        type:"select",
        suggest:[{value:"false"},{value:"true"}] 
      }
    ]
  });
  // edit task
  trans.push({
    name : "taskFormEditPost",
    type : "unsafe",
    action : "append",
    kind : "task",
    prompt : "Edit Task",
    target : "item edit form post",
    inputs : [
      {name : "id", prompt : "ID", value : "", readOnly : true},
      {name : "title", prompt : "Title", value : ""},
      {name : "completeFlag", prompt : "Complete", value : "false", 
        pattern :"true|false",
        type:"select",
        suggest:[{value:"false"},{value:"true"}] 
      }
    ]
  });

  // remove task
  trans.push({
    name : "taskFormRemove",
    type : "unsafe",
    action : "remove",
    kind : "task",
    prompt : "Remove Task",
    target : "item edit hal siren",
    inputs : [
      {name : "id", prompt : "ID", readOnly : true}
    ]
  });
  // remove task
  trans.push({
    name : "taskFormRemovePost",
    type : "unsafe",
    action : "append",
    kind : "task",
    prompt : "Remove Task",
    target : "item edit form post",
    inputs : [
      {name : "id", prompt : "ID", readOnly : true}
    ]
  });

  // mark task completed
  trans.push({
    name : "taskCompletedLink",
    type : "safe",
    action : "read",
    kind : "task",
    target : "item cj read",
    prompt : "Mark Completed",
    html : {
      className : "item action ui basic blue button"
    }
  });
  trans.push({
    name : "taskCompletedForm",
    type : "unsafe",
    action : "append",
    kind : "task",
    target : "item completed edit post form hal siren cj-template",
    prompt : "Mark Completed",
    inputs : [
      {name: "id", prompt:"ID", readOnly:true},
    ]
  });

  trans.push({
    name : "taskActiveLink",
    type : "safe",
    action : "read",
    kind : "task",
    target : "item cj read",
    prompt : "Mark Active",
    html : {
      className : "item action ui basic blue button"
    }
  });
  trans.push({
    name : "taskActiveForm",
    type : "unsafe",
    action : "append",
    kind : "task",
    target : "item active edit post form hal siren cj-template",
    prompt : "Mark Active",
    inputs : [

      {name: "id", prompt:"ID", readOnly:true},
    ]
  });

  trans.push({
    name : "taskAssignLink",
    type : "safe",
    action : "read",
    kind : "task",
    target : "item cj read",
    prompt : "Assign User",
    html : {
      className : "item action ui basic blue button"
    }
  });
  trans.push({
    name : "taskAssignForm",
    type : "unsafe",
    action : "append",
    kind : "task",
    target : "item assign edit post form hal siren cj-template",
    prompt : "Assign User",
    inputs : [
      {name: "id", prompt:"ID", readOnly:true},
      {name: "assignedUser", prompt:"User Nickname", value:"", requried:true, suggest:{related:"userlist", value:"nick",text:"nick"}, type:"select"}
    ]
  });

  /************************************
  USERS
  *************************************/
  trans.push({
    name : "userProfile",
    type : "safe",
    action : "read",
    kind : "user",
    target : "app menu siren",
    prompt : "Profile"
  });

  trans.push({
    name : "userLinkItem",
    type : "safe",
    action : "read",
    kind : "user",
    target : "item hal siren cj href ro",
    prompt : "Detail",
    html : {
      className : "item link ui basic blue button"
    }
  });

  trans.push({
    name : "userLinkDetail",
    type : "safe",
    action : "read",
    kind : "user",
    target : "item hal siren cj read",
    prompt : "Detail",
    html : {
      className : "item link ui basic blue button"
    }
  });

  trans.push({
    name : "userTasksLink",
    type : "safe",
    action : "read",
    kind : "user",
    target : "item hal siren cj read",
    prompt : "Assigned Tasks",
    html : {
      className : "item link ui basic blue button"
    }
  });

  trans.push({
    name : "userFormListByNick",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query hal siren cj",
    prompt : "Search By Nick",
    inputs : [
      {name : "nick", prompt : "Nickname", value : ""}
    ]
  });
  
  trans.push({
    name : "userFormListByName",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query hal siren cj",
    prompt : "Search By Name",
    inputs : [
      {name : "name", prompt : "Name", value : ""}
    ]
  });

  trans.push({
    name : "userFormListByEmail",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query hal siren cj",
    prompt : "Search By Email",
    inputs : [
      {name : "email", prompt : "Email", value : ""}
    ]
  });

  trans.push({
    name : "userFormAdd",
    type : "unsafe",
    action : "append",
    kind : "user",
    target : "list add hal siren cj-template",
    prompt : "Add User",
    inputs : [
      {name : "nick", prompt : "Nickname", required: true, pattern: "[a-zA-Z0-9]+"},
      {name : "email", prompt : "Email", value: "", type: "email"}, 
      {name : "name", prompt : "Full Name", value: "", required: true}, 
      {name : "password", prompt : "Password", value: "", required: true, pattern: "[a-zA-Z0-9!@#$%^&*-]+"}
    ]
  });

  trans.push({
    name : "userLinkEdit",
    type : "safe",
    action : "read",
    kind : "user",
    target : "item read cj",
    prompt : "Edit User"
  });
  trans.push({
    name : "userFormEdit",
    type : "unsafe",
    action : "replace",
    kind : "user",
    prompt : "Edit User",
    target : "item edit form hal siren",
    inputs : [
      {name : "nick", prompt : "Nickname", value : "", readOnly: true},
      {name : "email", prompt : "Email", value: "", type: "email"}, 
      {name : "name", prompt : "Full Name", value : ""}
    ]
  });
  trans.push({
    name : "userFormEditPost",
    type : "unsafe",
    action : "append",
    kind : "task",
    prompt : "Edit User",
    target : "item edit form post cj-template",
    inputs : [
      {name : "nick", prompt : "Nickname", value : "", readOnly: true},
      {name : "email", prompt : "Email", value: "", type: "email"}, 
      {name : "name", prompt : "Full Name", value : ""}
    ]
  });

  trans.push({
    name : "userLinkChangePW",
    type : "safe",
    action : "read",
    kind : "user",
    target : "item read cj",
    prompt : "Change Password",
    html : {
      className : "item link ui basic blue button"
    }
  });
  trans.push({
    name : "userFormChangePWPost",
    type : "unsafe",
    action : "append",
    kind : "task",
    prompt : "Change Password",
    target : "item edit form post hal siren cj-template",
    inputs : [
      {name : "nick", prompt : "Nickname", value : "", readOnly: true},
      {name : "oldpass", prompt : "Current Password", value : "", required: true, pattern: "[a-zA-Z0-9!@#$%^&*-]+"},
      {name : "newpass", prompt : "New Password", value : "", required: true, pattern: "[a-zA-Z0-9!@#$%^&*-]+"},
      {name : "checkpass", prompt : "Confirm PW", value : "", required: true, pattern: "[a-zA-Z0-9!@#$%^&*-]+"}
    ]
  });  

  // return complete 
  // design-time WSTL
  return trans;
  
}

// EOF

