
/**
 * Resizes an image file if it exceeds max dimensions
 */
export const resizeImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                }, 'image/jpeg', 0.8); // 80% quality
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Converts a Blob or File to Base64 string
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Transforms common image URLs to direct links (e.g. Google Drive)
 */
export const getDirectImageUrl = (url: string): string => {
    if (!url) return '';
    
    // Handle Google Drive sharing links
    const driveMatch = url.match(/\/(?:d|file\/d|open\?id=)([a-zA-Z0-9_-]+)/);
    if (driveMatch && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        const fileId = driveMatch[1];
        return `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
    }
    
    return url;
};
