const url = require('url')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose() //verbose provides more detailed stack trace
const db = new sqlite3.Database('data/users.db')

//notice navigation to parent directory:
const headerFilePath = __dirname + '/../views/header.html'
const footerFilePath = __dirname + '/../views/footer.html'
const signupFilePath = __dirname + '/../views/signup.html'

/*
db.serialize(function() {
  //make sure a couple of users exist in the database.
  //user: ldnel password: secret
  //user: frank password: secret2
  let sqlString = "CREATE TABLE IF NOT EXISTS users (userid TEXT PRIMARY KEY, password TEXT)"
  db.run(sqlString)
  sqlString = "INSERT OR REPLACE INTO users VALUES ('ldnel', 'secret')"
  db.run(sqlString)
  sqlString = "INSERT OR REPLACE INTO users VALUES ('frank', 'secret2')"
  db.run(sqlString)
})
*/




function isValidUser(username, password, callback) {
  // Perform validation against your database
  // Return true if the user is valid, otherwise false
  // (This is a placeholder, replace with actual logic)
  //return (username === 'user' && password === 'password');

  db.all("SELECT username, password, role FROM user_table", function (err, rows) {
    if (err) {
      console.error("Database error:", err);
      callback({ valid: false });
    } else {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].username === username && rows[i].password === password) {
          callback({ valid: true, user_role: rows[i].role, username: rows[i].username });
          return; // Match found
        }
      }
      callback({ valid: false }); // No match found
    }
  });


};

function canAddUser(username, callback) {
  // Perform validation against your database
  // Return true if the user is valid, otherwise false
  // (This is a placeholder, replace with actual logic)
  //return (username === 'user' && password === 'password');

  db.all("SELECT username, password, role FROM user_table", function (err, rows) {
    if (err) {
      console.error("Database error:", err);
      callback({ valid: false });
    } else {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].username === username) {
          callback({ valid: false });
          return; // Match found
        }
      }
      callback({ valid: true }); // No match found
    }
  });


};

function getUsers(callback){
  let users = []
  db.all("SELECT username, password, role FROM user_table", function (err, rows) {
    
    if (err) {
      console.error("Database error:", err);
      callback({ list: users });
    } else {

      for (var i = 0; i < rows.length; i++) {
        let thisuser = []
        thisuser.push(rows[i].username)
        thisuser.push(rows[i].password)
        thisuser.push(rows[i].role)
        users.push(thisuser)

      }
      console.log("list is ")
      console.log(users)
      callback({ list: users }); 
    }
  });
}

/*
function isValidUser(username, password) {
  return new Promise((resolve, reject) => {
    // Perform validation against your database
    // Replace the following code with your actual database query
    db.all("SELECT username, password, role FROM user_table", function (err, rows) {
      if (err) {
        console.error("Database error:", err);
        reject(err);
      } else {
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].username === username && rows[i].password === password) {
            resolve({ valid: true, user_role: rows[i].role, username: rows[i].username });
            return; // Match found
          }
        }
        resolve({ valid: false }); // No match found
      }
    });
  });
}
*/


exports.authenticate = function(request, response, next) {
  console.log("Authenticating...")
  console.log('Path:', request.path);
  console.log('Is Authenticated:', request.session.isAuthenticated);
  if (!request.session.isAuthenticated) {
    return response.redirect('/login'); // Redirect to the login page if not authenticated
  }

  next();

};




// Replace this with your actual database query/validation logic





function handleError(response, err) {
  //report file reading error to console and client
  console.log('ERROR: ' + JSON.stringify(err))
  //respond with not found 404 to client
  response.writeHead(404)
  response.end(JSON.stringify(err))
}

/*
CAN YOU FIND A BETTER WAY TO HANDLE THE NEXT THREE CUT AND PASTE FUNCTIONS:
*/

function send_find_data(request, response, rows) {
  /*
  This code assembles the response from two partial .html files
  with the data placed between the two parts
  This CLUMSY approach is done here to motivivate the need for
  template rendering. Here we use basic node.js file reading to
  simulate placing data within a file.
  */
  //notice navigation to parent directory:
  fs.readFile(headerFilePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
    response.write(data)

    //INSERT DATA
    for (let row of rows) {
      response.write(`<p><a href= 'song/${row.id}'>${row.id} ${row.title}</a></p>`)
    }

    fs.readFile(footerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
      response.end()
    })
  })
}

function send_users(request, response, rows) {
  /*
  This code assembles the response from two partial .html files
  with the data placed between the two parts
  This CLUMSY approach is done here to motivivate the need for
  template rendering. Here we use basic node.js file reading to
  simulate placing data within a file.
  */
  fs.readFile(headerFilePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
    response.write(data)

    //INSERT DATA
    for (let row of rows) {
      console.log(row)
      response.write(`<p>user: ${row.userid} password: ${row.password}</p>`)
    }

    fs.readFile(footerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
      response.end()
    })
  })
}

/*
exports.index = function(request, response) {
  // index.html
  fs.readFile(headerFilePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
    response.write(data)

    //INSERT DATA -no data to insert

    fs.readFile(footerFilePath, function(err, data) {
      if (err) {
        handleError(response, err);
        return;
      }
      response.write(data)
      response.end()
    })
  })
}
*/

function parseURL(request, response) {
  const PARSE_QUERY = true //parseQueryStringIfTrue
  const SLASH_HOST = true //slashDenoteHostIfTrue
  let urlObj = url.parse(request.url, PARSE_QUERY, SLASH_HOST)
  console.log('path:')
  console.log(urlObj.path)
  console.log('query:')
  console.log(urlObj.query)
  return urlObj

}


exports.signup = function(request,response){
  if (request.method === 'POST' && request.path === '/signup') {
    const { username, password } = request.body;

    
    //check if username already exists
    
    canAddUser(username, function(result) {
    //if not, add username and password with guest role to database
    //redirect to login

    if (result.valid) {
      const sqlString = "INSERT INTO user_table VALUES ('"+username+"', '"+password+"', 'guest')"
      db.run(sqlString)
      const sqlString2 = "INSERT INTO user_stops VALUES ('"+username+"', 'none')"
      db.run(sqlString2)
      response.redirect('/login')
    }

     //if yes, tell user the username already exists
    else{
      response.render('signup', { error: 'Username already exists' });
    }

    });
  }
  else{
    response.render('signup');
  }
}
exports.mystop = function(request, response){
  const usernameToSearch = request.session.username;

// Query to retrieve the stop for a specific username
  const query = `SELECT stop FROM user_stops WHERE username = ?`;

  let stop = 'none'
  db.get(query, [usernameToSearch], (err, row) => {
    if (err) {
      console.error('Error executing query:', err);
      // Handle the error, send a response, or perform other actions
    } else {
      if (row) {
        stop = row.stop;
        console.log(`Stop for ${usernameToSearch}: ${stop}`);
        // Do something with the retrieved stop information
      } else {
        console.log(`No entry found for username: ${usernameToSearch}`);
        // Handle the case where no entry is found for the given username
      }
    }
  });

  
}
exports.users = function(request, response) {

  if(request.session.user_role === 'admin'){
    getUsers(function(result) {
      let users = result.list
      console.log("returned list is")
      console.log(users)
      response.render('users', {users: users})
      });
  }
  else{
    response.send("User is not admin")
  }

}

exports.login = function(request, response) {
  
  

  if (request.method === 'POST' && request.path === '/login') {
    console.log('user sent in login request');
    // Handle form submission for login
    const { username, password } = request.body;
  
    // Validate credentials against the database
    // (Replace this with your actual database query)
    isValidUser(username, password, function(result) {
      if (result.valid) {
        console.log("Credentials valid")
        request.session.user_role = result.user_role; // Set the user role
        request.session.username = result.username; // Set the username
        request.session.isAuthenticated = true;
        
        console.log('Path:', request.path);
        console.log('Is Authenticated:', request.session.isAuthenticated);
        
        console.log('will redirect...');
        response.redirect('/home'); // Return to avoid sending another response
      } else {
        response.render('login', { error: 'Invalid credentials' });
        console.log('invalid');
      }
      //next(); // Move next() inside the callback
    });
  }
  else{
    response.render('login');
  }

};



/*
function checkDatabaseForUser(username, password, callback) {
  // Replace this with your actual database query logic
  console.log("in function with ", username, ", ", password);
  db.all("SELECT username, password, role FROM user_table", function (err, rows) {
    if (err) {
      console.error("Database error:", err);
      return callback(false, username); // Assuming an error means no match
    }

    for (var i = 0; i < rows.length; i++) {
      if (rows[i].username === username && rows[i].password === password) {
        return callback(true, username); // Match found
      }
    }

    callback(false, username); // No match found
  });
}

exports.handleLogin = function (request, response) {
  const { username, password } = request.body;

  checkDatabaseForUser(username, password, function (matchFound, enteredUsername) {
    if (matchFound) {
      // Successful login, perform redirection or other actions
      // You can redirect to a new page using response.redirect('/dashboard');
      response.send("Login successful! Redirecting...");
    } else {
      // Failed login, send response with alert message and entered username
      exports.login(request, response)
      /*
      response.render('login', {
       
        alertMessage: 'Failed login. Invalid username or password.',
        enteredUsername: enteredUsername,
      });
      
    }
  });
};
*/


/*
exports.songDetails = function(request, response) {
  // /song/235
  let urlObj = parseURL(request, response)
  let songID = urlObj.path
  songID = songID.substring(songID.lastIndexOf("/") + 1, songID.length)

  let sql = "SELECT id, title, composer, key, bars FROM songs WHERE id=" + songID
  console.log("GET SONG DETAILS: " + songID)

  db.all(sql, function(err, rows) {
    console.log('Song Details Data')
    send_song_details(request, response, rows)
  })
}
*/
/*
exports.home = function(request, response){
  console.log('home!')
  let urlObj = parseURL(request, response)
  let username = 'gleb'
  response.render('home', { username })
 
  console.log("testing")
  

}
*/
