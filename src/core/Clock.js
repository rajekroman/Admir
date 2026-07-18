export class Clock {
  constructor({ fixedStep = 1 / 60, maxFrameTime = 0.25 } = {}) {
    this.fixedStep = fixedStep;
    this.maxFrameTime = maxFrameTime;
    this.accumulator = 0;
    this.lastTimestamp = 0;
    this.running = false;
    this.requestId = 0;
    this.consecutiveErrors = 0;
  }

  start(update, render, onError = null) {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();

    const report = (error, phase) => {
      this.consecutiveErrors += 1;
      this.accumulator = 0;
      try { onError?.(error, phase, this.consecutiveErrors); }
      catch (handlerError) { console.error("Runtime error handler failed", handlerError); }
    };

    const frame = (timestamp) => {
      if (!this.running) return;
      // Naplánování dalšího snímku proběhne před výpočtem. Jediná výjimka v
      // rendereru nebo AI tak už nemůže trvale zastavit celou herní smyčku.
      this.requestId = requestAnimationFrame(frame);

      const elapsed = Math.min(
        this.maxFrameTime,
        Math.max(0, (timestamp - this.lastTimestamp) / 1000),
      );
      this.lastTimestamp = timestamp;
      this.accumulator += elapsed;

      try {
        while (this.accumulator >= this.fixedStep) {
          update(this.fixedStep);
          this.accumulator -= this.fixedStep;
        }
      } catch (error) {
        report(error, "update");
        return;
      }

      try {
        render(this.accumulator / this.fixedStep, elapsed);
        this.consecutiveErrors = 0;
      } catch (error) {
        report(error, "render");
      }
    };

    this.requestId = requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;
    if (this.requestId) cancelAnimationFrame(this.requestId);
    this.requestId = 0;
    this.accumulator = 0;
    this.consecutiveErrors = 0;
  }
}
