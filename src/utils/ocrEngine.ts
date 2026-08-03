import { createWorker } from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export async function performOcrOnImage(
  imageSrc: string,
  onProgress?: (status: string, progress: number) => void
): Promise<OcrResult> {
  try {
    if (onProgress) onProgress("Initializing OCR engine...", 0.1);

    const worker = await createWorker("eng");

    if (onProgress) onProgress("Processing image layout...", 0.4);

    const ret = await worker.recognize(imageSrc);

    if (onProgress) onProgress("Finalizing text extraction...", 0.9);

    await worker.terminate();

    if (onProgress) onProgress("Completed", 1.0);

    return {
      text: ret.data.text.trim(),
      confidence: Math.round(ret.data.confidence),
      success: true,
    };
  } catch (err: any) {
    console.error("Tesseract OCR error:", err);
    return {
      text: "",
      confidence: 0,
      success: false,
      error: err?.message || "Failed to process image OCR",
    };
  }
}
