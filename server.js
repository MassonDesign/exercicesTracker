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
			_id: false,
			description: String,
			duration: Number,
			date: String,
		},
	],
});

const User = mongoose.model("User", userSchema);

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
	//console.log(req.params);
	//console.log(req.body);

	const { _id } = req.params;
	const { description } = req.body;
	const duration = Number(req.body.duration);
	var { date } = req.body;

	if (date === "") {
		date = new Date().toDateString();
		//console.log(date);
	} else if (isNaN(new Date(date))) {
		date = new Date().toDateString();
	} else {
		date = new Date(Date.parse(date)).toDateString();
	}

	if (duration === "" && description === "") {
		res.json({
			error: "No description and duration entered",
		});
	}
	if (description === "") {
		res.json({
			error: "No description entered",
		});
	}

	if (duration === "") {
		res.json({
			error: "No duration entered",
		});
	}

	User.findById(_id, (err, user) => {
		if (err) {
			console.log(err);
		}
		user.count += 1;
		//console.log(user.count);
		user.log.push({
			description: description,
			duration: duration,
			date: date,
		});
		user.save();
		//console.log(user);
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
	//console.log(req.params);
	const { _id } = req.params;
	const from = new Date(req.query.from);
	const to = new Date(req.query.to);
	const { limit } = req.query;

	if (
		isNaN(from.getTime()) == false ||
		isNaN(to.getTime()) == false ||
		isNaN(limit) == false
	) {
		// filter by date as per Url querys
		User.findById(_id, (err, user) => {
			if (err) {
				return console.log(err);
			}
			//console.log(user);

			if (isNaN(from.getTime()) == false && isNaN(to.getTime()) == false) {
				filteredLog = user.log.filter((user) => {
					return new Date(user.date) >= from && new Date(user.date) <= to;
				});
			}

			if (isNaN(from.getTime()) == false && isNaN(to.getTime())) {
				filteredLog = user.log.filter((user) => {
					return new Date(user.date) >= from;
				});
			}

			if (isNaN(from.getTime()) && isNaN(to.getTime()) == false) {
				filteredLog = user.log.filter((user) => {
					return new Date(user.date) <= to;
				});
			}

			if (isNaN(limit) == false) {
				filteredLog = filteredLog.splice(limit);
			}

			res.json({
				_id: _id,
				username: user.username,
				count: filteredLog.length,
				log: filteredLog,
			});
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
