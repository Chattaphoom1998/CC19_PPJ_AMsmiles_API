const express = require("express");
const router = express.Router();
const {
	getClinics,
	createClinic,
	updateClinic,
	deleteClinic,
} = require("../controllers/clinic-controller");

router.get("/", getClinics);
router.post("/", createClinic);
router.patch("/:id", updateClinic);
router.delete("/:id", deleteClinic);

module.exports = router;
