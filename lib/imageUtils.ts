
import heic2any from 'heic2any';

export const compressImage = async (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
    // 1. Handle HEIC Conversion with safety checks for large files
    let processedFile = file;
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        // If HEIC is too large (e.g. > 3MB), skip client-side conversion to prevent tab crashes
        if (file.size > 3 * 1024 * 1024) {
            console.warn(`HEIC file is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB) for client-side conversion. Skipping to prevent browser crash.`);
            return file;
        }
        try {
            const blob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });
            const finalBlob = Array.isArray(blob) ? blob[0] : blob;
            processedFile = new File([finalBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (e) {
            console.error("HEIC conversion failed, using original file", e);
        }
    }

    // 2. Resize & Compress with megapixel safety checks
    return new Promise((resolve, reject) => {
        // If not an image, return original
        if (!processedFile.type.startsWith('image/')) {
            resolve(processedFile);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(processedFile);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            
            img.onload = () => {
                // Safeguard against high megapixel images (e.g., > 8MP) to prevent iOS Canvas memory crashes
                const totalPixels = img.width * img.height;
                if (totalPixels > 8 * 1000 * 1000) {
                    console.warn(`Image resolution is too high (${img.width}x${img.height} = ${(totalPixels / 1000000).toFixed(2)}MP). Skipping Canvas drawing to prevent memory crash.`);
                    resolve(processedFile);
                    return;
                }

                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if needed
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context missing'));
                    return;
                }
                
                // Fill white background to prevent black background on transparent/HEIC images
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const newFile = new File([blob], processedFile.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Compression failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            
            img.onerror = (err) => reject(err);
        };
        
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Extracts Google Drive File ID from various Google Drive URL formats
 */
export const extractDriveFileId = (url: string | undefined): string | null => {
    if (!url) return null;

    try {
        if (url.includes('lh3.googleusercontent.com/d/')) {
            const match = url.match(/\/d\/([^=/?#]+)/);
            if (match?.[1]) return match[1];
        }

        if (!url.includes('drive.google.com')) return null;

        const urlObj = new URL(url);
        let id = urlObj.searchParams.get('id');

        if (!id) {
            const pathParts = urlObj.pathname.split('/');
            const dIndex = pathParts.indexOf('d');
            if (dIndex !== -1 && pathParts[dIndex + 1]) {
                id = pathParts[dIndex + 1];
            }
        }

        return id || null;
    } catch (e) {
        console.error("Error parsing Drive URL", e);
        return null;
    }
};

/**
 * Transforms Google Drive Links to Direct Images using Googleusercontent proxy
 */
export const getDirectDriveUrl = (url: string | undefined): string => {
    if (!url) return '';
    const id = extractDriveFileId(url);
    if (id) {
        return `https://lh3.googleusercontent.com/d/${id}=s2000`;
    }
    return url;
};

/**
 * Returns an ordered list of candidate image URLs for Google Drive links
 * to support automatic multi-endpoint fallback if one endpoint is throttled or blocked.
 */
export const getDriveFallbackUrls = (url: string | undefined): string[] => {
    if (!url) return [];
    const id = extractDriveFileId(url);
    if (!id) return [url];

    return [
        `https://lh3.googleusercontent.com/d/${id}=s2000`,
        `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
        `https://drive.google.com/uc?export=view&id=${id}`,
    ];
};

