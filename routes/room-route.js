const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room-controller");
const authenticate = require("../middlewares/authenticate");

router.get("/", authenticate, roomController.getRoomsByClinic);
router.post("/", authenticate, roomController.createRoom);
router.patch("/:id", authenticate, roomController.updateRoom);
router.delete("/:id", authenticate, roomController.deleteRoom);

module.exports = router;
