const prisma = require("../models/prisma");
const bcrypt = require("bcryptjs");

const hashedPassword = bcrypt.hashSync("P@ssw0rd123", 10);

console.log("Seeding additional Admins and Doctors...");

// 🔹 รายชื่อสมจริง (เพิ่มชุดใหม่)
const extraAdminNames = [
	{ en: "Alice", th: "อลิซ" },
	{ en: "Brian", th: "ไบรอัน" },
	{ en: "Charlotte", th: "ชาร์ล็อตต์" },
	{ en: "Derek", th: "เดเร็ค" },
	{ en: "Ella", th: "เอลล่า" },
	{ en: "Frederick", th: "เฟรเดอริค" },
	{ en: "Gabriella", th: "กาเบรียลลา" },
	{ en: "Harrison", th: "แฮร์ริสัน" },
	{ en: "Isabelle", th: "อิซาเบล" },
	{ en: "Jacob", th: "เจคอบ" },
];

const extraDoctorNames = [
	{ en: "Dr. Kevin", th: "หมอเควิน" },
	{ en: "Dr. Laura", th: "หมอลอร่า" },
	{ en: "Dr. Matthew", th: "หมอแมทธิว" },
	{ en: "Dr. Natalie", th: "หมอนาตาลี" },
	{ en: "Dr. Oliver", th: "หมอโอลิเวอร์" },
	{ en: "Dr. Patricia", th: "หมอแพทริเซีย" },
	{ en: "Dr. Quentin", th: "หมอเควนติน" },
	{ en: "Dr. Rachel", th: "หมอราเชล" },
	{ en: "Dr. Samuel", th: "หมอซามูเอล" },
	{ en: "Dr. Tiffany", th: "หมอทิฟฟานี่" },
];

async function seedExtraAdminsAndDoctors() {
	try {
		// ✅ ดึงรายการ Clinics ที่มีอยู่
		const clinics = await prisma.clinic.findMany();

		if (clinics.length === 0) {
			console.log(
				"❌ No clinics found. Please run the main seed script first."
			);
			return;
		}

		for (const clinic of clinics) {
			console.log(`Adding extra admins and doctors for clinic ${clinic.id}...`);

			// ✅ เพิ่ม 10 Admins ใหม่ให้แต่ละคลินิก
			for (let i = 0; i < 10; i++) {
				await prisma.admin.create({
					data: {
						firstNameEn: extraAdminNames[i].en,
						lastNameEn: "Brown",
						firstNameTh: extraAdminNames[i].th,
						lastNameTh: "บราวน์",
						email: `newadmin${i + 1}_clinic${clinic.id}@amsmiles.com`,
						password: hashedPassword,
						phone: `082-345-67${clinic.id}${i}`,
						idCard: `11017067890${clinic.id}${i}`,
						roleId: 1, // Admin Role
						clinicId: clinic.id,
					},
				});
			}

			// ✅ เพิ่ม 10 Doctors ใหม่ให้แต่ละคลินิก
			for (let i = 0; i < 10; i++) {
				const doctor = await prisma.admin.create({
					data: {
						firstNameEn: extraDoctorNames[i].en,
						lastNameEn: "Davis",
						firstNameTh: extraDoctorNames[i].th,
						lastNameTh: "เดวิส",
						email: `newdoctor${i + 1}_clinic${clinic.id}@amsmiles.com`,
						password: hashedPassword,
						phone: `083-456-78${clinic.id}${i}`,
						idCard: `11017078901${clinic.id}${i}`,
						roleId: 2, // Doctor Role
						clinicId: clinic.id,
					},
				});

				// ✅ เพิ่มข้อมูล `DoctorInfo` ให้หมอใหม่
				await prisma.doctorInfo.create({
					data: {
						department: `Specialist ${i + 11}`,
						dentalCouncilRegisId: `DCR${clinic.id}${i + 10}`,
						adminId: doctor.id,
					},
				});
			}
		}

		console.log(
			"✅ Additional Admins and Doctors have been added successfully!"
		);
	} catch (error) {
		console.error("❌ Error adding extra Admins and Doctors:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// 🔥 เรียกใช้งาน seedExtraAdminsAndDoctors()
seedExtraAdminsAndDoctors();
