const prisma = require("../configs/prisma");
const createError = require("../utils/createError");

const overlappingSchedules = async (req, res, next) => {
	try {
		let {
			adminId: doctorId,
			userId,
			roomId,
			serviceStart,
			serviceEnd,
			scheduleId: schId,
		} = req.body;
		const { id } = req.params;

		const startTime = new Date(serviceStart);
		const endTime = new Date(serviceEnd);

		//for create service///////////////////////////////////////
		if (!doctorId || !userId || !roomId) {
			const scheduleId = await prisma.service.findFirst({
				where: { id: id ? +id : undefined },
				select: { scheduleId: true },
			});
			if (!scheduleId) {
				return next(createError(404, "Service not found."));
			}
			const scheduleData = await prisma.schedule.findUnique({
				where: { id: +scheduleId.scheduleId || +schId },
				select: { adminId: true, userId: true, roomId: true },
			});
			if (!scheduleData) {
				return createError(404, "Treatment not found.");
			}
			doctorId = scheduleData.adminId;
			userId = scheduleData.userId;
			roomId = scheduleData.roomId;
		}
		///////////////////////////////////////////////////////

		if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
			return createError(400, "Invalid serviceStart or serviceEnd");
		}

		if (endTime <= startTime) {
			return createError(400, "Service end time must be after start time");
		}

		const overlappingSchedules = await prisma.schedule.findMany({
			where: {
				OR: [{ adminId: doctorId }, { userId: userId }, { roomId: roomId }],
				service: {
					some: {
						serviceStart: { lte: endTime },
						serviceEnd: { gt: startTime },
					},
				},
			},
		});
		if (overlappingSchedules.length > 0) {
			let conflictItems = [];
			if (
				overlappingSchedules.some((schedule) => schedule.adminId === doctorId)
			) {
				conflictItems.push("Doctor");
			}
			if (overlappingSchedules.some((schedule) => schedule.userId === userId)) {
				conflictItems.push("User");
			}
			if (overlappingSchedules.some((schedule) => schedule.roomId === roomId)) {
				conflictItems.push("Room");
			}
			const errorMessage = `The following are already booked in this time: ${conflictItems.join(
				", "
			)}`;

			return createError(400, errorMessage);
		}
		next();
	} catch (error) {
		next(error);
	}
};

module.exports = overlappingSchedules;
