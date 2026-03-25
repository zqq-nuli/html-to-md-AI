const AUTO_DOWNLOAD_KEY = 'html-to-md-auto-download';

export async function getAutoDownload(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(AUTO_DOWNLOAD_KEY);
    return result[AUTO_DOWNLOAD_KEY] === true;
  } catch {
    return false;
  }
}

export async function setAutoDownload(value: boolean): Promise<void> {
  await chrome.storage.local.set({ [AUTO_DOWNLOAD_KEY]: value });
}
