import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * @typedef {{ name: string, gitName: string, email: string, username: string }} Profile
 * @typedef {{ profiles: Profile[] }} Config
 */

/**
 * Base directory for ghsw config. Overridable via GHSW_HOME for tests.
 * @returns {string}
 */
export function getGhswHome() {
  return process.env.GHSW_HOME || path.join(os.homedir(), '.ghsw');
}

/**
 * @returns {string}
 */
export function getConfigPath() {
  return path.join(getGhswHome(), 'config.json');
}

/**
 * @returns {Config}
 */
export function loadConfig() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return { profiles: [] };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.profiles)) {
      return { profiles: [] };
    }
    return { profiles: data.profiles };
  } catch {
    throw new Error(
      `Failed to read ${configPath}. Fix or delete the file and try again.`
    );
  }
}

/**
 * @param {Config} config
 */
export function saveConfig(config) {
  const home = getGhswHome();
  fs.mkdirSync(home, { recursive: true });
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/**
 * @returns {Profile[]}
 */
export function listProfiles() {
  return loadConfig().profiles;
}

/**
 * @param {string} name
 * @returns {Profile | undefined}
 */
export function getProfile(name) {
  return listProfiles().find(
    (p) => p.name.toLowerCase() === String(name).toLowerCase()
  );
}

/**
 * @param {Profile} profile
 */
export function addProfile(profile) {
  const config = loadConfig();
  if (config.profiles.some((p) => p.name.toLowerCase() === profile.name.toLowerCase())) {
    throw new Error(`Profile "${profile.name}" already exists.`);
  }
  if (
    config.profiles.some(
      (p) => p.username.toLowerCase() === profile.username.toLowerCase()
    )
  ) {
    throw new Error(`A profile for GitHub user "${profile.username}" already exists.`);
  }
  config.profiles.push(profile);
  saveConfig(config);
  return profile;
}

/**
 * @param {string} name
 * @param {{ gitName?: string, email?: string }} fields
 * @returns {Profile}
 */
export function updateProfile(name, fields) {
  const config = loadConfig();
  const idx = config.profiles.findIndex(
    (p) => p.name.toLowerCase() === String(name).toLowerCase()
  );
  if (idx === -1) {
    throw new Error(`Profile "${name}" not found.`);
  }
  const updated = {
    ...config.profiles[idx],
    ...Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined && v !== null)
    ),
  };
  config.profiles[idx] = updated;
  saveConfig(config);
  return updated;
}

/**
 * @param {string} name
 * @returns {Profile}
 */
export function removeProfile(name) {
  const config = loadConfig();
  const idx = config.profiles.findIndex(
    (p) => p.name.toLowerCase() === String(name).toLowerCase()
  );
  if (idx === -1) {
    throw new Error(`Profile "${name}" not found.`);
  }
  const [removed] = config.profiles.splice(idx, 1);
  saveConfig(config);
  return removed;
}
