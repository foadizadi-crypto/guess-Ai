/**
 * Continue gate for the 19–25 wrong popup.
 * DEV / NO-AD: always grants continue. Swap this for a rewarded-ad promise later.
 * Must not touch wallet / persisted stamina.
 */
export function requestContinueReward(): Promise<boolean> {
  return Promise.resolve(true);
}
