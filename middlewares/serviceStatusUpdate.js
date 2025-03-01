const prisma = require("../configs/prisma");
const createError = require("../utils/createError");
const overlappingSchedules = require("./overlappingSchedule");

const serviceStatusUpdate = async (req, res, next) => {
	try {
		const { id } = req.params;
		let { serviceStart, serviceEnd } = req.body;

		const existingService = await prisma.service.findUnique({
			where: { id: +id },
			select: { serviceStart: true, serviceEnd: true, scheduleId: true },
		});
		if (!existingService) {
			return next(createError(404, "Service not found."));
		}

		const isStartTimeChanged =
			serviceStart &&
			new Date(serviceStart).getTime() !==
				existingService.serviceStart.getTime();
		const isEndTimeChanged =
			serviceEnd &&
			new Date(serviceEnd).getTime() !== existingService.serviceEnd.getTime();

		if (!isStartTimeChanged && !isEndTimeChanged) {
			return next();
		}

		return overlappingSchedules(req, res, next);
	} catch (error) {
		next(error);
	}
};

module.exports = serviceStatusUpdate;
