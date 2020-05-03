/*   
    * NODE IS ASYNC - THAT'S WHY SO MUCH CLUTTER HERE.
    * CANNOT MAKE `CPP-STYLE` FUNC CALLS,
        AS FUNC CALLS WILL DAMAGE THE ORDER OF EXEC     
    
    * SO PLEASE USE INLINE FUNCS!!

*/


// Import
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const mysql = require('mysql');

// create objects and customize
const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');


const {
    PORT = 3000,
    SESS_SECRET = '!iamCAT',
    SESS_NAME = 'sid', 
    SESS_LIFETIME = 2 * 1000 * 60 * 60,
    NODE_ENV = 'development'
} = process.env;

const IN_PROD = NODE_ENV === 'production';
app.use(session({
    name : SESS_NAME,
    saveUninitialized : false,
    secret : SESS_SECRET,
    cookie : {
        maxAge : SESS_LIFETIME,
        sameSite : true,
        secure : IN_PROD
    }
}));


// database objects
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'tweaker',
    password: 'wethree',
    database: 'for_lab'
});

connection.connect();

// security checks and utility funcs
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/login');
    } else {
        next();
    }
};

const redirectHome = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/');
    } else {
        next();
    }
};


async function getUser(userId, username, password) {
    
    let user = {};
    let query = '';

    if (userId !== '') {
        query = `select * from user_profile where user_id='${userId}'`;

    } else {
        query = `select * from user_profile where user_name='${username}' and user_password='${password}'`;
    }

    console.log('query generated : ', query);

    connection.query(query, (err, rows, fields) => {
        if (err) {
            console.log(err);
            res.render("our_error");
            return user;
        }
        else {

            console.log(rows[0]);
            user = rows[0];
            console.log('(in getUser) got user as ', user);

            return user;
        }
    });

    return user;
}






// APIs

// ====== GETs
// 1. Home
app.get("/", function (req, res) {

    const {userId} = req.session;

    if (userId) {

        let user = {};

        let query = `select * from user_profile where user_id='${userId}'`;
        console.log('query generated : ', query);

        connection.query(query, (err, rows, fields) => {
            if (err) {
                console.log(err);
                res.render("our_error");                
            }
            else {
                console.log(rows[0]);
                user = rows[0];
                console.log('(in getUser) got user as ', user);
                res.render('home', {name : `${user.full_name}`, user_id : userId});
            }
            
        });
        
    }
    else {
        res.render('root');
    }
    
});


// 3. Login
app.get("/login", redirectHome, function(req, res) {
    res.render("login", {err_msg : ''});
});


// 4. Register
app.get("/register", redirectHome, function(req, res) {
    res.render("register", {err_msg : ''});
});

// 5. Profile 
app.get("/profile/:user_id", redirectLogin, function(req, res) {

	let user_id = req.params.user_id;
	let {userId} = (req.session);

	userId = userId.toString();

	let showEdit = false;

	if (userId === user_id) {
		
		// console.log('----------- Found the 2 ids same!');

		showEdit = true;
	}
	else {
		// console.log(`typeof user_id : ${typeof user_id}`);
		// console.log(`typeof userId : ${typeof userId}`);
		// console.log('user_id : ', user_id);
		// console.log('userId : ', userId);
		// console.log('----------- Found the 2 ids different!');
	}

	// res.send("You asked for /profile/" + user_id);
	
	let query = 'select user_name, full_name, place, phone_number, profile_pic_path, about from user_profile where user_id = ?';
	connection.query(query, [user_id], (err, rows, fields) => {
		if (err) {
			res.render("our_error");
		}
		else {
			res.render('profile', {user_data : rows[0], showEdit : showEdit});
		}
	});

});

// 6. All Tweakeratii
app.get("/pride", redirectLogin, function(req, res) {

	let {userId} = req.session;

    // get all profile data from the DB
    var query = "select user_id, user_name, full_name, place, about from user_profile";

    connection.query(query, function(err, rows, fields) {
        if (err) {
            res.render("our_error");
        }
        else {
            // console.log(rows);
            // console.log("---------");
            // console.log(rows[0]);            
            // console.log("---------");
            // console.log(rows[0].user_name);            
            res.render("all_users", { users : rows});
            // res.write("Got some data... processing!!");
            // res.end();
        }
    });
});

// 7. Error Page (504 - Server error)
app.get("/e504", function(req, res) {
    res.render("our_error");
});






// ====== POSTs
// 1. Login
app.post("/login", redirectHome, function(req, res) {
    
    const {username, password} = req.body;

    if (username && password) {
        // const user = await getUser('', username, password);

        // console.log('(in /post/login) got user as ', user);

        let query = 'select * from user_profile where user_name = ? and user_password = ?';

        

        connection.query(query, [username, password], (err, rows, fields) => {

            console.log('2. query generated : ', query);
            if (err) {
                console.log(err);
                res.render("our_error");
            }
            else {

                console.log(rows[0]);
                user = rows[0];
                console.log('(in getUser) got user as ', user);

                if (user) {
                    req.session.userId = user.user_id;
                    console.log('(in getUser) got user.id as ', user.user_id);
                    console.log('(in getUser) got user aset userId in cookies as ', req.session.userId);                    
                    res.redirect('/');
                } 
                else {
                    res.render('login', {err_msg : 'Username does not exist !!'});
                }

            }
        });
        
    }
    else {
        res.redirect('/login');
    }

});

// 2. Register
app.post("/register", redirectHome, async function(req, res) {
    
    const {username, password, name, place, mobile_number, about} = req.body;

    if (username && password && name && place && mobile_number) {
        // const exists = await getUser('', username, password);

        let query = 'select * from user_profile where user_name = ? and user_password = ?';

		// first check if user exists
        connection.query(query, [username, password], (err, rows, fields) => {

            if (err) {
                console.log(err);
                res.render("our_error");
            }
            else {

                console.log(rows[0]);
                user = rows[0];
                console.log('(in getUser) got user as ', user);

                if (user) {
					res.render('register', {err_msg : 'Username already exists!'});
                } 
                else {
					
					// Now we know this is New User. 

					let query = 'select count(*) as dbLen from user_profile';

					// get the no. of records 
					connection.query(query, (err, rows, fields) => {
						if (err) {
							console.log(err);
                			res.render("our_error");
						}
						else {

							// Now Insert to DB

							let userId = rows[0].dbLen + 1;

							let query = 'insert into user_profile values (?, ?, ?, ?, ?, ?, ?, ?)';

							connection.query(query, [userId, username, name, place, mobile_number, '', about, password], (err, rows) => {
								if (err) {
									console.log(err);
                					res.render("our_error");
								}
								else {
									console.log('Data inserted successfully!');
									req.session.userId = userId;
									res.redirect(`/profile/${userId}`);
								}
							})
						}
					});
                }
            }
        });

	}
	else {
		res.redirect('/register');
	}
});

// 3. Logout
app.post('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        res.redirect('/');
    });

    res.clearCookie(SESS_NAME);
});





// Listen
app.listen(3000, () => {
    console.log("Server started on PORT 3000!");
});




/*

Handle session:
https://codeforgeek.com/using-redis-to-handle-session-in-node-js/

*/