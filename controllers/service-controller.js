const prisma = require("../models/prisma");
const createError = require("../utils/createError");
const { addMinutes, format } = require("date-fns");

exports.createService = async (req, res, next) => {
	try {
		const { title, description, serviceStart, serviceEnd, scheduleId } =
			req.body;
		const startTime = new Date(serviceStart);
		const endTime = new Date(serviceEnd);

		if (!title || !serviceStart || !serviceEnd || !scheduleId) {
			return createError(400, "Missing required fields");
		}
		const scheduleData = await prisma.schedule.findUnique({
			where: { id: +scheduleId },
		});
		if (!scheduleData) {
			return createError(404, "Treatment not found. Please create a treatment");
		}
		if (req.user.id !== scheduleData.adminId && req.user.role !== "ADMIN") {
			return createError(
				403,
				"Forbidden, this treatment is not under your responsibility. Please contact ADMIN."
			);
		}

		const service = await prisma.service.create({
			data: {
				title,
				description,
				serviceStart: startTime,
				serviceEnd: endTime,
				scheduleId,
			},
		});

		res.status(201).json({ message: "Service created.", result: service });
	} catch (error) {
		next(error);
	}
};

exports.getService = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { id: userId, role } = req.user;
		const service = await prisma.service.findUnique({
			where: { id: +id },
			select: {
				id: true,
				title: true,
				description: true,
				status: true,
				serviceStart: true,
				serviceEnd: true,
				updatedAt: true,
				schedule: {
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
					},
				},
			},
		});

		if (!service) {
			return next(createError(404, "Service not found"));
		}

		if (
			role !== "ADMIN" &&
			service.schedule.admin.id !== userId &&
			service.schedule.user.id !== userId
		) {
			return next(createError(403, "Forbidden, this is NOT your service."));
		}

		res.json({ service });
	} catch (error) {
		next(error);
	}
};

exports.getServicesByClinic = async (req, res, next) => {
	try {
		const { clinicId, month, year } = req.query;
		if (!clinicId || !month || !year) {
			return next(createError(400, "Missing clinicId, month, or year"));
		}

		const monthStart = new Date(year, month - 1, 1);
		const monthEnd = new Date(year, month, 0, 23, 59, 59, 999); // end of month

		const services = await prisma.service.findMany({
			where: {
				serviceStart: {
					gte: monthStart,
					lte: monthEnd,
				},
				schedule: {
					room: {
						clinicId: Number(clinicId),
					},
				},
			},
			include: {
				schedule: {
					include: {
						admin: true,
						user: true,
						room: true,
					},
				},
			},
			orderBy: {
				serviceStart: "asc",
			},
		});

		res.json({ services });
	} catch (err) {
		next(err);
	}
};

exports.updateService = async (req, res, next) => {
	try {
		const { id } = req.params;
		let { title, description, status, serviceStart, serviceEnd } = req.body;

		const serviceData = await prisma.service.findUnique({
			where: { id: +id },
			include: { schedule: true },
		});

		if (!serviceData) {
			return createError(404, "Service not found");
		}

		// เช็คสิทธิ์การเข้าถึง
		if (
			req.user.id !== serviceData.schedule.userId &&
			req.user.id !== serviceData.schedule.adminId &&
			req.user.role !== "ADMIN"
		) {
			return createError(403, "Forbidden");
		}

		// ถ้า status คือ CANCEL, POSTPONE, ABSENT ให้ clear เวลาทิ้ง
		const clearTimes = ["CANCEL", "POSTPONE", "ABSENT"].includes(status);

		const updated = await prisma.service.update({
			where: { id: +id },
			data: {
				title: title?.trim() || serviceData.title,
				description: description?.trim() || serviceData.description,
				status: status || serviceData.status,
				serviceStart: clearTimes
					? null
					: serviceStart
					? new Date(serviceStart)
					: serviceData.serviceStart,
				serviceEnd: clearTimes
					? null
					: serviceEnd
					? new Date(serviceEnd)
					: serviceData.serviceEnd,
			},
		});

		res.json({
			message: "Service updated successfully",
			result: updated,
		});
	} catch (error) {
		next(error);
	}
};

exports.deleteService = async (req, res, next) => {
	try {
		const { id } = req.params;
		const data = await prisma.service.findUnique({
			where: { id: +id },
			include: { schedule: true },
		});
		if (!data) {
			return createError(404, "Treatment not found.");
		}
		if (req.user.id !== data.schedule.adminId && req.user.role !== "ADMIN") {
			return createError(403, "Forbidden. Please contact the doctor or ADMIN");
		}
		if (data.status?.toUpperCase() === "PAID") {
			return createError(
				422,
				"This contain patients treatment footprint. Unprocessable!!"
			);
		}
		const serviceData = await prisma.service.delete({ where: { id: +id } });
		res.status(204).json({
			message: "Service deleted successfully.",
			result: serviceData,
		});
	} catch (error) {
		next(error);
	}
};

exports.getBookedSlots = async (req, res, next) => {
	try {
		const { date, scheduleId } = req.query;
		if (!date || !scheduleId) {
			return next(createError(400, "Missing date or scheduleId"));
		}

		const schedule = await prisma.schedule.findUnique({
			where: { id: Number(scheduleId) },
			select: {
				adminId: true,
				userId: true,
				roomId: true,
			},
		});

		const { adminId, userId, roomId } = schedule;
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(date);
		dayEnd.setHours(23, 59, 59, 999);

		const roleTypes = [
			{ key: "admin", field: "adminId", value: Number(adminId) },
			{ key: "user", field: "userId", value: Number(userId) },
			{ key: "room", field: "roomId", value: Number(roomId) },
		];

		const bookedTimes = { admin: [], user: [], room: [] };

		for (const role of roleTypes) {
			if (!role.value || isNaN(role.value)) continue; // ❗ ป้องกัน NaN

			const services = await prisma.service.findMany({
				where: {
					serviceStart: { gte: dayStart, lte: dayEnd },
					schedule: {
						[role.field]: role.value,
					},
					status: {
						notIn: ["CANCEL", "POSTPONE", "ABSENT"],
					},
				},
				select: {
					serviceStart: true,
					serviceEnd: true,
				},
			});

			for (const svc of services) {
				let t = new Date(svc.serviceStart);
				while (t < new Date(svc.serviceEnd)) {
					bookedTimes[role.key].push(t.toISOString().slice(11, 16)); // "HH:mm"
					t = addMinutes(t, 30);
				}
			}
		}

		Object.keys(bookedTimes).forEach(
			(key) => (bookedTimes[key] = [...new Set(bookedTimes[key])].sort())
		);

		res.json({ bookedTimes });
	} catch (err) {
		next(err);
	}
};

exports.getTempBookedSlots = async (req, res, next) => {
	try {
		console.log(req.query);
		const { date, adminId, userId, roomId } = req.query;
		if (!date || !adminId || !userId || !roomId) {
			return next(createError(400, "Missing required fields"));
		}

		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(date);
		dayEnd.setHours(23, 59, 59, 999);

		const roleTypes = [
			{ key: "admin", field: "adminId", value: Number(adminId) },
			{ key: "user", field: "userId", value: Number(userId) },
			{ key: "room", field: "roomId", value: Number(roomId) },
		];

		const bookedTimes = { admin: [], user: [], room: [] };

		for (const role of roleTypes) {
			const services = await prisma.service.findMany({
				where: {
					serviceStart: { gte: dayStart, lte: dayEnd },
					schedule: { [role.field]: role.value },
					status: {
						notIn: ["CANCEL", "POSTPONE", "ABSENT"],
					},
				},
				select: {
					serviceStart: true,
					serviceEnd: true,
				},
			});

			for (const svc of services) {
				let t = new Date(svc.serviceStart);
				while (t < new Date(svc.serviceEnd)) {
					bookedTimes[role.key].push(format(t, "HH:mm"));
					t = addMinutes(t, 30);
				}
			}
		}

		// Remove duplicates
		Object.keys(bookedTimes).forEach((key) => {
			bookedTimes[key] = [...new Set(bookedTimes[key])].sort();
		});

		res.json({ bookedTimes });
	} catch (err) {
		next(err);
	}
};
