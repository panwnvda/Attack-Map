import { RECONNAISSANCE } from "./data/recon";
import { RESOURCE_DEVELOPMENT } from "./data/resource-dev";
import { INITIAL_ACCESS } from "./data/initial-access";
import { EXECUTION } from "./data/execution";
import { PERSISTENCE } from "./data/persistence";
import { PRIVILEGE_ESCALATION } from "./data/privilege-esc";
import { DEFENSE_EVASION } from "./data/defense-evasion";
import { CREDENTIAL_ACCESS } from "./data/credential-access";
import { DISCOVERY } from "./data/discovery";
import { LATERAL_MOVEMENT } from "./data/lateral-movement";
import { COLLECTION } from "./data/collection";
import { COMMAND_AND_CONTROL } from "./data/c2";
import { EXFILTRATION } from "./data/exfiltration";
import { IMPACT } from "./data/impact";

export const PHASES = [
  RECONNAISSANCE,
  RESOURCE_DEVELOPMENT,
  INITIAL_ACCESS,
  EXECUTION,
  PERSISTENCE,
  PRIVILEGE_ESCALATION,
  DEFENSE_EVASION,
  CREDENTIAL_ACCESS,
  DISCOVERY,
  LATERAL_MOVEMENT,
  COLLECTION,
  COMMAND_AND_CONTROL,
  EXFILTRATION,
  IMPACT,
];

export const getPhaseById = (id) => PHASES.find(p => p.id === id);
export const getPhaseColor = (id) => {
  const phase = getPhaseById(id);
  return phase ? phase.color : '#94a3b8';
};