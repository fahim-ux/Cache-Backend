import {Router} from 'express';
import { authenticateUser } from '@/middleware/userAuth';
import ApiKeyService from '@/service/ApiKeyService';

const router = Router();

// router.use(authenticateUser)

router.post('/', async (req, res) => {
    try{
        const {name , expiresInDays} = req.body;
        const userId = req.user.id;
        const apiKey = await ApiKeyService.generateApiKey(userId,name, expiresInDays? parseInt(expiresInDays): 0);
        res.status(201).json({
            success: true,
            message: 'API key generated successfully',
            data: apiKey
        });
    }
    catch(err){
        console.log("Error genearting Api key", err);
        res.status(500).json({success:false,error: "Error generating API key"});
    }
});

router.get('/', async (req, res) => {
    try{
        const userId = req.user.id;
        const apiKeys = await ApiKeyService.getUserApiKeys(userId);

        const safeApiKeys = apiKeys.map((key) =>{
            return{
                id : key.id,
                name: key.name,
                createdAt: key.createdAt,
                lastUsed: key.lastUsed,
                active: key.active,
                expiresAt: key.expiresAt
            }
        })

        res.status(200).json({
            success: true,
            count: safeApiKeys.length,
            data: safeApiKeys
        });
    }
    catch(err){
        console.log("Error listing Api keys", err);
        res.status(500).json({success:false,error: "Failed to list API keys"});
    }
})
router.put('/:id/revoke', async (req, res) => {
    try{
        const {id} = req.params;
        const userId = req.user.id;
        const revoked = await ApiKeyService.revokeApiKey(userId, id);
        if(!revoked){
            res.status(404).json({success:false,error: "API key not found or you do not have permission to revoke it"});
            return;
        }
        res.status(200).json({
            success: true,
            message: 'API key revoked successfully'
        });
    }
    catch(err){
        console.log("Error revoking Api key", err);
        res.status(500).json({success:false,error: "Failed to revoke API key"});
    }
})


router.delete('/:id', async (req, res) => {
    try
    {
        const {id} = req.params;
        const userId = req.user.id;
        const deleted = await ApiKeyService.deleteApiKey(userId, id);
        if(!deleted){
            res.status(404).json({success:false,error: "API key not found or you do not have permission to delete it"});
            return;
        }
        res.status(200).json({
            success: true,
            message: 'API key deleted successfully'
        });
    }
    catch(err){
        console.log("Error deleting Api key", err);
        res.status(500).json({success:false,error: "Failed to delete API key"});
    }
})

export default router;