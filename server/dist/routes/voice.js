"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const voiceController_1 = require("../controllers/voiceController");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post('/upload', voiceController_1.uploadVoice);
router.get('/:id', voiceController_1.getVoice);
exports.default = router;
//# sourceMappingURL=voice.js.map