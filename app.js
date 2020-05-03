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


	/*
		user_id : other user (or may be the curr user itself) that the curr_user has requested

		userId : the current user in the session
	*/

	let user_id = req.params.user_id;
	let {userId} = (req.session);

	userId = userId.toString();

	let showEdit = false;
	let showFollow = true;

	if (userId === user_id) {
		
		// console.log('----------- Found the 2 ids same!');

		showEdit = true;
		showFollow = false;
	}
	else {
		// console.log(`typeof user_id : ${typeof user_id}`);
		// console.log(`typeof userId : ${typeof userId}`);
		// console.log('user_id : ', user_id);
		// console.log('userId : ', userId);
		// console.log('----------- Found the 2 ids different!');
	}

	// first get all the data of that user
	let query = 'select user_name, full_name, place, phone_number, profile_pic_path, about from user_profile where user_id = ?';
	connection.query(query, [user_id], (err, rows1, fields) => {
		if (err) {
			res.render("our_error");
		}
		else {

			// now, check if the current user already follows the user-in-page requested

			let query = 'select count(*) as rec_count from following where user_id = ? and follows_id = ?';

			connection.query(query, [userId, user_id], (err, rows, fields) => {
				if (err) {
					res.render("our_error");
				}
				else {
					if (rows[0].rec_count === 0) {
						// current user has requested page of a new person
						showFollow = true;
					}
					else {
						// current user already follows this person
						showFollow = false;
					}

					if (userId === user_id) {
						showFollow = false;
					}

					res.render('profile', {user_data : rows1[0], showEdit : showEdit, showFollow : showFollow, user_id : user_id});
				}
			});			
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


// 8. Edit Profile
app.get('/edit_profile', redirectLogin, (req, res) => {
	
	let {userId} = req.session;

	let query = 'select * from user_profile where user_id = ?';

	connection.query(query, [userId], (err, rows, fields) => {
		if (err) {
			console.log(err);
            res.render("our_error");
		}
		else {
			res.render('edit_profile', {user_data : rows[0], err_msg : ''});
		}
	});
	
});

// 9. Tweet
app.get('/tweet', redirectLogin, (req, res) => {

	const {userId} = req.session;

	let user = {};

	let query = `select full_name from user_profile where user_id='${userId}'`;
	console.log('query generated : ', query);

	connection.query(query, (err, rows, fields) => {
		if (err) {
			console.log(err);
			res.render("our_error");                
		}
		else {
			res.render('tweet', {name : rows[0].full_name, user_id : userId});
		}
		
	});

});

// 10. All Tweets
app.get('/all_tweets', redirectLogin, (req, res) => {
	let query = 'select t.tweet_id, t.tweet_msg, t.user_id, t.date_of_tweet, t.number_of_likes, u.user_name ' +
				'from tweets t ' +
				'left join user_profile u on t.user_id = u.user_id ' +
				'order by t.number_of_likes desc';

	connection.query(query, (err, rows) => {
		if (err) {
			console.log(err);
			res.render("our_error");                
		}
		else {
			res.render('all_tweets', {tweets : rows});
		}
	})
});

// 11. One Full Tweet
app.get('/one_full_tweet/:tweet_id', redirectLogin, (req, res) => {

	const tweet_id = req.params.tweet_id;
	let {userId} = req.session;

	let query = 'select * from tweets where tweet_id = ?';
	console.log('query generated : ', query);

	connection.query(query, [tweet_id], (err, rows1, fields) => {
		if (err) {
			console.log(err);
			res.render("our_error");                
		}
		else {

			console.log('-----------------------');
			console.log('tweet_id: ', tweet_id);
			console.log(rows1);
			
			let query = 'select user_name from user_profile where user_id = ?';

			connection.query(query, [userId], (err, rows2) => {
				if (err) {
					console.log(err);
					res.render("our_error");                
				}
				else {
					let user_name = rows2[0].user_name;

					let query = 'select * from comments where tweet_id = ? and user_id = ?';

					connection.query(query, [tweet_id, userId], (err, rows3) => {
						if (err) {
							console.log(err);
							res.render("our_error");                
						}
						else {
							console.log('rows3:', rows3);
							res.render('one_full_tweet', {tweet : rows1[0], user_name : user_name, comments : rows3});
						}
					});
				}
			});
		}
		
	});

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
app.post("/register", redirectHome, function(req, res) {
    
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

// 4. Follow 
app.post('/follow_new_user', redirectLogin, (req, res) => {
	const {user_id} =  req.body;
	let {userId}  = req.session;
	userId = userId.toString();

	let query = 'insert into following values (?, ?)';

	connection.query(query, [userId, user_id], (err, rows) => {
		if (err) {
			console.log(err);
			res.render("our_error");
		}
		else {
			console.log('< Following > Data inserted into the DB successfully');
			let new_url = '/profile/' + user_id;
			res.redirect(new_url);
		}
	});

});

// 5. Edit Profile
app.post('/edit_profile', redirectLogin, (req, res) => {
	let {name, place, password, mobile_number, about} = req.body;
	let {userId} = req.session;

	let query = 'update user_profile ' + 
		'set full_name = ?, ' +
			'place = ?, ' +
			'phone_number = ?, ' +
			'about = ?, ' + 
			'user_password = ? ' + 
		'where user_id = ? ';

	console.log('your query: ' + query);

	connection.query(query, [name, place, mobile_number, about, password, userId], (err, rows) => {
		if (err) {
			console.log(err);
			res.render('our_error');
		}
		else {
			console.log('< Updating > Data updated successfully!');
			const new_url = '/profile/' + (userId.toString());
			res.redirect(new_url);
		}
	});
});

// 6. Tweet
app.post('/tweet', redirectLogin, (req, res) => {
	const {userId} = req.session;
	const {tweet_data} = req.body;

	let query = 'select count(*) as tweets_count from tweets';

	connection.query(query, (err, rows1) => {
		if (err) {
			console.log(err);
			res.render('our_error');
		}
		else {
			let query = 'insert into tweets values (?, ?, ?, ?, ?)';
			let new_tweet_id = rows1[0].tweets_count + 1;
			let intial_likes = 0;
			const this_time = new Date().toISOString().slice(0, 10);

			connection.query(query, [new_tweet_id, tweet_data, userId, this_time, intial_likes], (err, rows2) => {
				if (err) {
					console.log(err);
					res.render('our_error');
				}
				else {
					console.log('< Tweet > Data successfully added to DB');
					res.redirect('/');
				}		
			});
		}
	});
});

// 7. Liked a Tweet
app.post('/liked_tweet', redirectLogin, (req, res) => {
	const {tweet_id, user_id} = req.body;

	let query = 'update tweets ' +
				'set number_of_likes = number_of_likes + 1 ' +
				'where tweet_id = ?';

	connection.query(query, [tweet_id], (err, rows) => {
		if (err) {
			console.log(err);
			res.render('our_error');
		}
		else {
			console.log('< Liked > Tweet was liked successfully!');
			res.redirect('/all_tweets');
		}
	});

});

// 8. Posted comment
app.post('/comment/:tweet_id', redirectLogin, (req, res) => {

	const tweet_id = req.params.tweet_id;
	const {userId} = req.session;
	const {comment_data} = req.body;

	let query = 'select count(*) as cmtLen from comments';
	console.log('query generated : ', query);

	connection.query(query, (err, rows, fields) => {
		if (err) {
			console.log(err);
			res.render("our_error");                
		}
		else {

			let query = 'insert into comments values (?, ?, ?, ?, ?, ?)';

			let new_cmt_id = rows[0].cmtLen + 1;
			let intial_likes = 0;
			const this_time = new Date().toISOString().slice(0, 10);

			connection.query(query, [new_cmt_id, userId, tweet_id, this_time, intial_likes, comment_data], (err, rows) => {				
				if (err) {
					console.log(err);
					res.render("our_error");                
				}
				else {
					console.log('< Comment > Data successfully added to DB');
					res.redirect('/all_tweets');
				}
			});
		}
		
	});

});



// Listen
app.listen(3000, () => {
    console.log("Server started on PORT 3000!");
});




/*

Handle session:
https://codeforgeek.com/using-redis-to-handle-session-in-node-js/

*/
