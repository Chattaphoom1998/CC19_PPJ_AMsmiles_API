const createError = require("../utils/createError");

const notUser = (req, res, next) => {
	try {
		if (req.user.role === "USER") {
			return createError(403, "Forbidden");
		}
		next();
	} catch (error) {
		next(error);
	}
};

module.exports = notUser;
