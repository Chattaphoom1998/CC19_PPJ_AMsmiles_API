const express = require("express");
const admin = require("../middlewares/admin");
const {
	getUserList,
	getUser,
	createUser,
	updateUser,
	deleteUser,
} = require("../controllers/user-controller");

const userRoute = express.Router();

userRoute.get("/list", getUserList);
userRoute.get("/:id", getUser);
userRoute.patch("/update/:id", updateUser); //user admin
userRoute.post("/create", admin, createUser);
userRoute.delete("/delete/:id", admin, deleteUser);

module.exports = userRoute;
