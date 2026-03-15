export interface JwtPayload {
    userId: string;
    username: string;
    email: string;
    iat?: number;
    exp?: number;
}