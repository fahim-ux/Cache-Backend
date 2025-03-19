import express from 'express';
// import { db, bucket } from '@/config/firebase';
import { db, bucket } from './config/firebase';
import cors from 'cors';
import dotenv from 'dotenv';
import apikeyRoutes from './routes/apiKeyRoutes';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import fileUploadRoutes from './routes/fileUploadRoutes';
import fileDownloadRoutes from './routes/fileDownload';


dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/keys', apikeyRoutes);
app.get('/api/protected', apiKeyAuth, (req, res) => {
    res.json({
        success: true,
        message: 'This is a protected route',
        user: req.user.id,
        apiKey: {
            id: req.apiKey?.id,
            name: req.apiKey?.name,
            lastUsed: req.apiKey?.lastUsed
        }
    });
});


app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});



app.get('/api/bucketName', (req, res) => {
    res.send(`This Api is using ${db.databaseId} : ${bucket.name}`);
})

app.use('/api/upload', fileUploadRoutes);
app.use('/api/download/file', fileDownloadRoutes);

// app.post('/upload', authenticateUser, upload.array('files'), async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
//             res.status(400).json({ error: "No files uploaded" });
//             return;
//         }

//         const uploadedFiles = req.files as Express.Multer.File[];
//         const userId = req.user?.uid;
//         if (!userId) {
//             res.status(400).json({ error: "Missing userId" });
//             return;
//         }

//         console.log("Uploaded Files:", uploadedFiles);
//         console.log("User ID:", userId);

//         const uploadResults: UploadOutcome[] = [];

//         for (const file of uploadedFiles) {
//             try {
//                 const { originalname, mimetype, buffer } = file;
//                 const fileUid = uuidv4();
//                 const filePath = `uploads/${userId}/${fileUid}_${originalname}`;

//                 // Upload file to Firebase Storage using write stream
//                 const storagefile = bucket.file(filePath);
//                 const writeStream = storagefile.createWriteStream({
//                     metadata: {
//                         contentType: mimetype,
//                     },
//                     resumable: false
//                 });

//                 // Process each file upload one at a time
//                 const result = await new Promise<UploadResult>((resolve, reject) => {
//                     writeStream.on('error', (error) => {
//                         console.error("Upload stream error:", error);
//                         reject(error);
//                     });

//                     writeStream.on('finish', async () => {
//                         try {
//                             // Store metadata in Firestore
//                             await db.collection("uploads").doc(fileUid).set({
//                                 filePath,
//                                 contentType: mimetype,
//                                 userId,
//                                 createdAt: admin.firestore.FieldValue.serverTimestamp(),
//                             });

//                             // Return secure URL
//                             const secureUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
//                             resolve({ fileUid, secureUrl, originalName: originalname, success: true });
//                         } catch (error) {
//                             console.error("Metadata storage error:", error);
//                             reject(error);
//                         }
//                     });

//                     // Write buffer to stream and end
//                     writeStream.end(buffer);
//                 });

//                 uploadResults.push(result);
//             } catch (error) {
//                 console.error(`Error uploading file ${file.originalname}:`, error);
//                 uploadResults.push({
//                     originalName: file.originalname,
//                     error: error instanceof Error ? error.message : 'Unknown error',
//                     success: false
//                 });
//             }
//         }

//         const totalFiles = uploadResults.length;
//         const successCount = uploadResults.filter(result => result.success).length;
//         res.status(200).json({
//             success: true,
//             summary: {
//                 total: totalFiles,
//                 successful: successCount,
//                 failed: totalFiles - successCount
//             },
//             files: uploadResults,
//         });
//         return;
//     } catch (error) {
//         console.error("Upload Error:", error);
//         res.status(500).json({ error: "File upload failed" });
//         return;
//     }


// })


const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, '0.0.0.0', () => {
    console.log(`Server started on port ${port}`);
});