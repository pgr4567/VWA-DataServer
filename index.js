const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const port = 3000;
const success = "SUCCESS";
const rg_username_exist = "ERROR: USERNAME EXISTS";
const lg_error = "ERROR: USERNAME OR PASSWORD INCORRECT";
const try_buy_error = "ERROR: USERNAME DOES NOT EXIST OR NOT ENOUGH BALANCE";
const invalid_username_password = "ERROR: INVALID USERNAME OR PASSWORD";
const username_not_exist = "ERROR: USERNAME DOES NOT EXIST";
const unexpected_error = "UNEXPECTED ERROR";
const session_update_error = "ERROR: SESSION TOKEN COULD NOT BE UPDATED";
const session_time_invalid = "ERROR: SESSION TIME IS INVALID";
const saltRounds = 10;
const max_session_time_in_hours = 24

let connParams = JSON.parse(fs.readFileSync("./conn.json"));
var con = mysql.createConnection({
	host: connParams.host,
	user: connParams.user,
	password: connParams.password,
	database: connParams.database
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
	if (username.trim() == "" || password.trim() == "" || username.length < 2 || password.length < 4) {
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

	let username = req.query.username;
	let item = req.query.item + ";";
	let price = parseInt(req.query.price);

	if (username == undefined || item == undefined || price == undefined) {
		res.send(unexpected_error);
		return;
	}

	con.query(
		"UPDATE players SET money = money - ?, items = CONCAT(IFNULL(items, ''), ?) WHERE username = ? AND money >= ?",
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

	let username = req.query.username;
	let amount = req.query.amount;

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

	let username = req.query.username;

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
		Object.keys(result).forEach(function (key) {
			var row = result[key];
			res.send(row.items);
			return;
		});
	});
});

app.get("/getMoney", function (req, res) {
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}

	let username = req.query.username;

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
		Object.keys(result).forEach(function (key) {
			var row = result[key];
			res.send("$" + row.money);
			return;
		});
	});
});

app.get("/version", function (req, res) {
	res.send(fs.readFileSync("./version.txt"));
});

app.get("/getSessionToken", function (req, res) {
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}

	let username = req.query.username;

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
		Object.keys(result).forEach(function (key) {
			var row = result[key];
			if (isValidSessionTime(row.session_time)) {
				res.send(row.session);
				return;
			}
			else {
				res.send(session_time_invalid);
				return;
			}
		});
	});
});

app.get("/getSessionTokenTime", function (req, res) {
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}

	let username = req.query.username;

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
		Object.keys(result).forEach(function (key) {
			var row = result[key];
			res.send(row.session_time);
			return;
		});
	});
});

app.get("/generateSessionToken", function (req, res) {
	if (req.query === undefined) {
		res.send(unexpected_error);
		return;
	}

	let username = req.query.username;

	if (username == undefined) {
		res.send(unexpected_error);
		return;
	}

	let sessionToken = generateSessionToken();
	con.query("UPDATE players SET session = ?, session_time = NOW() WHERE username = ?", [sessionToken, username], function (err, result) {
		if (err) {
			console.log(err);
			res.send(unexpected_error);
			return;
		}
		if (result.affectedRows == 0) {
			res.send(session_update_error);
			return;
		}
		res.send(success);
		return;
	});
});

app.get("/maxSessionTime", function (req, res) {
	res.send("T" + max_session_time_in_hours);
});

function generateSessionToken() {
	return crypto.randomBytes(24).toString("base64");
}

function isValidSessionTime (date) {
    const time = 1000 * 60 * 60 * max_session_time_in_hours;
    const lastTime = Date.now() - time;

    return date > lastTime;
}

app.listen(port, '0.0.0.0', () => {
	console.log(`AuthenticationServer listening on port ${port}.`);
});