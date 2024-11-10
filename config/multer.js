const path = require("path");
const multer = require("multer");

// disc storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    const fn = Date.now().toString(16) + path.extname(file.originalname);
    cb(null, fn);
  },
});

// export upload image
const upload = multer({ storage: storage });

module.exports = upload;
