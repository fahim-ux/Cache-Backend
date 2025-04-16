import {Router} from 'express';
import { authenticateUser } from '../middleware/userAuth';
import ApiKeyService from '../service/ApiKeyService';

const router = Router();

router.use(authenticateUser)

router.post('/', async (req, res) => {
    try{
        const {name , expiresInDays} = req.body;
        console.log("Request to create a user api key with name: ",name);
        const userId = req.user.id;
        const apiKey = await ApiKeyService.generateApiKey(userId,name, expiresInDays? parseInt(expiresInDays): 0);

        const data = JSON.stringify(apiKey.key, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Deposition','attachment; filename=Cache_Api_Key.json')

        // res.status(201).json({
        //     success: true,
        //     message: 'API key generated successfully',
        //     data: apiKey
        // });
        res.status(200).send(data);
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
router.put('/revoke/:id', async (req, res) => {
    console.log("Request to revoke Api key");
    try{
        const {id} = req.params;
        console.log("Request to revoke Api key with id: ",id);
        const userId = req.user.id;
        console.log("Request to revoke Api key by userid: ",userId);
        const revoked = await ApiKeyService.revokeApiKey(id,userId);
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