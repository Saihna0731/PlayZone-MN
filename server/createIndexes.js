/*
	Ensure required indexes for performance and correctness

	Run:
		node createIndexes.js

	This will:
		- Sync schema-defined indexes for User, Center, CenterOwner
		- Ensure 2dsphere on Center.location
		- Create a text index on Center name/description for search convenience
*/
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Center = require("./models/Center");
const CenterOwner = require("./models/CenterOwner");

async function connect() {
	const uri = process.env.MONGO_URI || "mongodb://localhost:27017/my-map-app";
	await mongoose.connect(uri, { autoIndex: true });
	console.log("MongoDB connected:", uri);
}

async function ensureCenterIndexes() {
	// Extra helpful index for simple search by name/description
	try {
		await Center.collection.createIndex(
			{ name: "text", description: "text", longDescription: "text" },
			{ name: "center_text_search" }
		);
		console.log("Created text index on Center (name, description, longDescription)");
	} catch (e) {
		if (e.codeName === "IndexOptionsConflict") {
			console.log("Text index already exists with different options. Skipping.");
		} else if (e.message?.includes("already exists")) {
			console.log("Text index already exists. Skipping.");
		} else {
			console.warn("Text index creation warning:", e.message);
		}
	}

	// 2dsphere is already defined in schema; syncIndexes ensures it exists
}

async function main() {
	await connect();
	try {
		const results = {};

		results.User = await User.syncIndexes();
		console.log("User indexes synced");

		results.Center = await Center.syncIndexes();
		console.log("Center indexes synced (includes 2dsphere on location)");

		results.CenterOwner = await CenterOwner.syncIndexes();
		console.log("CenterOwner indexes synced");

		await ensureCenterIndexes();

		console.log("Index sync results:", Object.keys(results));
	} finally {
		await mongoose.disconnect();
	}
}

main().catch((err) => {
	console.error("Index creation failed:", err);
	process.exit(1);
});
