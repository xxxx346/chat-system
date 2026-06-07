"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.error = error;
exports.unauthorized = unauthorized;
exports.notFound = notFound;
function success(res, data = null, message = 'success') {
    return res.json({ code: 200, message, data });
}
function error(res, message = 'error', code = 400) {
    return res.status(code).json({ code, message });
}
function unauthorized(res, message = 'unauthorized') {
    return res.status(401).json({ code: 401, message });
}
function notFound(res, message = 'not found') {
    return res.status(404).json({ code: 404, message });
}
//# sourceMappingURL=response.js.map