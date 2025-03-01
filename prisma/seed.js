const prisma = require("../models/prisma");
const bcrypt = require("bcryptjs");

const hashedPassword = bcrypt.hashSync("123456789", 10);

console.log("Seeding database...");

// Clinics
const clinicData = [
	{
		businessLicense: "123456789",
		name: "Am Smiles Dental Clinic",
		branch: "Smutprakran",
		address: "123 Main Street",
		lat: 13.7563,
		lng: 100.5018,
	},
	{
		businessLicense: "987654321",
		name: "Am Smiles Dental Clinic",
		branch: "Bangkok",
		address: "456 Happy Road",
		lat: 13.7565,
		lng: 100.502,
	},
];

// Seed Data Function
async function seedDB() {
	try {
		// ✅ สร้าง Roles
		await prisma.roles.createMany({
			data: [{ role: "ADMIN" }, { role: "DOCTOR" }],
		});

		// ✅ สร้าง Clinics ทีละอัน
		const createdClinics = [];
		for (const clinic of clinicData) {
			const newClinic = await prisma.clinic.create({ data: clinic });
			createdClinics.push(newClinic);
		}

		for (const clinic of createdClinics) {
			// ✅ สร้าง 1 Admin/Clinic
			const admin = await prisma.admin.create({
				data: {
					firstNameEn: "Admin",
					lastNameEn: `Clinic ${clinic.id}`,
					firstNameTh: "แอดมิน",
					lastNameTh: `คลินิก ${clinic.id}`,
					email: `admin${clinic.id}@example.com`,
					password: hashedPassword,
					phone: `080000000${clinic.id}`,
					idCard: `11017012345${clinic.id}`,
					roleId: 1, // Admin Role
					clinicId: clinic.id,
				},
			});

			// ✅ สร้าง 2 Doctors/Clinic
			const doctors = [];
			for (let i = 1; i <= 2; i++) {
				const doctor = await prisma.admin.create({
					data: {
						firstNameEn: `Doctor ${i}`,
						lastNameEn: `Clinic ${clinic.id}`,
						firstNameTh: `หมอ ${i}`,
						lastNameTh: `คลินิก ${clinic.id}`,
						email: `doctor${i}_clinic${clinic.id}@example.com`,
						password: hashedPassword,
						phone: `081000000${clinic.id}${i}`,
						idCard: `11017023456${clinic.id}${i}`,
						roleId: 2, // Doctor Role
						clinicId: clinic.id,
					},
				});

				// ✅ เพิ่มข้อมูล `DoctorInfo`
				await prisma.doctorInfo.create({
					data: {
						department: "General Dentistry",
						dentalCouncilRegisId: `DCR${clinic.id}${i}`,
						adminId: doctor.id,
					},
				});

				doctors.push(doctor);
			}

			// ✅ สร้าง 5 Users/Clinic
			const users = [];
			for (let i = 1; i <= 5; i++) {
				const user = await prisma.user.create({
					data: {
						firstNameEn: `User ${i}`,
						lastNameEn: `Clinic ${clinic.id}`,
						firstNameTh: `ผู้ใช้ ${i}`,
						lastNameTh: `คลินิก ${clinic.id}`,
						email: `user${i}_clinic${clinic.id}@example.com`,
						password: hashedPassword,
						phone: `089000000${clinic.id}${i}`,
						idCard: `11017045678${clinic.id}${i}`,
						termOfUseAgreement: true,
						clinicId: clinic.id,
					},
				});
				users.push(user);
			}

			// ✅ สร้าง 4 Rooms/Clinic
			const rooms = [];
			for (let i = 1; i <= 4; i++) {
				const room = await prisma.room.create({
					data: {
						roomNumber: i,
						description: `Room ${i} for dental services`,
						clinicId: clinic.id,
					},
				});
				rooms.push(room);
			}

			// ✅ สร้าง 3 Ads/Clinic
			await prisma.clinicAd.createMany({
				data: [
					{
						imageUrl: "ad1.jpg",
						imageDes: "Promotion 1",
						link: "https://clinic.com/promo1",
						type: "AD",
						clinicId: clinic.id,
					},
					{
						imageUrl: "news1.jpg",
						imageDes: "Clinic News",
						link: "https://clinic.com/news",
						type: "NEWS",
						clinicId: clinic.id,
					},
					{
						imageUrl: "info1.jpg",
						imageDes: "Clinic Information",
						link: "https://clinic.com/info",
						type: "CLINICINFO",
						clinicId: clinic.id,
					},
				],
			});

			// ✅ สร้าง 3 Appointments/Clinic (ใช้ serviceStart & serviceEnd)
			for (let i = 0; i < 3; i++) {
				const serviceStart = new Date();
				serviceStart.setDate(serviceStart.getDate() + i); // เพิ่มวันที่
				serviceStart.setHours(9 + i, 0, 0, 0); // เริ่มตั้งแต่ 9:00 AM

				const serviceEnd = new Date(serviceStart);
				serviceEnd.setHours(serviceEnd.getHours() + 1); // เพิ่ม 1 ชั่วโมง

				const schedule = await prisma.schedule.create({
					data: {
						title: `Dental Check-up ${i + 1}`,
						description: `Routine check-up for patient ${users[i].firstNameEn}`,
						adminId: doctors[i % 2].id, // หมอคนใดคนหนึ่ง
						roomId: rooms[i % 4].id, // ห้องใดห้องหนึ่ง
						userId: users[i].id, // ผู้ป่วยคนใดคนหนึ่ง
					},
				});

				// ✅ สร้าง `Service` สำหรับแต่ละการนัดหมาย
				await prisma.service.create({
					data: {
						title: `Teeth Cleaning ${i + 1}`,
						description: "Routine dental cleaning session",
						status: "CONFIRM",
						serviceStart: serviceStart, // ใช้ serviceStart
						serviceEnd: serviceEnd, // ใช้ serviceEnd
						scheduleId: schedule.id,
					},
				});
			}
		}

		console.log("✅ Database Seeding Completed!");
	} catch (error) {
		console.error("❌ Error Seeding Database:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// 🔥 เรียกใช้งาน seedDB()
seedDB();
