const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const prisma = require("../configs/prisma");

exports.getUserList = async (req, res, next) => {
	try {
		const { id, role } = req.user;

		const whereCondition =
			role === "ADMIN"
				? {}
				: {
						schedule: {
							some: {
								adminId: id,
							},
						},
				  };

		const userList = await prisma.user.findMany({
			where: whereCondition,
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				firstNameEn: true,
				lastNameEn: true,
				firstNameTh: true,
				lastNameTh: true,
				email: true,
				phone: true,
				idCard: true,
				image: true,
				clinic: { select: { name: true } },
				updatedAt: true,
			},
		});

		res.status(200).json({
			message: "User list fetched successfully.",
			userList,
		});
	} catch (error) {
		next(error);
	}
};

exports.getUser = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { id: reqId, role } = req.user;

		const user = await prisma.user.findUnique({
			where: { id: +id },
			select: {
				id: true,
				firstNameEn: true,
				lastNameEn: true,
				firstNameTh: true,
				lastNameTh: true,
				email: true,
				phone: true,
				idCard: true,
				image: true,
				clinic: { select: { name: true } },
				updatedAt: true,
				schedule: {
					select: {
						id: true,
						title: true,
						description: true,
						status: true,
						admin: {
							select: {
								firstNameEn: true,
								firstNameTh: true,
								lastNameEn: true,
								lastNameTh: true,
							},
						},
						service: {
							select: { status: true, serviceStart: true, serviceEnd: true },
						},
					},
				},
			},
		});

		if (!user) {
			return createError(404, "User not found.");
		}

		if (role !== "ADMIN" && !user.schedule.some((id) => id.adminId === reqId)) {
			return createError(403, "Forbidden. You cannot view this user.");
		}

		const cleanedUser =
			role === "ADMIN"
				? user
				: {
						...user,
						schedule: user.schedule.filter((id) => id.adminId === reqId), //doctor will see only own treatment
				  };

		res.status(200).json({
			message: "User fetched successfully.",
			user: cleanedUser,
		});
	} catch (error) {
		next(error);
	}
};

exports.createUser = async (req, res, next) => {
	try {
		const {
			firstNameEn,
			lastNameEn,
			firstNameTh,
			lastNameTh,
			email,
			password,
			confirmPassword,
			phone,
			image,
			idCard,
			clinicId,
			termOfUseAgreement,
		} = req.body;

		if (
			!firstNameEn?.trim() ||
			!lastNameEn?.trim() ||
			!firstNameTh?.trim() ||
			!lastNameTh?.trim() ||
			!email?.trim() ||
			!password?.trim() ||
			!confirmPassword?.trim() ||
			!phone?.trim() ||
			!idCard?.trim() ||
			!clinicId
		) {
			return next(createError(400, "Please provide all data."));
		}

		if (password !== confirmPassword) {
			return createError(400, "Passwords do not match.");
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return createError(400, "This email is already in use.");
		}

		const existingPhoneUser = await prisma.user.findUnique({
			where: { phone },
		});
		if (existingPhoneUser) {
			return createError(400, "This phone number is already in use.");
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: {
				firstNameEn,
				lastNameEn,
				firstNameTh,
				lastNameTh,
				email,
				password: hashedPassword,
				phone,
				idCard,
				clinicId,
				image,
				termOfUseAgreement: termOfUseAgreement || true,
			},
		});

		res.status(201).json({
			message: "User created successfully!",
			user: newUser,
		});
	} catch (error) {
		next(error);
	}
};

exports.updateUser = async (req, res, next) => {
	try {
		const { id } = req.params;
		const {
			firstNameEn,
			lastNameEn,
			firstNameTh,
			lastNameTh,
			email,
			password,
			phone,
			image,
			idCard,
			clinicId,
		} = req.body;
		const { id: reqId, role: reqRole } = req.user;

		const user = await prisma.user.findUnique({ where: { id: +id } });
		if (!user) {
			return createError(404, "User not found.");
		}
		if (reqRole !== "ADMIN" && (+reqId !== +id || reqRole === "DOCTOR")) {
			return next(
				createError(403, "Forbidden: You can only update your own profile.")
			);
		}

		if (email && email !== user.email) {
			const existingUser = await prisma.user.findFirst({ where: { email } });
			if (existingUser) {
				return createError(400, "This email is already in use.");
			}
		}

		if (phone && phone !== user.phone) {
			const existingPhoneUser = await prisma.user.findUnique({
				where: { phone },
			});
			if (existingPhoneUser) {
				return createError(400, "This phone number is already in use.");
			}
		}

		let hashedPassword = user.password;
		if (password && password.trim() !== "") {
			const isSamePassword = await bcrypt.compare(password, user.password);
			if (!isSamePassword) {
				hashedPassword = await bcrypt.hash(password, 10);
			}
		}

		const updatedUser = await prisma.user.update({
			where: { id: +id },
			data: {
				firstNameEn: firstNameEn || user.firstNameEn,
				lastNameEn: lastNameEn || user.lastNameEn,
				firstNameTh: firstNameTh || user.firstNameTh,
				lastNameTh: lastNameTh || user.lastNameTh,
				email: email || user.email,
				password: hashedPassword,
				phone: phone || user.phone,
				image: image || user.image,
				idCard: idCard || user.idCard,
				...(reqRole === "ADMIN" ? { clinicId: clinicId || user.clinicId } : {}),
			},
		});

		res.status(200).json({
			message: "User updated successfully!",
			user: updatedUser,
		});
	} catch (error) {
		next(error);
	}
};

exports.deleteUser = async (req, res, next) => {
	try {
		const { id } = req.params;

		const user = await prisma.user.findUnique({
			where: { id: +id },
			include: { schedule: true },
		});
		if (!user) {
			return createError(404, "User not found.");
		}

		if (user.schedule.length > 0) {
			return createError(
				400,
				"This user contain treatments. Please clear treatment history first."
			);
		}

		await prisma.user.delete({ where: { id: +id } });

		res.status(200).json({ message: "User deleted successfully." });
	} catch (error) {
		next(error);
	}
};
