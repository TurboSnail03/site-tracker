const DRIVE_FILE_NAME = 'sitetracker_ledger_backup.json';

/**
 * Helper: Formats headers for Google API requests
 */
const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

/**
 * Main Sync Engine:
 * 1. Searches for an existing backup in the hidden AppData folder.
 * 2. If found, updates it (PATCH).
 * 3. If not found, creates it (POST).
 */
export const syncToDrive = async (accessToken, data) => {
  try {
    // 1. Search for the backup file
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}'&spaces=appDataFolder`,
      { headers: getHeaders(accessToken) }
    );
    
    if (!searchRes.ok) throw new Error('Search failed');
    const { files } = await searchRes.json();

    const fileContent = JSON.stringify(data);
    
    // 2. Prepare Metadata
    const metadata = {
      name: DRIVE_FILE_NAME,
      parents: ['appDataFolder'],
    };

    if (files.length > 0) {
      // UPDATE: Overwrite the existing file
      const fileId = files[0].id;
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { 
            ...getHeaders(accessToken), 
            'Content-Type': 'application/json' 
          },
          body: fileContent,
        }
      );
      return updateRes.ok;
    } else {
      // CREATE: Upload a brand new file
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        }
      );
      return createRes.ok;
    }
  } catch (error) {
    console.error('CRITICAL SYNC ERROR:', error);
    return false;
  }
};

/**
 * Helper: Fetches the data back from the cloud for a Restore
 */
export const fetchFromDrive = async (accessToken) => {
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}'&spaces=appDataFolder`,
      { headers: getHeaders(accessToken) }
    );
    const { files } = await searchRes.json();
    
    if (files.length === 0) return null;

    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`,
      { headers: getHeaders(accessToken) }
    );
    
    return await downloadRes.json();
  } catch (error) {
    console.error('RESTORE ERROR:', error);
    return null;
  }
};