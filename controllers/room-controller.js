const prisma = require("../configs/prisma");
const createError = require("../utils/createError");

exports.getRoomsByClinic = async (req, res, next) => {
	try {
		let clinicId = req.query.clinicId;

		if (!clinicId) {
			clinicId = req.user?.clinicId;
		}
		if (!clinicId) return createError(400, "clinicId is required");

		const rooms = await prisma.room.findMany({
			where: { clinicId: +clinicId },
			orderBy: { id: "asc" },
		});

		res.status(200).json({ rooms });
	} catch (err) {
		next(err);
	}
};

exports.createRoom = async (req, res, next) => {
	try {
		const { clinicId, description, roomNumber } = req.body;
		if (!clinicId || !description || !roomNumber)
			return createError(400, "All fields are required");

		const newRoom = await prisma.room.create({
			data: {
				clinicId: +clinicId,
				description,
				roomNumber: +roomNumber,
			},
		});

		res.status(201).json({ room: newRoom });
	} catch (err) {
		next(err);
	}
};

exports.updateRoom = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { description, roomNumber } = req.body;

		const updatedRoom = await prisma.room.update({
			where: { id: +id },
			data: {
				description,
				roomNumber: +roomNumber,
			},
		});

		res.status(200).json({ room: updatedRoom });
	} catch (err) {
		next(err);
	}
};

exports.deleteRoom = async (req, res, next) => {
	try {
		const { id } = req.params;

		await prisma.room.delete({ where: { id: +id } });

		res.status(200).json({ message: "Room deleted successfully" });
	} catch (err) {
		next(err);
	}
};
