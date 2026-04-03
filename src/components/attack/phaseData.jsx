import { RECON, RESOURCE_DEV, INITIAL_ACCESS, EXECUTION } from './data/tactics1';
import { PERSISTENCE, PRIV_ESC, DEFENSE_EVASION } from './data/tactics2';
import { CRED_ACCESS, DISCOVERY, LATERAL_MOVEMENT } from './data/tactics3';
import { COLLECTION, C2, EXFILTRATION, IMPACT } from './data/tactics4';

export const PHASES = [
  RECON,
  RESOURCE_DEV,
  INITIAL_ACCESS,
  EXECUTION,
  PERSISTENCE,
  PRIV_ESC,
  DEFENSE_EVASION,
  CRED_ACCESS,
  DISCOVERY,
  LATERAL_MOVEMENT,
  COLLECTION,
  C2,
  EXFILTRATION,
  IMPACT,
];

export const getPhaseById = (id) => PHASES.find(p => p.id === id);
export const getPhaseColor = (id) => {
  const phase = getPhaseById(id);
  return phase ? phase.color : '#94a3b8';
};