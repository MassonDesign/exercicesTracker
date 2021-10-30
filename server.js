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
	count: Number,
	log: [
		{
			description: String,
			duration: Number,
			date: String,
		},
	],
});

// const exercicesSchema = new Schema({
// 	username: String,
// 	description: String,
// 	duration: Number,
// 	date: String,
// });

// const logSchema = new Schema({
// 	username: String,
// 	count: Number,
// 	log: [
// 		{
// 			description: String,
// 			duration: Number,
// 			date: String,
// 		},
// 	],
// });

const User = mongoose.model("User", userSchema);
// const Exercices = mongoose.model("Exercices", exercicesSchema);
// const Log = mongoose.model("Log", logSchema);

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
			count: 0,
			log: [],
		});
		user.save((err, user) => {
			if (err) {
				return next(err);
			}
			res.json(201, {
				username: username,
				_id: user.id,
			});
		});
	} else {
		res.json({
			error: "username is empty",
		});
	}
});

app.get("/api/users", (req, res) => {
	User.find({})
		.select("username _id")
		.exec((err, users) => {
			if (err) {
				return console.log(err);
			}
			//console.log(users);
			res.json(users);
		});
});

app.post("/api/users/:_id/exercises", (req, res) => {
	console.log(req.params);
	console.log(req.body);

	const { _id } = req.params;
	const { description } = req.body;
	const duration = Number(req.body.duration);
	var { date } = req.body;

	if (date === "") {
		date = new Date().toDateString();
		console.log(date);
	} else {
		date = new Date(Date.parse(date)).toDateString();
	}

	User.findById(_id, (err, user) => {
		if (err) {
			console.log(err);
		}
		user.count += 1;
		console.log(user.count);
		user.log.push({
			description: description,
			duration: duration,
			date: date,
		});
		user.save();
		console.log(user);
		res.json({
			_id: _id,
			username: user.username,
			description: description,
			duration: duration,
			date: date,
		});
	});
});

app.get("/api/users/:_id/logs", (req, res) => {
	console.log(req.params);
	const { _id } = req.params;
	const from = new Date(req.query.from);
	const to = new Date(req.query.to);
	const { limit } = req.query;

	if (from != "" || to != "" || limit != "") {
		User.findById(_id, (err, user) => {
			if (err) {
				return console.log(err);
			}
			console.log(user);
			user = user.log.filter((user) => {
				return new Date(user.date) >= from && new Date(user.date) <= to;
			});
			res.json(user);
		});
	} else {
		User.findById(_id)
			.select("_id username count log")
			.exec((err, user) => {
				if (err) {
					return console.log(err);
				}
				//console.log(users);
				res.json(user);
			});
	}
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
