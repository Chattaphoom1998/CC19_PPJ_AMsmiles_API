const express = require("express");
const {
	getScheduleList,
	createSchedule,
	updateSchedule,
	deleteSchedule,
	getSchedule,
} = require("../controllers/schedule-controller");
const overlappingSchedules = require("../middlewares/overlappingSchedule");
const admin = require("../middlewares/admin");

const scheduleRoute = express.Router();

//user, doctor, admin
scheduleRoute.get("/list", getScheduleList);
scheduleRoute.get("/:id", getSchedule);

//admin
scheduleRoute.post("/create", admin, overlappingSchedules, createSchedule);
scheduleRoute.patch("/update/:id", admin, updateSchedule);
scheduleRoute.delete("/delete/:id", admin, deleteSchedule);

module.exports = scheduleRoute;
