"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return (0, response_1.unauthorized)(res, 'No token provided');
    }
    const token = authHeader.split(' ')[1];
    const decoded = (0, jwt_1.verifyToken)(token);
    if (!decoded) {
        return (0, response_1.unauthorized)(res, 'Invalid or expired token');
    }
    req.user = decoded;
    next();
}
//# sourceMappingURL=auth.js.map