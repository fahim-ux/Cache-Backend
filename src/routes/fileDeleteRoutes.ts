import {Router} from 'express';
import { bucket } from '../config/firebase';
import {Request, Response} from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
// import { authenticateUser } from '../middleware/userAuth';



const router = Router();
// router.use(apiKeyAuth);
router.delete('/', async (req: Request, res: Response) => {
    const {fileuid, filename} = req.query;
    if(!fileuid || !filename) {
        res.status(400).json({success:false,error: "Missing required parameters"});
        return;
    }

    const filePath = `uploads/${fileuid}/${filename}`;
    const file = bucket.file(filePath);
    try {
        await file.delete();
        console.log(`File ${filename} deleted successfully`);
        res.status(200).json({success:true,message: `File ${filename} deleted successfully`});
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
        res.status(500).json({success:false,error: `Error deleting file ${filename}`});
    }
    
})


export default router;