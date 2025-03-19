export interface UploadResult {
    fileUid: string;
    secureUrl: string;
    originalName: string;
    success: true;
}

export interface UploadError {
    originalName: string;
    error: string;
    success: false;
}

export type UploadOutcome = UploadResult | UploadError;