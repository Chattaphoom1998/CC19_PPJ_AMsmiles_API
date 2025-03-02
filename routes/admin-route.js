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
adminRoute.post("/create", createAdmin);
adminRoute.patch("/update/:id", updateAdmin);
adminRoute.delete("/delete/:id", admin, deleteAdmin);

module.exports = adminRoute;
