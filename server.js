const express = require("express");
const app = express();
const connectDB = require("./config/database");
const PORT = process.env.PORT;
const authRoutes = require("./routes/authRoutes");
connectDB();

app.use(express.urlencoded({ entended: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
