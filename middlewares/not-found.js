const notFoundHandler = (req, res, next) => {
	res.status(400).json({ message: "path not found on this page" });
};

module.exports = notFoundHandler;
