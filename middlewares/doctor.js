const createError = require("../utils/createError");

const doctor = (req, res, next) => {
	try {
		if (req.user.role !== "DOCTOR") {
			return createError(403, "Forbidden");
		}
		next();
	} catch (error) {
		next(error);
	}
};

module.exports = doctor;
