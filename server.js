// import lib/middleware
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
require("dotenv").config();

//import local middlewares
const errorHandler = require("./middlewares/error");
const notfoundHandler = require("./middlewares/not-found");

//import routes
const authRoute = require("./routes/auth-route");

////////////////////////////////////////////////////////////////////////////////////////////////
const app = express();

app.use(cors()); // allow cross domains
app.use(express.json()); // read requests json body
app.use(morgan("dev")); // Show log of http request in terminal
app.use(helmet()); //api secure

//Routes
app.use("/auth", authRoute);

//hdl err
app.use(errorHandler);
app.use(notfoundHandler);
//Start Server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`server is running on port: ${PORT}`));
