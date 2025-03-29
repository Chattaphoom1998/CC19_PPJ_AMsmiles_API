const express = require("express");
const {
	createAdmin,
	updateAdmin,
	deleteAdmin,
	getAdminList,
	getAdmin,
} = require("../controllers/admin-controller");
const admin = require("../middlewares/admin");

const adminRoute = express.Router();

adminRoute.get("/list", getAdminList);
adminRoute.get("/:id", getAdmin);
adminRoute.patch("/update/:id", updateAdmin);
adminRoute.post("/create", admin, createAdmin);
adminRoute.delete("/delete/:id", admin, deleteAdmin);

module.exports = adminRoute;
