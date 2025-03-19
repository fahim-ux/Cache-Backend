import { db } from '../config/firebase';
import { ApiKey } from '../types/apiKey';
import crypto from 'crypto';

const apiKeysCollection = db.collection('apiKeys');

export const generateApiKey = () : string => {
    return crypto.randomBytes(32).toString('hex');
}

export const addApiKey = async (apiKey:ApiKey) : Promise<void> => {
    await apiKeysCollection.doc(apiKey.id).set(apiKey);
}

