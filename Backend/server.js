require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/database");
const path = require("path");
const PORT = process.env.PORT;
const cors = require("cors");
app.use(cors());
const allRoutes = require("./routes/routes");

const {blogScheduler }= require("./services/cronService");

connectDB();

blogScheduler();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", allRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
