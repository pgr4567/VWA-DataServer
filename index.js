const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");

const app = express();
const port = 3000;
const success = "SUCCESS";
const rg_username_exist = "ERROR: USERNAME EXISTS";
const lg_error = "ERROR: USERNAME OR PASSWORD INCORRECT";
const unexpected_error = "UNEXPECTED ERROR";
const saltRounds = 10;

var con = mysql.createConnection({
	host: "localhost",
	user: "username",
	password: "password",
	database: "database",
});
con.connect(function (err) {
	if (err) return
	console.log("Connected!");
});

app.get("/register", function (req, res) {
	if (req.body === undefined) {
		res.send(unexpected_error);
		return;
	}
	let username = req.body.username;
	let password = req.body.password;

	con.query("SELECT * FROM players WHERE username = ?", [username], function (
		err,
		result
	) {
		if (err) {
			console.log(err);
			res.send(unexpected_error);
			return;
		}
		if (Object.keys(result).length > 0) {
			res.send(rg_username_exist);
			return;
		}
		bcrypt.hash(password, saltRounds, function (err, hash) {
			if (err) {
				console.log(err);
				res.send(unexpected_error);
				return;
			}
			con.query(
				"INSERT INTO players (username, password) VALUES (?, ?)",
				[username, hash],
				function (err) {
					if (err) {
						console.log(err);
						res.send(unexpected_error);
						return;
					}
					res.send(success);
					return;
				}
			);
		});
	});
});

app.get("/login", function (req, res) {
	if (req.body === undefined) {
		res.send(unexpected_error);
		return;
	}
	let username = req.body.username;
	let password = req.body.password;

	con.query("SELECT * FROM players WHERE username = ?", [username], function (
		err,
		result
	) {
		if (err) {
			console.log(err);
			res.send(unexpected_error);
			return;
		}
		if (Object.keys(result).length == 0) {
			res.send(lg_error);
			return;
		}
		Object.keys(result).forEach(function (key) {
			var row = result[key];
			bcrypt.compare(password, row. q, function (err, result) {
				if (err) {
					console.log(err);
					res.send(unexpected_error);
					return;
				}
				if (result) {
					res.send(success);
					return;
				} else {
					res.send(lg_error);
					return;
				}
			});
		});
	});
});

app.listen(port, '0.0.0.0', () => {
	console.log(`AuthenticationServer listening on port ${port}.`);
});
