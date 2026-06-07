"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
const response_1 = require("../utils/response");
async function uploadFile(req, res) {
    try {
        if (!req.file) {
            return (0, response_1.error)(res, 'File required');
        }
        return (0, response_1.success)(res, {
            file_url: '/uploads/files/' + req.file.filename,
            file_name: req.file.originalname,
            file_size: req.file.size,
        }, 'File uploaded');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
//# sourceMappingURL=fileController.js.map