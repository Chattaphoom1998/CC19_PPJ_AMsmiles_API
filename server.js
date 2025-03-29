// import lib/middleware
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
require("dotenv").config();

//import local middlewares
const errorHandler = require("./middlewares/error");
const notfoundHandler = require("./middlewares/not-found");
const authenticate = require("./middlewares/authenticate");
const doctor = require("./middlewares/doctor");
const admin = require("./middlewares/admin");

//import routes
const authRoute = require("./routes/auth-route");
const scheduleRoute = require("./routes/schedule-route");
const serviceRoute = require("./routes/service-route");
const adminRoute = require("./routes/admin-route");
const clinicRoute = require("./routes/clinic-routes");
const notUser = require("./middlewares/not-user");
const userRoute = require("./routes/user-route");
const roomRoute = require("./routes/room-route");

////////////////////////////////////////////////////////////////////////////////////////////////
const app = express();

app.use(cors()); // allow cross domains
app.use(express.json()); // read requests json body
app.use(morgan("dev")); // Show log of http request in terminal
app.use(helmet()); //api secure

//Routes
//clinic
//public
app.use("/auth", authRoute);
//private
app.use("/schedule", authenticate, scheduleRoute);
app.use("/service", authenticate, serviceRoute);
app.use("/user", authenticate, userRoute);
app.use("/admin", authenticate, notUser, adminRoute);
app.use("/clinic", authenticate, admin, clinicRoute);
app.use("/room", authenticate, admin, roomRoute);

//hdl err
app.use(errorHandler);
app.use(notfoundHandler);
//Start Server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`server is running on port: ${PORT}`));
