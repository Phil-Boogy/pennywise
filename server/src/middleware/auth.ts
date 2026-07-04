import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthedRequest<
    P = {},
    ResBody = {},
    ReqBody = {},
    ReqQuery = {}
> extends Request<P, ResBody, ReqBody, ReqQuery> {
    userId?: number;
}


const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;

export const authenticateToken = (
    req: AuthedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "No access token" });
        return;
    }

    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired access token" });
    }
};