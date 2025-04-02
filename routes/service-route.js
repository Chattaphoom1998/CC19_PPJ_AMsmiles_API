const express = require("express");
const {
	updateService,
	createService,
	deleteService,
	getService,
	getBookedSlots,
	getTempBookedSlots,
	getServicesByClinic,
} = require("../controllers/service-controller");
const notUser = require("../middlewares/not-user");
const overlappingSchedules = require("../middlewares/overlappingSchedule");
const serviceStatusUpdate = require("../middlewares/serviceStatusUpdate");

const serviceRoute = express.Router();
//user, doctor, admin
serviceRoute.get("/booked", getBookedSlots);
serviceRoute.get("/booked-temp", getTempBookedSlots);
serviceRoute.get("/by-clinic", getServicesByClinic);
serviceRoute.get("/:id", getService);

serviceRoute.patch("/update/:id", serviceStatusUpdate, updateService);

//doctor, admin
serviceRoute.post("/create", notUser, overlappingSchedules, createService);
serviceRoute.delete("/delete/:id", notUser, deleteService);

module.exports = serviceRoute;
