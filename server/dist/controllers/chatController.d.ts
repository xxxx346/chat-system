import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getConversations(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createConversation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getMessages(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function searchMessages(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function exportMessages(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateConversation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getUnreadCount(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function removeMember(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=chatController.d.ts.map