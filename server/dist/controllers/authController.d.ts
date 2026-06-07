import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function register(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function logout(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authController.d.ts.map