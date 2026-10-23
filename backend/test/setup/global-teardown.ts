export default async () => {
  await (globalThis as any).__MYSQL__?.stop();
  await (globalThis as any).__REDIS__?.stop();
};
