import * as admin from 'firebase-admin';
import { Request,Response,NextFunction } from 'express';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction)  => {
    console.log("Request Headers:", req.headers);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; 
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log("Decoded Token:", decodedToken);
        req.user = decodedToken; 
        next();
    } catch (error) {
        return res.status(403).json({ error: "Unauthorized: Invalid token" });
    }
}