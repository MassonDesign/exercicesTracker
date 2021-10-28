const express = require("express");
const app = express();
const cors = require("cors");
if (process.env.NODE_ENV !== "production") {
	require("dotenv").config();
}
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const mySecret = process.env["MONGO_URI"];
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema({
	username: String,
});

const exercicesSchema = new Schema({
	username: String,
	description: String,
	duration: Number,
	date: String,
});

const logSchema = new Schema({
	username: String,
	count: Number,
	log: [
		{
			description: String,
			duration: Number,
			date: String,
		},
	],
});

const User = mongoose.model("User", userSchema);
const Exercices = mongoose.model("Exercices", exercicesSchema);
const Log = mongoose.model("Log", logSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res, next) => {
	const { username } = req.body;

	if (username != "") {
		const user = new User({
			username: username,
		});
		user.save((err, user) => {
			if (err) {
				return next(err);
			}
			res.json(201, {
				username: username,
			});
		});
	} else {
		res.json({
			error: "username is empty",
		});
	}
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
