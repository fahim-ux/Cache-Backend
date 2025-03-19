import { db } from '@/config/config';
import { ApiKey } from '@/types/apiKey';
import crypto from 'crypto';

const API_KEY_COLLECTION = 'apiKeys';

export class ApiKeyService {
    async generateApiKey (userId:string, name?:string, expiresInDays=0):Promise<ApiKey>{
        const Api_key = crypto.randomBytes(32).toString('hex');

        const doc = db.collection(API_KEY_COLLECTION).doc();
        const expiresAt = expiresInDays > 0 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) 
        : null;

        const apiKey:ApiKey = {
            id: doc.id,
            key: Api_key,
            userId,
            name: name || `API KEY ${new Date().toISOString()}`,
            createdAt: new Date(),
            active: true,
            ...(expiresAt && {expiresAt})
        }
        try
        {
            await doc.set(apiKey);
            // return apiKey;
        }
        catch(error){
            console.error("Error generating API key:", error);
        }
        return apiKey;
    }

    async ValidateApiKey(key:string):Promise<ApiKey | null>{
        const querySnapshot = await db.collection(API_KEY_COLLECTION).where("key","==",key).get();
        if(querySnapshot.empty){
            return null;
        }
        const apiKey = querySnapshot.docs[0].data() as ApiKey;
        if(apiKey.expiresAt && apiKey.expiresAt < new Date()){
            await db.collection(API_KEY_COLLECTION).doc(apiKey.id).update({active:false});
            console.error("API key expired:", apiKey);
            return null;
        }

        await db.collection(API_KEY_COLLECTION).doc(apiKey.id).update({lastUsed: new Date()});

        return {
            ...apiKey,
            id: apiKey.id
        };
    }

    async getUserApiKeys(userId:string):Promise<ApiKey[]>{
        const querySnapshot = await db.collection(API_KEY_COLLECTION).where("userId","==",userId).get();
        return querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data() as ApiKey
            }
        });
    }

    async revokeApiKey(apiKeyId:string, userId:string):Promise<boolean>{
        const apiKey = await db.collection(API_KEY_COLLECTION).doc(apiKeyId).get();
        if(!apiKey.exists){
            return false;
        }
        if(apiKey.data().userId !== userId){
            console.error("User does not own API key");
            return false;
        }
        try{
            await db.collection(API_KEY_COLLECTION).doc(apiKeyId).update({active:false});
            return true;
        }
        catch(error){
            console.error("Error revoking API key:", error);
            return false;
        }
    }

    async deleteApiKey(apiKeyId:string, userId:string):Promise<boolean>{
        const apiKey = await db.collection(API_KEY_COLLECTION).doc(apiKeyId).get();
        if(!apiKey.exists){
            return false;
        }
        if(apiKey.data().userId !== userId){
            console.error("User does not own API key");
            return false;
        }
        try{
            await db.collection(API_KEY_COLLECTION).doc(apiKeyId).delete();
            return true;
        }
        catch(error){
            console.error("Error deleting API key:", error);
            return false;
        }
    }
}


export default new ApiKeyService();