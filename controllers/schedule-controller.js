const prisma = require("../models/prisma");
const createError = require("../utils/createError");

exports.getScheduleList = async (req, res, next) => {
	try {
		const { id, role } = req.user;

		let whereCondition;
		if (role === "ADMIN") {
			whereCondition = {};
		}
		if (role === "DOCTOR") {
			whereCondition = { adminId: id };
		}
		if (role === "USER") {
			whereCondition = { userId: id };
		}

		const scheduleList = await prisma.schedule.findMany({
			where: whereCondition,
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				title: true,
				description: true,
				status: true,
				updatedAt: true,
				admin: {
					select: {
						id: true,
						firstNameEn: true,
						lastNameEn: true,
						firstNameTh: true,
						lastNameTh: true,
						phone: true,
						image: true,
						doctorInfo: {
							select: { department: true, dentalCouncilRegisId: true },
						},
					},
				},
				user: {
					select: {
						id: true,
						firstNameEn: true,
						lastNameEn: true,
						firstNameTh: true,
						lastNameTh: true,
						idCard: true,
						phone: true,
						image: true,
						clinic: { select: { id: true, name: true } },
					},
				},
				service: {
					select: {
						id: true,
						title: true,
						description: true,
						status: true,
						serviceStart: true,
						serviceEnd: true,
					},
				},
			},
		});
		res.json({ scheduleList: scheduleList });
	} catch (error) {
		next(error);
	}
};

exports.getSchedule = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { id: userId, role } = req.user;
		const schedule = await prisma.schedule.findUnique({
			where: { id: +id },
			select: {
				id: true,
				title: true,
				description: true,
				status: true,
				updatedAt: true,
				admin: {
					select: {
						id: true,
						firstNameEn: true,
						lastNameEn: true,
						firstNameTh: true,
						lastNameTh: true,
						phone: true,
						image: true,
						doctorInfo: {
							select: { department: true, dentalCouncilRegisId: true },
						},
					},
				},
				user: {
					select: {
						id: true,
						firstNameEn: true,
						lastNameEn: true,
						firstNameTh: true,
						lastNameTh: true,
						idCard: true,
						phone: true,
						image: true,
						clinic: { select: { id: true, name: true } },
					},
				},
				service: {
					select: {
						id: true,
						title: true,
						description: true,
						status: true,
						serviceStart: true,
						serviceEnd: true,
					},
				},
			},
		});

		if (!schedule) {
			return next(createError(404, "Treatment not found"));
		}

		if (
			role !== "ADMIN" &&
			schedule.admin.id !== userId &&
			schedule.user.id !== userId
		) {
			return next(createError(403, "Forbidden, this is NOT your treatment."));
		}

		res.json({ schedule });
	} catch (error) {
		next(error);
	}
};

exports.createSchedule = async (req, res, next) => {
	try {
		const {
			title,
			description,
			adminId: doctorId,
			roomId,
			userId,
			serviceStart,
			serviceEnd,
		} = req.body;
		const startTime = new Date(serviceStart);
		const endTime = new Date(serviceEnd);

		if (
			!title ||
			!serviceStart ||
			!serviceEnd ||
			!doctorId ||
			!roomId ||
			!userId
		) {
			return createError(400, "Missing required fields");
		}
		if (req.user.id !== doctorId && req.user.role !== "ADMIN") {
			return createError(403, "Forbidden, Please contact ADMIN.");
		}

		// check if all data are existing
		const [doctorExists, roomExists, userExists] = await Promise.all([
			prisma.admin.findUnique({ where: { id: doctorId } }),
			prisma.room.findUnique({ where: { id: roomId } }),
			prisma.user.findUnique({ where: { id: userId } }),
		]);
		if (!doctorExists || !roomExists || !userExists) {
			return createError(404, "Doctor, Room, or User not found");
		}

		const schedule = await prisma.schedule.create({
			data: {
				title,
				description,
				adminId: doctorId,
				roomId,
				userId,
				service: {
					create: {
						serviceStart: startTime,
						serviceEnd: endTime,
					},
				},
			},
			include: { service: true },
		});

		res.status(201).json({ message: "Treatment created.", result: schedule });
	} catch (error) {
		next(error);
	}
};

exports.deleteSchedule = async (req, res, next) => {
	try {
		const { id } = req.params;
		const data = await prisma.schedule.findUnique({
			where: { id: +id },
			include: { service: true },
		});
		if (!data) {
			return createError(404, "Treatment not found.");
		}
		if (data.service.length > 0) {
			return createError(
				400,
				"This treatment contain services. Please clear services history first."
			);
		}
		const scheduleData = await prisma.schedule.delete({ where: { id: +id } });
		res.status(204).json({
			message: "Treatment deleted successfully.",
			result: scheduleData,
		});
	} catch (error) {
		next(error);
	}
};

exports.updateSchedule = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { title, description, roomId, status } = req.body;

		const scheduleData = await prisma.schedule.findUnique({
			where: { id: +id },
		});
		if (!scheduleData) {
			return createError(404, "Treatment not found");
		}

		const access = await prisma.schedule.update({
			where: { id: +id },
			data: {
				title: title && title.trim() !== "" ? title : scheduleData.title,
				description:
					description && description.trim() !== ""
						? description.trim()
						: scheduleData.description,
				status: status && status.trim() !== "" ? status : scheduleData.status,
				roomId: roomId ? roomId : scheduleData.roomId,
			},
		});

		const updateData = access;

		res.json({
			message: "Treatment updated successfully",
			result: updateData,
		});
	} catch (error) {
		next(error);
	}
};
