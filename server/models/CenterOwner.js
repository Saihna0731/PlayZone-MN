const mongoose = require("mongoose");

// CenterOwner keeps owner-specific domain data, separate from auth/user account
// Links 1:1 to a User document with accountType 'centerOwner' and role 'centerOwner'
const CenterOwnerSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true
		},
		centerName: {
			type: String,
			required: true,
			trim: true
		},
		contactName: {
			type: String,
			trim: true
		},
		contactPhone: {
			type: String,
			trim: true
		},
		// Whether this owner is approved by admin to operate
		isApproved: {
			type: Boolean,
			default: false
		},
		// Optionally track centers created by this owner
		centers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Center"
			}
		]
	},
	{ timestamps: true }
);

// Fast lookups by centerName and approval state
CenterOwnerSchema.index({ centerName: 1 });
CenterOwnerSchema.index({ isApproved: 1 });

// Convenience method to approve owner
CenterOwnerSchema.methods.approve = async function () {
	this.isApproved = true;
	return this.save();
};

module.exports = mongoose.model("CenterOwner", CenterOwnerSchema);
