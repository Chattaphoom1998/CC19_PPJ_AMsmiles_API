const jwt = require("jsonwebtoken");
const prisma = require("../models/prisma");
const createError = require("../utils/createError");

module.exports = async (req, res, next) => {
	try {
		console.log(req.headers);
		const authorization = req.headers.authorization;
		if (!authorization || !authorization.startsWith("Bearer ")) {
			return next(createError(401, "Unauthorized: No Token Provided"));
		}

		const token = authorization.split(" ")[1];
		if (!token) {
			return next(createError(401, "Unauthorized: Invalid Token"));
		}

		let payload;
		try {
			payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
		} catch (error) {
			return next(createError(401, "Unauthorized: Invalid or Expired Token"));
		}

		let foundUser;
		let role;
		if (payload.role === "USER") {
			foundUser = await prisma.user.findUnique({ where: { id: payload.id } });
			role = "USER";
		} else {
			foundUser = await prisma.admin.findUnique({
				where: { id: payload.id },
				include: { role: true },
			});
		}

		if (!foundUser) {
			return next(createError(401, "Unauthorized: User Not Found"));
		}

		const { password, createdAt, updatedAt, ...userData } = foundUser;

		req.user = { ...userData, role };
		next();
	} catch (error) {
		next(error);
	}
};
