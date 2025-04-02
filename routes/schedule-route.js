const express = require("express");
const {
	getScheduleList,
	createSchedule,
	updateSchedule,
	deleteSchedule,
	getSchedule,
	createScheduleWithService,
} = require("../controllers/schedule-controller");
const overlappingSchedules = require("../middlewares/overlappingSchedule");
const admin = require("../middlewares/admin");
const notUser = require("../middlewares/not-user");

const scheduleRoute = express.Router();

//user, doctor, admin
scheduleRoute.get("/list", getScheduleList);
scheduleRoute.get("/:id", getSchedule);

//admin
scheduleRoute.post("/create", admin, overlappingSchedules, createSchedule);
scheduleRoute.post(
	"/create-with-service",
	admin,
	overlappingSchedules,
	createScheduleWithService
);
scheduleRoute.patch("/update/:id", notUser, updateSchedule);
scheduleRoute.delete("/delete/:id", admin, deleteSchedule);

module.exports = scheduleRoute;
