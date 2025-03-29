const prisma = require("../configs/prisma");
exports.getClinics = async (req, res, next) => {
	try {
		const clinics = await prisma.clinic.findMany({
			select: {
				id: true,
				name: true,
			},
		});
		res.status(200).json(clinics);
	} catch (error) {
		next(error);
	}
};
