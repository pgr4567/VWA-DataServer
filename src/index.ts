import express from "express";
import fs from "fs";

const app = express();
const port = 3000;
const max_session_time_in_hours = 24;

app.get("/version", function (_, res) {
	res.send(fs.readFileSync("./version.txt"));
});

app.get("/maxSessionTime", function (req, res) {
	res.send("T" + max_session_time_in_hours);
});

app.listen(port, '0.0.0.0', () => {
	console.log(`VersionServer listening on port ${port}.`);
});