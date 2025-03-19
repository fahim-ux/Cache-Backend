import {Router} from 'express';
import { bucket } from '../config/firebase';
import { Request,Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    // const filepath = req.query.filePath;
    const {fileuid,filename} = req.query;
    console.log("File Name:", filename);
    if(!fileuid || !filename){
        res.status(400).json({ success:false, error: "Missing required parameters" });
        return;
    }

    const filePath = `uploads/${fileuid}/${filename}`;
    // console.log("Queried File Path:", filePath);

    try{
        const file = bucket.file(filePath);
        // console.log("File:", file);
        const readStream = file.createReadStream();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        // res.setHeader('Content-Disposition', `inline; filename=${filename}`);
        // res.setHeader('Content-Disposition', `inline; filename=${filename.toString()}`);
        // res.setHeader('Content-Disposition', `inline; filename="CV.pdf"`);

        readStream.pipe(res);
        readStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            res.status(500).send('Error downloading file');
          });

    }
    catch(err){
        console.error("Error fetching file:", err);
        res.status(500).json({ success:false,error: "Error fetching file" });
    }
})

export default router;