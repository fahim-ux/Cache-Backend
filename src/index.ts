import express from 'express';
import { db, bucket } from './config/config';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors({ origin: ['http://localhost:3000'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;

}
interface UploadResult {
    fileUid: string;
    secureUrl: string;
    originalName: string;
    success: true;
}

interface UploadError {
    originalName: string;
    error: string;
    success: false;
}

type UploadOutcome = UploadResult | UploadError;
const authenticateUser = async (req: any, res: any, next: any) => {
    console.log("Request Headers:", req.headers);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <TOKEN>"
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log("Decoded Token:", decodedToken);
        req.user = decodedToken; // Attach user info to request
        next();
    } catch (error) {
        return res.status(403).json({ error: "Unauthorized: Invalid token" });
    }
}

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});




app.get('/', (req, res) => {
    res.send(`Hello World ${db} : ${bucket.name}`);
})

app.post('/upload', authenticateUser, upload.array('files'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ error: "No files uploaded" });
            return;
        }

        const uploadedFiles = req.files as Express.Multer.File[];
        const userId = req.user?.uid;
        if (!userId) {
            res.status(400).json({ error: "Missing userId" });
            return;
        }

        console.log("Uploaded Files:", uploadedFiles);
        console.log("User ID:", userId);

        const uploadResults : UploadOutcome []= [];

        for (const file of uploadedFiles) {
            try {
                const { originalname, mimetype, buffer } = file;
                const fileUid = uuidv4();
                const filePath = `uploads/${userId}/${fileUid}_${originalname}`;

                // Upload file to Firebase Storage using write stream
                const storagefile = bucket.file(filePath);
                const writeStream = storagefile.createWriteStream({
                    metadata: {
                        contentType: mimetype,
                    },
                    resumable: false
                });

                // Process each file upload one at a time
                const result = await new Promise<UploadResult>((resolve, reject) => {
                    writeStream.on('error', (error) => {
                        console.error("Upload stream error:", error);
                        reject(error);
                    });

                    writeStream.on('finish', async () => {
                        try {
                            // Store metadata in Firestore
                            await db.collection("uploads").doc(fileUid).set({
                                filePath,
                                contentType: mimetype,
                                userId,
                                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            });

                            // Return secure URL
                            const secureUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
                            resolve({ fileUid, secureUrl , originalName:originalname, success:true});
                        } catch (error) {
                            console.error("Metadata storage error:", error);
                            reject(error);
                        }
                    });

                    // Write buffer to stream and end
                    writeStream.end(buffer);
                });

                uploadResults.push(result);
            } catch (error) {
                console.error(`Error uploading file ${file.originalname}:`, error);
                uploadResults.push({
                    originalName: file.originalname,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    success: false
                });
            }
        }
        
        const totalFiles = uploadResults.length;
        const successCount = uploadResults.filter(result => result.success).length;
        res.status(200).json({ 
            success: true, 
            summary: {
                total : totalFiles,
                successful : successCount,
                failed : totalFiles - successCount
            },
            files: uploadResults,
        });
        return;
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "File upload failed" });
        return;
    }


})

const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, '0.0.0.0', () => {
    console.log(`Server started on port ${port}`);
});