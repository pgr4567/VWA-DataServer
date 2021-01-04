const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");

const app = express();
const port = 3000;
const success = "SUCCESS";
const rg_username_exist = "ERROR: USERNAME EXISTS";
const lg_error = "ERROR: USERNAME OR PASSWORD INCORRECT";
const try_buy_error = "ERROR: USERNAME DOES NOT EXIST OR NOT ENOUGH BALANCE";
const invalid_username_password = "ERROR: INVALID USERNAME OR PASSWORD";
const username_not_exist = "ERROR: USERNAME DOES NOT EXIST";
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
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}
	let username = req.query.username;
	let password = req.query.password;

	if (username == undefined || password == undefined) {
		res.send(unexpected_error);
		return;
	}
	if (username.trim() == "" || password.trim() == "" || username.length < 2 || password.length < 5) {
		res.send(invalid_username_password);
		return;
	}

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
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}
	let username = req.query.username;
	let password = req.query.password;

	if (username == undefined || password == undefined) {
		res.send(unexpected_error);
		return;
	}

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
			bcrypt.compare(password, row.password, function (err, result) {
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

app.get("/tryBuy", function (req, res) {
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}

	let username = req.body.username;
	let item = req.body.username + ";";
	let price = req.body.price;

	if (username == undefined || item == undefined || price == undefined) {
		res.send(unexpected_error);
		return;
	}

	con.query(
		"UPDATE players SET money = money - ?, items = items + ? WHERE username = ? and money > ?",
		[price, item, username, price],
		function (err, result) {
			if (err) {
				console.log(err);
				res.send(unexpected_error);
				return;
			}
			if (result.affectedRows == 0) {
				res.send(try_buy_error);
				return;
			}
			res.send(success);
			return;
		}
	);
});

app.get("/addMoney", function (req, res) {
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}

	let username = req.body.username;
	let amount = req.body.amount;

	if (username == undefined || amount == undefined) {
		res.send(unexpected_error);
		return;
	}

	con.query(
		"UPDATE players SET money = money + ? WHERE username = ?",
		[amount, username],
		function (err, result) {
			if (err) {
				console.log(err);
				res.send(unexpected_error);
				return;
			}
			if (result.affectedRows == 0) {
				res.send(username_not_exist);
				return;
			}
			res.send(success);
			return;
		}
	);
});

app.get("/getInventory", function (req, res) {
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}

	let username = req.body.username;

	if (username == undefined) {
		res.send(unexpected_error);
		return;
	}

	con.query("SELECT * FROM players WHERE username = ?", [username], function (err, result) {
		if (err) {
			console.log(err);
			res.send(unexpected_error);
			return;
		}
		if (Object.keys(result).length == 0) {
			res.send(username_not_exist);
			return;
		}
		res.send(result.items);
	});
});

app.listen(port, '127.0.0.1', () => {
	console.log(`AuthenticationServer listening on port ${port}.`);
});