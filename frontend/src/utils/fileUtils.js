// frontend/src/utils/fileUtils.js

/**
 * Extract component name from file path based on folder structure.
 *
 * Rules:
 * - If path contains /binaries/ (any case) -> componentName = first folder under that segment
 * - If path contains /configs/  (any case) -> componentName = first folder under that segment
 * - Otherwise -> parent folder name of the file
 *
 * @param {string} filePath - Full file path (Windows or POSIX)
 * @returns {string} Component name
 */
export function getComponentName(filePath) {
  if (!filePath) return 'unknown';

  // Normalize slashes but keep original casing
  const normalized = filePath.replace(/\\/g, '/');
  const lower = normalized.toLowerCase();

  // Helper to extract part after a folder token, preserving original case
  const getAfterToken = (tokenLower) => {
    const idx = lower.indexOf(tokenLower);
    if (idx === -1) return null;
    const after = normalized.slice(idx + tokenLower.length); // slice from original string
    const parts = after.split('/');
    return parts[0] || null;
  };

  // 1) Try /binaries/ (any case)
  const fromBinaries = getAfterToken('/binaries/');
  if (fromBinaries) return fromBinaries;

  // 2) Try /configs/ (any case)  <-- matches "Configs", "CONFIGS", etc.
  const fromConfigs = getAfterToken('/configs/');
  if (fromConfigs) return fromConfigs;

  // 3) Fallback: parent folder name
  const segments = normalized.split('/');
  if (segments.length >= 2) {
    const parent = segments[segments.length - 2];
    return parent || 'unknown';
  }

  return segments[0] || 'unknown';
}