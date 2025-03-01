const prisma = require("../models/prisma");
const createError = require("../utils/createError");

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

exports.updateService = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { title, description, status, serviceStart, serviceEnd } = req.body;

		const serviceData = await prisma.service.findUnique({
			where: { id: +id },
			include: { schedule: true },
		});
		if (!serviceData) {
			return createError(404, "Service not found");
		}
		if (
			req.user.id !== serviceData.schedule.userId &&
			req.user.id !== serviceData.schedule.adminId &&
			req.user.role !== "ADMIN"
		) {
			return createError(403, "Forbidden");
		}

		let access;

		if (
			req.user.id === serviceData.schedule.adminId ||
			req.user.role === "ADMIN"
		) {
			access = await prisma.service.update({
				where: { id: +id },
				data: {
					title: title && title.trim() !== "" ? title : serviceData.title,
					description:
						description && description.trim() !== ""
							? description.trim()
							: serviceData.description,
					status: status && status.trim() !== "" ? status : serviceData.status,
					serviceStart: serviceStart
						? new Date(serviceStart)
						: serviceData.serviceStart,
					serviceEnd: serviceEnd
						? new Date(serviceEnd)
						: serviceData.serviceEnd,
				},
			});
		} else {
			access = await prisma.service.update({
				where: { id: +id },
				data: {
					serviceStart: serviceStart
						? new Date(serviceStart)
						: serviceData.serviceStart,
					serviceEnd: serviceEnd
						? new Date(serviceEnd)
						: serviceData.serviceEnd,
				},
			});
		}
		const updateData = access;
		res.json({
			message: "Service updated successfully",
			result: updateData,
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
