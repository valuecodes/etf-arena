export type ApiRpc = {
  invalidateAfterRun: (runDate: string) => Promise<{ status: "stub" }>;
};
