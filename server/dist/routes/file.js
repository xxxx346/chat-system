"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../utils/upload");
const fileController_1 = require("../controllers/fileController");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post('/upload', upload_1.upload.single('file'), fileController_1.uploadFile);
exports.default = router;
//# sourceMappingURL=file.js.map