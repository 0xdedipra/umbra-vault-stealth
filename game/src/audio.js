// Every sound is synthesised with WebAudio — no files. Footsteps are the stealth
// information channel: yours tell guards where you are, and a guard's boots swell as he
// comes closer, so a careful player can navigate by ear.

let actx = null;
let master = null;
let muted = false;
let alarmOsc = null;
let alarmGain = null;
let humOsc = null;

function ensure() {
  if (actx) {
    if (actx.state === 'suspended') actx.resume();
    return true;
  }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(actx.destination);
    // A barely-there room tone so silence itself feels like a museum at night.
    humOsc = actx.createOscillator();
    const humGain = actx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.value = 58;
    humGain.gain.value = 0.012;
    humOsc.connect(humGain).connect(master);
    humOsc.start();
    return true;
  } catch {
    return false;
  }
}

export function unlockAudio() {
  ensure();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = value ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function blip(freq, dur, type, vol, slideTo) {
  if (!ensure()) return;
  const t = actx.currentTime;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noiseBurst(dur, vol, freq) {
  if (!ensure()) return;
  const t = actx.currentTime;
  const len = Math.max(1, Math.floor(actx.sampleRate * dur));
  const buffer = actx.createBuffer(1, len, actx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = actx.createBufferSource();
  src.buffer = buffer;
  const filter = actx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 0.8;
  const g = actx.createGain();
  g.gain.value = vol;
  src.connect(filter).connect(g).connect(master);
  src.start(t);
}

/** Your footstep. `kind`: 'crouch' | 'walk' | 'run' — louder is literally more dangerous. */
export function footstep(kind) {
  if (kind === 'run') noiseBurst(0.09, 0.20, 300);
  else if (kind === 'walk') noiseBurst(0.06, 0.08, 380);
  else noiseBurst(0.05, 0.03, 460);
}

/** A guard's boot, volume by distance — the sound of a patrol you cannot see. */
export function guardStep(distance) {
  const v = Math.max(0, 0.22 * (1 - distance / 560));
  if (v <= 0.01) return;
  noiseBurst(0.07, v, 240);
}

export function coinClink() {
  blip(2093, 0.12, 'sine', 0.16);
  setTimeout(() => blip(2637, 0.16, 'sine', 0.12), 55);
}

export function caseChime() {
  blip(1318, 0.14, 'triangle', 0.14);
  setTimeout(() => blip(1760, 0.2, 'triangle', 0.12), 70);
}

export function takedownThud() {
  noiseBurst(0.16, 0.3, 140);
  blip(82, 0.22, 'sine', 0.25, 40);
}

export function suspicionSting() {
  blip(392, 0.16, 'square', 0.06, 370);
}

export function spottedSting() {
  blip(660, 0.12, 'square', 0.1, 660);
  setTimeout(() => blip(660, 0.18, 'square', 0.1), 120);
}

export function laserBuzz() {
  blip(1180, 0.14, 'sawtooth', 0.07, 900);
}

export function panelBeep(ok) {
  blip(ok ? 880 : 220, 0.1, 'square', 0.08);
}

export function heartbeat(intensity) {
  const v = 0.05 + intensity * 0.16;
  blip(55, 0.1, 'sine', v, 45);
  setTimeout(() => blip(50, 0.09, 'sine', v * 0.7, 42), 130);
}

/** The alarm tone runs while the alarm is hot; call with false to silence it. */
export function setAlarmTone(on) {
  if (!ensure()) return;
  if (on && !alarmOsc) {
    alarmOsc = actx.createOscillator();
    alarmGain = actx.createGain();
    alarmOsc.type = 'triangle';
    alarmOsc.frequency.value = 520;
    alarmGain.gain.value = 0.0;
    alarmGain.gain.linearRampToValueAtTime(0.045, actx.currentTime + 0.2);
    const lfo = actx.createOscillator();
    const lfoGain = actx.createGain();
    lfo.frequency.value = 2.2;
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(alarmOsc.frequency);
    alarmOsc.connect(alarmGain).connect(master);
    alarmOsc.start();
    lfo.start();
    alarmOsc.__lfo = lfo;
  } else if (!on && alarmOsc) {
    const osc = alarmOsc;
    const lfo = alarmOsc.__lfo;
    alarmGain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.15);
    setTimeout(() => {
      try { osc.stop(); lfo.stop(); } catch { /* already stopped */ }
    }, 200);
    alarmOsc = null;
    alarmGain = null;
  }
}
