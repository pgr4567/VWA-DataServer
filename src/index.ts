import express from "express";
import fs from "fs";

const app = express();
const port = 3000;

app.get("/version", function (_, res) {
	res.send(fs.readFileSync("./version.txt"));
});

app.listen(port, '0.0.0.0', () => {
	console.log(`VersionServer listening on port ${port}.`);
});