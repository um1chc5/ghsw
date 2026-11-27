export {
  getHomeDir,
  getGitconfigPath,
  getProfileGitconfigPath,
  backupGitconfig,
  readGitconfigText,
  normalizeGitdir,
} from './paths.js';
export { setGlobalUser, getGlobalUser } from './user.js';
export {
  writeProfileGitconfig,
  deleteProfileGitconfig,
  upsertIncludeIf,
  removeIncludeIfForProfile,
} from './includeIf.js';
