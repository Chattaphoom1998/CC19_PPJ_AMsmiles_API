require("dotenv").config();
const prisma = require("../models/prisma");

async function resetDatabase() {
	try {
		console.log("Resetting database...");

		// ดึงชื่อทุกตารางจาก DB
		const tableNames = await prisma.$queryRawUnsafe("SHOW TABLES"); //พวก RawUnsafe จะส่งไปที่ database โดยตรง
		console.log(tableNames); //{ 'Tables_in_ppj-am-smiles': 'admin' }

		for (let tableObj of tableNames) {
			const table = Object.values(tableObj)[0]; // =>["admin"]=>admin
			console.log(`Resetting: ${table}`);
			await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``); // ลบข้อมูลทั้งหมด
			await prisma.$executeRawUnsafe(
				`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`
			); // รีเซ็ต Auto Increment
		}

		console.log("Database reset completed!");
	} catch (error) {
		console.error("Error resetting database:", error);
	} finally {
		await prisma.$disconnect();
	}
}

resetDatabase();
