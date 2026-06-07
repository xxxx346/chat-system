import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function uploadVoice(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getVoice(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=voiceController.d.ts.map