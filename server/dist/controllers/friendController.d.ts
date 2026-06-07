import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getFriends(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function searchUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function sendFriendRequest(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getFriendRequests(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function handleFriendRequest(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function resendFriendRequest(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function moveFriendToGroup(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteFriend(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getGroups(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createGroup(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function renameGroup(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteGroup(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=friendController.d.ts.map