import { Response } from 'express';
export declare function success(res: Response, data?: any, message?: string): Response<any, Record<string, any>>;
export declare function error(res: Response, message?: string, code?: number): Response<any, Record<string, any>>;
export declare function unauthorized(res: Response, message?: string): Response<any, Record<string, any>>;
export declare function notFound(res: Response, message?: string): Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map