import {Router} from 'express';
import { authenticateUser } from '../middleware/userAuth';
import { upload } from '../models/uploadModel';
import { db, bucket } from '../config/firebase';
import * as admin from 'firebase-admin';
import { Request,Response } from 'express';
import { UploadOutcome, UploadError, UploadResult } from '@/types/file';
import { v4 as uuidv4 } from 'uuid';


const router = Router();

router.use(authenticateUser);
router.use(upload.array('files'));
router.post('/files',async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ error: "No files uploaded" });
            return;
        }

        const uploadedFiles = req.files as Express.Multer.File[];
        const userId = req.user?.id;
        if (!userId) {
            res.status(400).json({ error: "Missing userId" });
            return;
        }

        console.log("Uploaded Files:", uploadedFiles);
        console.log("User ID:", userId);

        const uploadResults: UploadOutcome[] = [];

        for (const file of uploadedFiles) {
            try {
                const { originalname, mimetype, buffer } = file;
                const fileUid = uuidv4();
                // const filePath = `uploads/${userId}/${fileUid}_${originalname}`;
                const filePath = `uploads/${fileUid}/${originalname}`;

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
                            const UploadResult:UploadResult = { fileUid, secureUrl, originalName: originalname, success: true };
                            resolve(UploadResult);
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
                const uploadError: UploadError = {
                    originalName: file.originalname,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    success: false
                };
                uploadResults.push(uploadError);
            }
        }

        const totalFiles = uploadResults.length;
        const successCount = uploadResults.filter(result => result.success).length;
        res.status(200).json({
            success: true,
            summary: {
                total: totalFiles,
                successful: successCount,
                failed: totalFiles - successCount
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

export default router;