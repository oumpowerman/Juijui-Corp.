
export const googleDriveService = {
    async getAuthUrl() {
        try {
            const response = await fetch('/api/auth/google/url');
            if (!response.ok) throw new Error('Failed to fetch auth URL');
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return data.url;
            }
            throw new Error('Server returned non-JSON response');
        } catch (error) {
            console.error('getAuthUrl error:', error);
            return null;
        }
    },

    async getStatus() {
        try {
            const response = await fetch('/api/auth/google/status');
            if (!response.ok) return false;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return data.connected;
            }
            return false;
        } catch (error) {
            console.error('getStatus error:', error);
            return false;
        }
    },

    async uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/google-drive', {
            method: 'POST',
            body: formData,
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok) {
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload to Google Drive');
            }
            throw new Error('Failed to upload to Google Drive (Server HTML Error)');
        }

        if (contentType && contentType.includes('application/json')) {
            return await response.json(); // { id, url }
        }
        throw new Error('Server returned custom non-JSON response on upload');
    }
};
