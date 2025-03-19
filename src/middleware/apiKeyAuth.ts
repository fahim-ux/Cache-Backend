import { Request, Response, NextFunction } from 'express';
import apiKeyService from '@/service/ApiKeyService';

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try {
        const apiKey = req.headers['x-api-key'] as string || req.query['api_key'] as string;
        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: 'API key is required'
            });
            return;
        }
        const validkey = await apiKeyService.ValidateApiKey(apiKey);

        if (!validkey) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired API key'
            });
            return ;
        }

        req.apiKey = validkey;
        req.user = { id: validkey.userId };
        next();
    }
    catch (err) {
        console.log("Error in apiKeyAuth middleware: ", err);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error during authentication' 
        });
        return ;
    }

}