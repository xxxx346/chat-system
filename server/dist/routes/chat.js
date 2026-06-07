"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const chatController_1 = require("../controllers/chatController");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/unread', chatController_1.getUnreadCount);
router.get('/', chatController_1.getConversations);
router.post('/', chatController_1.createConversation);
router.get('/:id/messages', chatController_1.getMessages);
router.get('/:id/search', chatController_1.searchMessages);
router.get('/:id/export', chatController_1.exportMessages);
router.put('/:id', chatController_1.updateConversation);
router.delete('/:id/members/:userId', chatController_1.removeMember);
exports.default = router;
//# sourceMappingURL=chat.js.map