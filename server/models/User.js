const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            // Optional for Admin (OTP) and Client (Google)
        },
        staffId: {
            type: String,
            unique: true,
            sparse: true, // Only for staff
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Only for clients using Google
        },
        role: {
            type: String,
            enum: ["admin", "staff", "client"],
            default: "client",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);