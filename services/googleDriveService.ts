
export const googleDriveService = {
    async getAuthUrl() {
        const response = await fetch('/api/auth/google/url');
        const data = await response.json();
        return data.url;
    },

    async getStatus() {
        const response = await fetch('/api/auth/google/status');
        const data = await response.json();
        return data.connected;
    },

    async uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/google-drive', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload to Google Drive');
        }

        return await response.json(); // { id, url }
    }
};
