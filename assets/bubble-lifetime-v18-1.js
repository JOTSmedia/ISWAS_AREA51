// One greeting per owner/visit. Visibility changes never restart its deadline.
export class BubbleLifetime {
  constructor(duration = 3000, fade = 250) { this.duration=duration; this.fade=fade; this.key=null; this.started=null; this.closed=false; }
  sync(key, eligible, now) {
    if (key !== this.key) { this.key=key; this.started=null; this.closed=false; }
    if (!key || this.closed) return 'hidden';
    if (!eligible) { if(this.started!==null)this.closed=true; return 'hidden'; }
    if(this.started===null)this.started=now;
    const elapsed=now-this.started;
    if(elapsed>=this.duration){this.closed=true;return 'expired';}
    return elapsed>=this.duration-this.fade?'fading':'visible';
  }
  dismiss(){this.closed=true;}
}
