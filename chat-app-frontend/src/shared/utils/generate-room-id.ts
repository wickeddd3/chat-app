export function generatePrivateRoomId(
  userIdA: string,
  userIdB: string,
): string {
  return [userIdA, userIdB].sort().join("--");
}
