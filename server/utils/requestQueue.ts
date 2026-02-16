/**
 * In-memory sliding window rate limiter for Anthropic API requests.
 * Tier 1 allows 50 RPM — we target 40 RPM to leave headroom.
 */
class RequestQueue {
  private timestamps: number[] = [];
  private pending: Array<{ resolve: () => void }> = [];
  private maxPerMinute = 40;
  private drainTimer: ReturnType<typeof setTimeout> | null = null;

  async acquire(): Promise<void> {
    this.cleanOldTimestamps();

    if (this.timestamps.length < this.maxPerMinute) {
      this.timestamps.push(Date.now());
      return;
    }

    // Wait until the oldest timestamp expires
    return new Promise<void>((resolve) => {
      this.pending.push({ resolve });
      this.scheduleDrain();
    });
  }

  private cleanOldTimestamps() {
    const cutoff = Date.now() - 60_000;
    this.timestamps = this.timestamps.filter(t => t > cutoff);
  }

  private scheduleDrain() {
    if (this.drainTimer) return;
    if (this.pending.length === 0) return;

    // Wait until the oldest timestamp is 60s old
    const oldest = this.timestamps[0];
    const waitMs = Math.max(oldest + 60_000 - Date.now(), 100);

    this.drainTimer = setTimeout(() => {
      this.drainTimer = null;
      this.cleanOldTimestamps();

      while (this.pending.length > 0 && this.timestamps.length < this.maxPerMinute) {
        const next = this.pending.shift();
        if (next) {
          this.timestamps.push(Date.now());
          next.resolve();
        }
      }

      // Continue draining if there are more pending
      if (this.pending.length > 0) {
        this.scheduleDrain();
      }
    }, waitMs);
  }
}

export const apiQueue = new RequestQueue();
