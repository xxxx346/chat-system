"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.logout = logout;
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const userRepo = () => database_1.AppDataSource.getRepository(User_1.User);
async function register(req, res) {
    try {
        const { username, email, password, nickname } = req.body;
        if (!username || !email || !password) {
            return (0, response_1.error)(res, 'Username, email and password are required');
        }
        const existing = await userRepo().findOne({ where: [{ username }, { email }] });
        if (existing) {
            return (0, response_1.error)(res, 'Username or email already exists');
        }
        const password_hash = await (0, password_1.hashPassword)(password);
        const user = userRepo().create({
            username,
            email,
            password_hash,
            nickname: nickname || username,
        });
        await userRepo().save(user);
        const token = (0, jwt_1.signToken)({ userId: user.id, username: user.username });
        return (0, response_1.success)(res, {
            token,
            user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname, avatar: user.avatar },
        }, 'Registration successful');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message || 'Registration failed');
    }
}
async function login(req, res) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return (0, response_1.error)(res, 'Username and password are required');
        }
        const user = await userRepo().findOne({ where: [{ username }, { email: username }] });
        if (!user) {
            return (0, response_1.error)(res, 'Invalid credentials', 401);
        }
        const valid = await (0, password_1.comparePassword)(password, user.password_hash);
        if (!valid) {
            return (0, response_1.error)(res, 'Invalid credentials', 401);
        }
        user.status = 'online';
        await userRepo().save(user);
        const token = (0, jwt_1.signToken)({ userId: user.id, username: user.username });
        return (0, response_1.success)(res, {
            token,
            user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname, avatar: user.avatar, signature: user.signature },
        }, 'Login successful');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message || 'Login failed');
    }
}
async function getProfile(req, res) {
    try {
        const user = await userRepo().findOne({ where: { id: req.user.userId } });
        if (!user)
            return (0, response_1.error)(res, 'User not found', 404);
        return (0, response_1.success)(res, {
            id: user.id, username: user.username, email: user.email,
            nickname: user.nickname, avatar: user.avatar, status: user.status,
            signature: user.signature, created_at: user.created_at,
        });
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function updateProfile(req, res) {
    try {
        const { nickname, avatar, signature } = req.body;
        const user = await userRepo().findOne({ where: { id: req.user.userId } });
        if (!user)
            return (0, response_1.error)(res, 'User not found', 404);
        if (nickname)
            user.nickname = nickname;
        if (avatar)
            user.avatar = avatar;
        if (signature !== undefined)
            user.signature = signature;
        await userRepo().save(user);
        return (0, response_1.success)(res, { id: user.id, nickname: user.nickname, avatar: user.avatar, signature: user.signature }, 'Profile updated');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function logout(req, res) {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        await userRepo.update(req.user.userId, { status: 'offline' });
        return (0, response_1.success)(res, null, 'Logged out successfully');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
//# sourceMappingURL=authController.js.map