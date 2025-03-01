const prisma = require("../configs/prisma");
const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
	try {
		const {
			firstNameEn,
			lastNameEn,
			firstNameTh,
			lastNameTh,
			email,
			password,
			phone,
			confirmPassword,
			termOfUseAgreement,
		} = req.body;

		if (
			!firstNameEn.trim() ||
			!lastNameEn.trim() ||
			!firstNameTh.trim() ||
			!lastNameTh.trim() ||
			!email.trim() ||
			!password.trim() ||
			!phone.trim()
		) {
			return createError(400, "Please provide all data.");
		}

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(email)) {
			return createError(400, "Please correct your email.");
		}
		const mobileRegex = /^[0-9]{10,15}$/;
		if (!mobileRegex.test(phone)) {
			return createError(400, "Please correct your phone number.");
		}

		if (password !== confirmPassword) {
			return createError(400, "Password are not match.");
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		const existingAdmin = await prisma.admin.findUnique({ where: { email } });
		if (existingUser || existingAdmin) {
			return createError(400, "This email is already in use.");
		}
		const existingPhoneUser = await prisma.user.findFirst({
			where: { phone },
		});
		const existingPhoneAdmin = await prisma.admin.findFirst({
			where: { phone },
		});
		if (existingPhoneUser || existingPhoneAdmin) {
			throw createError(400, "This phone number is already in use.");
		}
		if (!termOfUseAgreement) {
			return createError(
				400,
				"Please read and agree to term of use and agreement."
			);
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
				termOfUseAgreement,
			},
		});
		res.status(201).json({ message: "Register successful!", user: newUser });
	} catch (error) {
		next(error);
	}
};

function checkEmailOrPhone(identity) {
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	const mobileRegex = /^[0-9]{10,15}$/;
	let identityKey = "";
	if (emailRegex.test(identity)) {
		return "email";
	}
	if (mobileRegex.test(identity)) {
		return "phone";
	}

	return null;
}

exports.login = async (req, res, next) => {
	try {
		const { identity, password } = req.body;

		if (!identity?.trim() || !password?.trim()) {
			return createError(400, "Please provide both username and password");
		}

		const identityKey = checkEmailOrPhone(identity);
		if (!identityKey) {
			return createError(400, "Invalid email or phone number format");
		}

		const foundUser = await prisma.user.findUnique({
			where: { [identityKey]: identity },
		});
		const foundAdmin = await prisma.admin.findUnique({
			where: { [identityKey]: identity },
			include: { role: true },
		});

		if (!foundUser && !foundAdmin) {
			return createError(401, "Invalid login!");
		}

		let isPasswordValid = false;
		let foundAccount = null;
		let role = "";

		if (foundUser && (await bcrypt.compare(password, foundUser.password))) {
			isPasswordValid = true;
			foundAccount = foundUser;
			role = "USER";
		} else if (
			foundAdmin &&
			(await bcrypt.compare(password, foundAdmin.password))
		) {
			isPasswordValid = true;
			foundAccount = foundAdmin;
			role = foundAdmin.role?.role;
		}

		if (!isPasswordValid) {
			return createError(401, "Invalid login!");
		}

		// JWT Token and Role
		const payload = { id: foundAccount.id, role };
		const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		const { password: pass, createdAt, updatedAt, ...userData } = foundAccount;

		res.json({
			message: "Login successful",
			user: { ...userData, role },
			token: token,
		});
	} catch (error) {
		next(error);
	}
};

exports.getMe = async (req, res, next) => {
	try {
		console.log("req.user:", req.user);
		const { id, role } = req.user;

		let userData = null;

		if (role === "USER") {
			userData = await prisma.user.findUnique({
				where: { id },
				select: {
					id: true,
					firstNameEn: true,
					lastNameEn: true,
					firstNameTh: true,
					lastNameTh: true,
					email: true,
					phone: true,
					createdAt: true,
				},
			});
			userData.role = "USER";
		} else if (role === "DOCTOR") {
			userData = await prisma.admin.findUnique({
				where: { id },
				select: {
					id: true,
					firstNameEn: true,
					lastNameEn: true,
					firstNameTh: true,
					lastNameTh: true,
					email: true,
					phone: true,
					createdAt: true,
					role: {
						select: {
							role: true,
						},
					},
					doctorInfo: {
						select: {
							department: true,
							dentalCouncilRegisId: true,
						},
					},
				},
			});
			userData.role = userData.role?.role;
			userData.department = userData.doctorInfo?.department;
			userData.dentalCouncilRegisId = userData.doctorInfo?.dentalCouncilRegisId;
		} else {
			userData = await prisma.admin.findUnique({
				where: { id },
				select: {
					id: true,
					firstNameEn: true,
					lastNameEn: true,
					firstNameTh: true,
					lastNameTh: true,
					email: true,
					phone: true,
					createdAt: true,
					role: {
						select: {
							role: true,
						},
					},
				},
			});
			userData.role = userData.role?.role;
		}

		if (!userData) {
			return next(createError(404, "User not found"));
		}

		res.json({
			message: "User data retrieved successfully",
			user: userData,
		});
	} catch (error) {
		next(error);
	}
};
