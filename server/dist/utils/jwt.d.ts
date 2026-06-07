export declare function signToken(payload: {
    userId: number;
    username: string;
}): string;
export declare function verifyToken(token: string): {
    userId: number;
    username: string;
} | null;
//# sourceMappingURL=jwt.d.ts.map