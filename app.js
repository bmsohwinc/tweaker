// Import
const express = require('express');
const mysql = require('mysql');

// create objects
const app = express();
app.use(express.static("public"));

// database objects
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'sour',
    password: 'sour',
    database: 'for_lab'
});

connection.connect();

// APIs
// 1. Home
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

// 2. db - testing
app.get("/db", function(req, res) {
    connection.query('select count(*) cnt from foo', function(err, rows, fields) {
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




// Listen
app.listen(3000, () => {
    console.log("Server started on PORT 3000!");
});

