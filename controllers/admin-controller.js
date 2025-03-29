const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const prisma = require("../configs/prisma");

exports.getAdminList = async (req, res, next) => {
	try {
		const { id, role } = req.user;

		const adminList = await prisma.admin.findMany({
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
				doctorInfo: {
					select: { department: true, dentalCouncilRegisId: true },
				},
				clinic: { select: { id: true, name: true } },
				updatedAt: true,
				role: { select: { role: true } },
			},
		});
		const cleanedAdminList = adminList.map((admin) => {
			const { doctorInfo, ...rest } = admin;
			return doctorInfo ? { ...rest, doctorInfo } : rest;
		});
		res
			.status(200)
			.json({ message: "Admin list fetched successfully.", cleanedAdminList });
	} catch (error) {
		next(error);
	}
};

exports.getAdmin = async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!id || isNaN(+id)) {
			return createError(400, "Invalid admin ID");
		}

		const admin = await prisma.admin.findUnique({
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
				role: { select: { role: true } },
				doctorInfo: {
					select: { department: true, dentalCouncilRegisId: true },
				},
				clinic: { select: { id: true, name: true } },
				updatedAt: true,
			},
		});

		if (!admin) {
			return createError(404, "Admin not found.");
		}

		const { doctorInfo, ...rest } = admin;
		const cleanedAdmin = doctorInfo ? { ...rest, doctorInfo } : rest;

		res.status(200).json({
			message: "Admin fetched successfully.",
			admin: cleanedAdmin,
		});
	} catch (error) {
		next(error);
	}
};

exports.createAdmin = async (req, res, next) => {
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
			role,
			clinicId,
			department,
			dentalCouncilRegisId,
		} = req.body;

		if (
			!firstNameEn.trim() ||
			!lastNameEn.trim() ||
			!firstNameTh.trim() ||
			!lastNameTh.trim() ||
			!email.trim() ||
			!password.trim() ||
			!confirmPassword.trim() ||
			!phone.trim() ||
			!idCard.trim() ||
			!role.trim() ||
			!clinicId
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
			return createError(400, "Passwords do not match.");
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		const existingAdmin = await prisma.admin.findUnique({ where: { email } });
		if (existingUser || existingAdmin) {
			return createError(400, "This email is already in use.");
		}

		const existingPhoneUser = await prisma.user.findFirst({ where: { phone } });
		const existingPhoneAdmin = await prisma.admin.findFirst({
			where: { phone },
		});
		if (existingPhoneUser || existingPhoneAdmin) {
			return createError(400, "This phone number is already in use.");
		}

		if (role === "DOCTOR" && (!department || !dentalCouncilRegisId)) {
			return createError(
				400,
				"Doctor's department and Cental Council Regis ID to be provided."
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const findRoleId = await prisma.roles.findFirst({
			where: { role },
			select: { id: true },
		});

		const newAdmin = await prisma.admin.create({
			data: {
				firstNameEn,
				lastNameEn,
				firstNameTh,
				lastNameTh,
				email,
				password: hashedPassword,
				phone,
				idCard,
				roleId: findRoleId.id,
				clinicId,
			},
		});

		if (role === "DOCTOR") {
			await prisma.doctorInfo.create({
				data: {
					adminId: newAdmin.id,
					department,
					dentalCouncilRegisId,
				},
			});
		}

		res.status(201).json({
			message: "Create admin successful!",
			admin: newAdmin,
		});
	} catch (error) {
		next(error);
	}
};

exports.updateAdmin = async (req, res, next) => {
	try {
		const { id: reqId, role: reqRole } = req.user;
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
			role,
			clinicId,
			department,
			dentalCouncilRegisId,
		} = req.body;

		const admin = await prisma.admin.findUnique({
			where: { id: +id },
			include: { doctorInfo: true, role: true },
		});
		if (!admin) {
			return createError(404, "Admin not found");
		}

		if (reqRole !== "ADMIN" && +reqId !== +id) {
			return createError(403, "Forbidden, Please contact ADMIN.");
		}

		if (
			role === "DOCTOR" &&
			role !== admin.role.role &&
			(!department || !dentalCouncilRegisId)
		) {
			return createError(
				400,
				"Doctor's department and Cental Council Regis ID to be provided."
			);
		}
		if (email !== admin.email) {
			const existingUser = await prisma.user.findUnique({ where: { email } });
			const existingAdmin = await prisma.admin.findUnique({
				where: { email },
			});
			if (existingUser || existingAdmin) {
				return createError(400, "This email is already in use.");
			}
		}

		if (phone !== admin.phone) {
			const existingPhoneUser = await prisma.user.findFirst({
				where: { phone },
			});
			const existingPhoneAdmin = await prisma.admin.findFirst({
				where: { phone },
			});
			if (existingPhoneUser || existingPhoneAdmin) {
				return createError(400, "This phone number is already in use.");
			}
		}

		let hashedPassword = admin.password;
		if (password && password.trim() !== "") {
			const isSamePassword = await bcrypt.compare(password, admin.password);
			if (!isSamePassword) {
				hashedPassword = await bcrypt.hash(password, 10);
			}
		}

		const findRoleId = await prisma.roles.findFirst({
			where: { role },
			select: { id: true },
		});

		const updateData = {
			firstNameEn: firstNameEn || admin.firstNameEn,
			lastNameEn: lastNameEn || admin.lastNameEn,
			firstNameTh: firstNameTh || admin.firstNameTh,
			lastNameTh: lastNameTh || admin.lastNameTh,
			email: email || admin.email,
			password: hashedPassword,
			phone: phone || admin.phone,
			image: image || admin.image,
			idCard: idCard || admin.idCard,
			...(reqRole === "ADMIN"
				? {
						roleId: findRoleId.id || admin.role.role,
						clinicId: clinicId || admin.clinicId,
				  }
				: {}),
		};

		const updatedAdmin = await prisma.admin.update({
			where: { id: +id },
			data: updateData,
		});

		// ถ้าเปลี่ยน role ให้จัดการ doctorInfo
		if (role === "DOCTOR") {
			const existingDoctorInfo = await prisma.doctorInfo.findFirst({
				where: { adminId: +id },
			});

			if (existingDoctorInfo) {
				await prisma.doctorInfo.updateMany({
					where: { adminId: +id },
					data: { department, dentalCouncilRegisId },
				});
			} else {
				await prisma.doctorInfo.create({
					data: { adminId: +id, department, dentalCouncilRegisId },
				});
			}
		}
		// DOCTOR -> ADMIN -> ลบ doctorInfo
		else if (role === "ADMIN") {
			await prisma.doctorInfo.deleteMany({ where: { adminId: +id } });
		}

		res.status(200).json({
			message: "Admin updated successfully!",
			admin: updatedAdmin,
		});
	} catch (error) {
		next(error);
	}
};

exports.deleteAdmin = async (req, res, next) => {
	try {
		const { role: reqRole } = req.user;
		const { id } = req.params;

		const adminToDelete = await prisma.admin.findUnique({
			where: { id: +id },
			include: { doctorInfo: true, role: true },
		});

		if (!adminToDelete) {
			return createError(404, "Staff not found.");
		}

		const roleAdmin = await prisma.roles.findUnique({
			where: { role: "ADMIN" },
			select: { id: true },
		});
		const adminCount = await prisma.admin.count({
			where: { roleId: roleAdmin.id },
		});

		if (adminToDelete.role === "ADMIN" && adminCount === 1) {
			return createError(400, "Cannot delete the last admin.");
		}

		if (adminToDelete.role === "DOCTOR") {
			await prisma.doctorInfo.deleteMany({ where: { adminId: +id } });
		}

		await prisma.admin.delete({ where: { id: +id } });

		res.status(200).json({ message: "Admin deleted successfully." });
	} catch (error) {
		next(error);
	}
};
