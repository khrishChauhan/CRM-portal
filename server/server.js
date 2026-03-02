const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Load .env FIRST before anything else
dotenv.config({ path: '../.env' });

// Now import routes (controllers will have access to env vars)
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use("/api/auth", authRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Error:", err));

app.get("/", (req, res) => {
    res.send("CRM API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});