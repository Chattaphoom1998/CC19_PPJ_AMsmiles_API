const express = require("express");
const router = express.Router();
const { getClinics } = require("../controllers/clinic-controller");

router.get("/", getClinics);

module.exports = router;
