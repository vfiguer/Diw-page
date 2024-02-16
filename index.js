const cryptoKey =
  "CUG5BQI9Vvehz7S7ou4dyGC2Lf7i1CwAD44O3gDielxeQy9lT1zCFADbr8kQB5rz";

var indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;
var database = "valentinDB";
const DB_STORE_NAME = "usuarios";
const DB_VERSION = 1;
var db;
var opened = false;
const EDIT_USER = "Edit user";
const NEW_USER = "New user";
const ADD_USER = "Add user";
let admin = false;

/**
 * openCreateDb
 * opens and/or creates an IndexedDB database
 */
function openCreateDb(onDbCompleted) {
  if (opened) {
    db.close();
    opened = false;
  }
  //We could open changing version ..open(database, 3)
  var req = indexedDB.open(database, DB_VERSION);

  //This is how we pass the DB instance to our var
  req.onsuccess = function (e) {
    db = this.result; // Or event.target.result
    console.log("openCreateDb: Databased opened " + db);
    opened = true;
    mostrarinfo(db);
    //The function passed by parameter is called after creating/opening database
  };

  // Very important event fired when
  // 1. ObjectStore first time creation
  // 2. Version change
  req.onupgradeneeded = function () {
    //Value of previous db instance is lost. We get it back using the event
    db = req.result; //Or this.result

    console.log("openCreateDb: upgrade needed " + db);
    var store = db.createObjectStore(DB_STORE_NAME, {
      keyPath: "id",
      autoIncrement: true,
    });
    console.log("openCreateDb: Object store created");

    store.createIndex("name", "name", { unique: false });
    store.createIndex("email", "email", { unique: false });
    store.createIndex("password", "password", { unique: false });
    store.createIndex("profilepicture", "profilepicture", { unique: false });
    store.createIndex("admin", "admin", { unique: false });

    var store = db.createObjectStore("login", {
      keyPath: "id",
      autoIncrement: true,
    });
    console.log("openCreateDb: Object store created");

    store.createIndex("name", "name", { unique: false });
    store.createIndex("email", "email", { unique: false });
    store.createIndex("password", "password", { unique: false });
    store.createIndex("profilepicture", "profilepicture", { unique: false });
    store.createIndex("admin", "admin", { unique: false });
  };

  req.onerror = function (e) {
    console.error(
      "openCreateDb: error opening or creating DB:",
      e.target.errorCode
    );
  };
}

function addUser(db) {
  var password = document.getElementById("password").value;
  var rpassword = document.getElementById("rpassword").value;
  if (password === rpassword && password.trim().length >= 8) {
    var name = document.getElementById("name");
    var email = document.getElementById("email");

    var encrypted = CryptoJS.AES.encrypt(password, cryptoKey).toString();
    var radioSeleccionado = document.querySelector(
      'input[name="radio"]:checked'
    );
    var labelImagen = radioSeleccionado.parentNode;
    var rutaImagen = labelImagen.querySelector("img").src;
    var admin = document.getElementById("admin");

    var obj = {
      name: name.value,
      email: email.value,
      password: encrypted,
      admin: admin.checked,
      profilepicture: rutaImagen,
    };

    console.log(obj);
    // Start a new transaction in readwrite mode. We can use readonly also
    var tx = db.transaction(DB_STORE_NAME, "readwrite");
    var store = tx.objectStore(DB_STORE_NAME);

    try {
      // Inserts data in our ObjectStore
      req = store.add(obj);
    } catch (e) {
      console.log("Catch");
    }

    req.onsuccess = function (e) {
      console.log(
        "addUser: Data insertion successfully done. Id: " + e.target.result
      );
      obj.id = e.target.result;
      console.log(obj);
      login(db, obj);

      // Operations we want to do after inserting data
      //clearFormInputs();
    };
    req.onerror = function (e) {
      console.error("addUser: error creating data", this.error);
    };

    //After transaction is completed we close de database
    tx.oncomplete = function () {
      console.log("addUser: transaction completed");
      if (admin.checked == true) {
        window.location.href = "./userdata.html";
      } else {
        window.location.href = "./index.html";
      }
    };
  }

  function readData() {
    openCreateDb(function (db) {
      readUsers(db);
      if (typeof callReadUsers === "function") {
        callReadUsers();
      }
    });
  }
}

function login(db, obj) {
  console.log(obj);
  // Start a new transaction in readwrite mode. We can use readonly also
  var tx = db.transaction("login", "readwrite");
  var store = tx.objectStore("login");

  var admin = obj.admin;
  console.log(admin);
  try {
    // Inserts data in our ObjectStore
    req = store.add(obj);
  } catch (e) {
    console.log("Catch");
  }

  req.onsuccess = function (e) {
    console.log(
      "addUser: Data insertion successfully done. Id: " + e.target.result
    );

    // Operations we want to do after inserting data
    //clearFormInputs();
  };
  req.onerror = function (e) {
    console.error("addUser: error creating data", this.error);
  };

  //After transaction is completed we close de database
  tx.oncomplete = function () {
    console.log("addUser: transaction completed");
    if (admin == true) {
      window.location.href = "./userdata.html";
    } else {
      window.location.href = "./index.html";
    }
  };
}

function readData() {
  openCreateDb(function (db) {
    readUsers(db);
  });
}

function loginExistingUser(db) {
  var tx = db.transaction("usuarios", "readwrite");
  var store = tx.objectStore("usuarios");
  var request = store.openCursor();

  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  request.onsuccess = function (event) {
    var cursor = event.target.result;

    if (cursor) {
      var decrypted = CryptoJS.AES.decrypt(
        cursor.value.password,
        cryptoKey
      ).toString(CryptoJS.enc.Utf8);

      if (cursor.value.email == email && decrypted == password) {
        var obj = cursor.value;
        console.log(obj);
        login(db, obj);
      }

      cursor.continue();
    }
  };
}

function mostrarinfo(db) {
  isAdmin(db);
  console.log(admin);
  var tx = db.transaction("login", "readonly");
  var store = tx.objectStore("login");

  var req = store.openCursor();

  req.onsuccess = function (e) {
    var cursor = e.target.result;

    if (cursor) {
      console.log(cursor.value);
      var userinfo = document.getElementById("userinfo");
      userinfo.classList.remove("d-none");
      var login = document.getElementById("login");
      login.classList.add("d-none");
      var register = document.getElementById("register");
      register.classList.add("d-none");
      var logout = document.getElementById("logout");
      logout.classList.remove("d-none");

      var userpfp = document.getElementById("userpfp");
      var username = document.getElementById("username");
      username.innerText = cursor.value.name;
      userpfp.setAttribute("src", cursor.value.profilepicture);

      if (admin == true) {
        var userdata = document.getElementById("userdata");
        userdata.classList.remove("d-none");
      }
      cursor.continue();
    } else {
      console.log("EOF");
      //Operations to do after reading all the records
    }
  };

  req.onerror = function (e) {
    console.error("readUsers: error reading data:", e.target.errorCode);
  };

  tx.oncomplete = function () {
    console.log("readUsers: tx completed");
  };
}
// Reads all the records from our ObjectStore
function readUsers(db) {
  if (admin == true) {
    var tx = db.transaction(DB_STORE_NAME, "readonly");
    var store = tx.objectStore(DB_STORE_NAME);

    var result = [];
    var req = store.openCursor();

    req.onsuccess = function (e) {
      var cursor = e.target.result;

      if (cursor) {
        result.push(cursor.value);
        console.log(cursor.value);
        cursor.continue();
      } else {
        console.log("EOF");
        //Operations to do after reading all the records
      }
    };

    req.onerror = function (e) {
      console.error("readUsers: error reading data:", e.target.errorCode);
    };

    tx.oncomplete = function () {
      console.log("readUsers: tx completed");
      addUsersToHTML(result);
    };
  } else {
    window.location.href = "./index.html";
  }
}

function isAdmin(db) {
  var tx = db.transaction("login", "readonly");
  var store = tx.objectStore("login");

  var req = store.openCursor();

  req.onsuccess = function (e) {
    var cursor = e.target.result;

    if (cursor) {
      admin = cursor.value.admin;
      cursor.continue();
    } else {
      return admin;
    }
  };
}
function showprofile(db) {
  console.log("hola");
  var tx = db.transaction("login", "readonly");
  var store = tx.objectStore("login");

  var result = [];
  var req = store.openCursor();

  req.onsuccess = function (e) {
    var cursor = e.target.result;

    if (cursor) {
      result.push(cursor.value);
      console.log(cursor.value);
      cursor.continue();
    } else {
      console.log("EOF");
      //Operations to do after reading all the records
    }
  };

  req.onerror = function (e) {
    console.error("readUsers: error reading data:", e.target.errorCode);
  };

  tx.oncomplete = function () {
    console.log("readUsers: tx completed");
    showProfileHtml(result);
  };
}

function addUsersToHTML(users) {
  var ul = document.getElementById("users-ul");

  ul.innerHTML = "";
  for (let i = 0; i < users.length; i++) {
    ul.innerHTML +=
      "<li class='d-flex justify-content-center '><span> <b>ID: </b> " +
      users[i].id +
      " <b>NOMBRE</b>: " +
      users[i].name +
      " <b>EMAIL: </b>" +
      users[i].email +
      " " +
      "</span><button class='btn  m-2' user_id=" +
      users[i].id +
      " id=edit_" +
      users[i].id +
      ">Edit user</button><button class='bg-secondary btn m-2' " +
      " " +
      "onclick='deleteUser(db," +   users[i].id+
      ",  )'>Delete user</button></li>";
  }

  // for (let i = 0; i < users.length; i++) {
  //   document
  //     .getElementById("edit_" + users[i].id)
  //     .addEventListener("click", readUser, false);
  //   document
  //     .getElementById("delete_" + users[i].id)
  //     .addEventListener("click", deleteUser, false);
  // }
}

function deleteUser(db, id, type) {
  let popup = document.getElementById("popup");
  let yes = document.getElementById("yes");
  let no = document.getElementById("no");
  popup.classList.remove("d-none");

  yes.addEventListener("click", (e) => {
    let tx = db.transaction(DB_STORE_NAME, "readwrite");
    let store = tx.objectStore(DB_STORE_NAME);
    store.delete(parseInt(id));
    readUsers(db);
    popup.classList.add("d-none");
    if(type=="self"){
      logOut(db);
    }
  });

  no.addEventListener("click", (e) => {
    popup.classList.add("d-none");
  });

}

function showProfileHtml(users) {
  var ul = document.getElementById("users-ul");

  ul.innerHTML = "";
  for (let i = 0; i < users.length; i++) {
    ul.innerHTML +=
      '<li class="d-flex flex-column align-items-left">' +
      '<div class="d-flex align-items-center">' +
      '<img src="' +
      users[i].profilepicture +
      '" alt="" class="rounded-circle profile-img">' +
      '<h1 class="p-2">' +
      users[i].name +
      "</h1>" +
      "</div>" +
      '<p class="flex-row"><h3 class="p-2">Email:</h3> ' +
      users[i].email +
      "</p>" +
      "<button class='btn' user_id=" +
      users[i].id +
      " id=edit_" +
      users[i].id +
      ">Edit info</button><button class='btn'  user_id=" +
      users[i].id +
      " id=delete_" +
      users[i].id +
      " onclick='deleteUser(db," +       users[i].id +
      ",  \"self\")'>Delete account</button></li>";
  }

  // for (let i = 0; i < users.length; i++) {
  //   document
  //     .getElementById("edit_" + users[i].id)
  //     .addEventListener("click", readUser, false);
  //   document
  //     .getElementById("delete_" + users[i].id)
  //     .addEventListener("click", deleteUser, false);
  // }
}

function readUser(e) {
  console.log("readUser");

  //Both options work
  //var button_id = e.target.id;
  //var user_id = document.getElementById(button_id).getAttribute("user_id");
  var user_id = e.target.getAttribute("user_id");

  openCreateDb(function (db) {
    console.log(db);
    console.log("Id user: " + user_id);

    var tx = db.transaction(DB_STORE_NAME, "readonly");
    var store = tx.objectStore(DB_STORE_NAME);

    // Reads one record from our ObjectStore
    var req = store.get(parseInt(user_id));

    req.onsuccess = function (e) {
      var record = e.target.result;
      console.log(record);

      //Operations to do after reading a user
      updateFormInputsToEdit(record);
    };

    req.onerror = function (e) {
      console.error("readUser: error reading data:", e.target.errorCode);
    };

    tx.oncomplete = function () {
      console.log("readUser: tx completed");
    };
  });
}

function logOut(db) {
  let transaction = db.transaction("login", "readwrite");
  let store = transaction.objectStore("login");
  var borrar = store.clear();

  borrar.onsuccess = function (e) {
    console.log("User logged out");
  };
  window.location.href = "./index.html";
}

let logout = document.getElementById("logout");
logout.addEventListener("click", (e) => {
  logOut(db);
});

openCreateDb(db);
