/*
	Usage (PowerShell examples):
		# Create a new center owner user and CenterOwner doc
		node createCenterOwner.js --email owner@example.com --password P@ssw0rd --centerName "PC Center #1" --phone 99112233 --fullName "Owner Name"

		# Convert an existing user by email into a centerOwner and create/update CenterOwner doc, auto-approve
		node createCenterOwner.js --email existing@example.com --centerName "PC Hub" --approve

	Env:
		MONGO_URI=mongodb://localhost:27017/my-map-app (from .env if present)
*/
require("dotenv").config();
const mongoose = require("mongoose");
const minimist = require("minimist");
const User = require("./models/User");
const CenterOwner = require("./models/CenterOwner");

async function connect() {
	const uri = process.env.MONGO_URI || "mongodb://localhost:27017/my-map-app";
	await mongoose.connect(uri, {
		autoIndex: true
	});
	console.log("MongoDB connected:", uri);
}

function parseArgs() {
	const args = minimist(process.argv.slice(2));
	const required = ["email", "centerName"];
	const missing = required.filter((k) => !args[k]);
	if (missing.length) {
		console.error("Missing required args:", missing.join(", "));
		console.error(
			"Example: node createCenterOwner.js --email owner@example.com --password P@ssw0rd --centerName 'PC Center' --phone 99112233 --fullName 'Owner Name' --approve"
		);
		process.exit(1);
	}
	return {
		email: String(args.email).toLowerCase(),
		password: args.password ? String(args.password) : undefined,
		centerName: String(args.centerName),
		phone: args.phone ? String(args.phone) : undefined,
		fullName: args.fullName ? String(args.fullName) : undefined,
		approve: Boolean(args.approve)
	};
}

async function ensureCenterOwner({ email, password, centerName, phone, fullName, approve }) {
	// 1) Find or create user
	let user = await User.findOne({ email });

	if (!user) {
		if (!password) {
			throw new Error("No existing user found. --password is required to create a new user.");
		}
		user = new User({
			email,
			password,
			fullName: fullName || "",
			phone: phone || "",
			accountType: "centerOwner",
			role: "centerOwner",
			centerName,
			isApproved: Boolean(approve)
		});
		await user.save();
		console.log("Created new centerOwner user:", user._id.toString());
	} else {
		// Update existing user to be a center owner (unless admin)
		if (user.role === "admin") {
			throw new Error("This user is an admin. Refusing to convert admin to centerOwner.");
		}

		user.accountType = "centerOwner";
		user.role = "centerOwner";
		if (password) user.password = password; // will be hashed by pre-save
		if (phone) user.phone = phone;
		if (fullName) user.fullName = fullName;
		user.centerName = centerName;
		if (approve) user.isApproved = true;
		await user.save();
		console.log("Updated existing user to centerOwner:", user._id.toString());
	}

	// 2) Create or update CenterOwner doc
	let owner = await CenterOwner.findOne({ user: user._id });
	if (!owner) {
		owner = new CenterOwner({
			user: user._id,
			centerName,
			contactName: fullName || undefined,
			contactPhone: phone || undefined,
			isApproved: Boolean(approve || user.isApproved)
		});
	} else {
		owner.centerName = centerName;
		if (fullName) owner.contactName = fullName;
		if (phone) owner.contactPhone = phone;
		if (approve) owner.isApproved = true;
	}
	await owner.save();

	return { user, owner };
}

(async () => {
	try {
		const params = parseArgs();
		await connect();
		const { user, owner } = await ensureCenterOwner(params);
		console.log("CenterOwner ready:", {
			userId: user._id.toString(),
			email: user.email,
			role: user.role,
			accountType: user.accountType,
			isApproved: user.isApproved,
			centerOwnerId: owner._id.toString(),
			centerName: owner.centerName,
			ownerApproved: owner.isApproved
		});
	} catch (err) {
		console.error("Error:", err.message);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
})();
