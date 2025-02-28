const createError = require("../utils/createError");

const admin = (req, res, next) => {
	try {
		if (req.user.role !== "ADMIN") {
			return createError(403, "Forbidden");
		}
		next();
	} catch (error) {
		next(error);
	}
};

module.exports = admin;
