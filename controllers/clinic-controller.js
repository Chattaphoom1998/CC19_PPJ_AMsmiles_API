const prisma = require("../configs/prisma");
const createError = require("../utils/createError");

exports.getClinics = async (req, res, next) => {
	try {
		const clinics = await prisma.clinic.findMany({
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				name: true,
				businessLicense: true,
				address: true,
				updatedAt: true,
				room: { select: { id: true } },
			},
		});
		res.status(200).json({ clinics });
	} catch (error) {
		next(error);
	}
};

exports.createClinic = async (req, res, next) => {
	try {
		const { name, businessLicense, address, rooms = [] } = req.body;

		if (!name || !businessLicense || !address) {
			return next(createError(400, "Missing required fields"));
		}

		const newClinic = await prisma.clinic.create({
			data: {
				name,
				businessLicense,
				address,
				lat: 0, // หากยังไม่มีใน UI
				lng: 0,
				branch: "", // หรือจะให้รับจาก req.body ก็ได้
				room: {
					create: rooms.map((r) => ({
						roomNumber: parseInt(r.roomNumber),
						description: r.description,
					})),
				},
			},
			include: {
				room: true,
			},
		});

		res.status(201).json({ message: "Clinic created", clinic: newClinic });
	} catch (err) {
		next(err);
	}
};

exports.updateClinic = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, businessLicense, address } = req.body;

		const clinic = await prisma.clinic.findUnique({ where: { id: +id } });
		if (!clinic) return next(createError(404, "Clinic not found."));

		const updated = await prisma.clinic.update({
			where: { id: +id },
			data: { name, businessLicense, address },
		});

		res.status(200).json({ message: "Clinic updated", clinic: updated });
	} catch (error) {
		next(error);
	}
};

exports.deleteClinic = async (req, res, next) => {
	try {
		const { id } = req.params;
		const clinic = await prisma.clinic.findUnique({ where: { id: +id } });
		if (!clinic) return next(createError(404, "Clinic not found."));

		await prisma.clinic.delete({ where: { id: +id } });
		res.status(200).json({ message: "Clinic deleted" });
	} catch (error) {
		next(error);
	}
};
