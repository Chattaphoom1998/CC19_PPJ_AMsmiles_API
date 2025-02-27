const cloudinary = require("cloudinary").v2;

cloudinary.config({
	cloud_name: process.env.CLOUNDINARY_NAME,
	api_key: process.env.CLOUNDINARY_KEY,
	api_secret: process.env.CLOUNDINARY_SECRET,
});

module.exports = cloudinary;
