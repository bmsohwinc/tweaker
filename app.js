// Import
const bodyParser = require('body-parser');
// const ejs = require("ejs");
const express = require('express');
const fs = require('fs');
const mysql = require('mysql');

// create objects
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'ejs');

// database objects
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'tweaker',
    password: 'wethree',
    database: 'for_lab'
});

connection.connect();

// APIs

// ====== GETs
// 1. Home
app.get("/", function (req, res) {
    // res.sendFile(__dirname + "/public/htmls/index.html");
    res.render("home", {name: 'Me hu Jean. Me hu bada taakatwar.!'});
});

// 2. db - testing
app.get("/db", function(req, res) {

    // open the respective file from the DB folder
    var file_path = __dirname + "/db/dml/test_query.txt";
    var that_query;

    try {
        that_query = fs.readFileSync(file_path, 'utf-8');            
    } catch (e) {
        console.log('Error was: ', e.stack);
    } 

    console.log(that_query);

    connection.query(that_query, function(err, rows, fields) {
        if (err) {
            res.write("There was an error in the query processing!");
        }
        else {
            // console.log("Solution is: ",  rows[0].solution, "type = ", typeof(rows[0].solution));
            console.log(rows); 
            // console.log(rows[0]); 
            // console.log(rows[0].x); 
            res.write("Hi\n");           
            res.write("Solution is: " + (rows[0].cnt));
            res.end();
        }
    });

});

// 3. Login
app.get("/login", function(req, res) {
    res.render("login");
});


// 4. Register
app.get("/register", function(req, res) {
    res.render("register");
});

// 5. Profile 
app.get("/profile", function(req, res) {

    var test_data = {
        user_handle : "tourist",
        name : "gennady",
        password : "******",
        place : "belarus",
        mobile_number : 111111111
    };

    res.render("profile", {user_data : test_data});
});
//6. About
app.get("/about",function(req,res){
	res.render("about");
});



// ====== POSTs
// 1. Login
app.post("/login", function(req, res) {
    console.log(req.body);
    res.render("foo");
});

// 2. Register
app.post("/register", function(req, res) {
    console.log(req.body);
    res.redirect("/profile");
});




// Listen
app.listen(3000, () => {
    console.log("Server started on PORT 3000!");
});

