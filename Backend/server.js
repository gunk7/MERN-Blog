const express = require("express");
const app = express();
const connectDB = require("./config/database");
const PORT = process.env.PORT;
const cors = require("cors");
app.use(cors());
const allRoutes = require("./routes/routes");
connectDB();

app.use(express.urlencoded({ entended: true }));
app.use(express.json());
app.use("/api", allRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
