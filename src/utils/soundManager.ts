

// Simple synthesizer for game sounds using Web Audio API
// This avoids external dependencies or broken URLs

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Music State
let musicMasterGain: GainNode | null = null;
let isMusicPlaying = false;
let nextNoteTime = 0;
let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let melodyTimer: ReturnType<typeof setTimeout> | null = null;

const getContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.5; // Default volume
        masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
};

export const initAudio = () => {
    const ctx = getContext();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
};

export const setMasterVolume = (volume: number) => {
    const ctx = getContext();
    if (masterGain) {
        // Smooth transition
        masterGain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    }
};

// --- HELPER: Create an "Electric Piano" Tone using FM Synthesis ---
const playEpianoNote = (ctx: AudioContext, dest: AudioNode, freq: number, time: number, duration: number, vol: number) => {
    const t = time;
    
    // 1. Carrier (The main tone)
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = freq;

    // 2. Modulator (Creates the "glassy" / "metallic" bell sound)
    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = freq * 2; // 2nd harmonic for bell sound
    
    const modulatorGain = ctx.createGain();
    // Modulator envelope (bell attack)
    modulatorGain.gain.setValueAtTime(freq * 1.5, t); 
    modulatorGain.gain.exponentialRampToValueAtTime(1, t + 0.2); // Quick decay of harmonics

    modulator.connect(modulatorGain);
    modulatorGain.connect(carrier.frequency);

    // 3. Output Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02); // Soft attack
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration); // Long release

    carrier.connect(gain);
    gain.connect(dest);

    carrier.start(t);
    modulator.start(t);
    
    carrier.stop(t + duration + 1);
    modulator.stop(t + duration + 1);
};

// --- Ambient Music Sequencer ---

// Scale: C Major 7 / Pentatonic vibe
const CHORDS = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
    [349.23, 440.00, 523.25, 659.25], // Fmaj7 (F4, A4, C5, E5)
    [293.66, 349.23, 440.00, 523.25], // Dm7 (D4, F4, A4, C5)
    [392.00, 493.88, 587.33, 698.46], // G7 (G4, B4, D5, F5)
];
const BASS_NOTES = [130.81, 174.61, 146.83, 196.00]; // C3, F3, D3, G3
let currentChordIndex = 0;

const scheduleMusic = () => {
    if (!isMusicPlaying || !audioCtx || !musicMasterGain) return;

    const secondsPerBeat = 2.5; // Slow tempo
    const lookahead = 0.1; 

    while (nextNoteTime < audioCtx.currentTime + lookahead) {
        // --- Play Bass ---
        const bassFreq = BASS_NOTES[currentChordIndex];
        playEpianoNote(audioCtx, musicMasterGain, bassFreq, nextNoteTime, 3.0, 0.4);

        // --- Play Chord (Arpeggiated slightly) ---
        const chord = CHORDS[currentChordIndex];
        chord.forEach((freq, i) => {
            // Stagger notes slightly for realism
            playEpianoNote(audioCtx!, musicMasterGain!, freq, nextNoteTime + (i * 0.05), 3.0, 0.15);
        });

        // --- Advance Sequence ---
        nextNoteTime += secondsPerBeat;
        currentChordIndex = (currentChordIndex + 1) % CHORDS.length;
    }

    schedulerTimer = setTimeout(scheduleMusic, 100);
};

// Random high melody notes
const scheduleMelody = () => {
    if (!isMusicPlaying || !audioCtx || !musicMasterGain) return;
    
    // Pentatonic Scale (C Major) for melody: C, D, E, G, A
    const melodyScale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    
    // Random chance to play a note
    if (Math.random() > 0.4) {
        const note = melodyScale[Math.floor(Math.random() * melodyScale.length)];
        const delay = Math.random() * 0.5; // Play slightly off-beat
        playEpianoNote(audioCtx, musicMasterGain, note, audioCtx.currentTime + delay, 1.5, 0.1);
    }

    // Schedule next melody check randomly
    melodyTimer = setTimeout(scheduleMelody, 800 + Math.random() * 1000);
};

export const startAmbientMusic = () => {
    if (isMusicPlaying) return;
    const ctx = getContext();
    isMusicPlaying = true;
    nextNoteTime = ctx.currentTime + 0.1;

    musicMasterGain = ctx.createGain();
    musicMasterGain.gain.value = 0.4; // Mix volume relative to SFX
    musicMasterGain.connect(masterGain!);

    // Start Loops
    scheduleMusic();
    scheduleMelody();
};

export const stopAmbientMusic = () => {
    isMusicPlaying = false;
    if (schedulerTimer) clearTimeout(schedulerTimer);
    if (melodyTimer) clearTimeout(melodyTimer);

    const ctx = getContext();
    
    if (musicMasterGain) {
        // Fade out
        musicMasterGain.gain.setTargetAtTime(0, ctx.currentTime, 1);
        setTimeout(() => {
            if (musicMasterGain) musicMasterGain.disconnect();
            musicMasterGain = null;
        }, 1100);
    }
};


// --- SFX Helper ---
const createNoiseBuffer = () => {
    const ctx = getContext();
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

let noiseBuffer: AudioBuffer | null = null;

// --- Sound Effects ---

export const playHoverSound = () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    
    // Tiny blip
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, t); // Very quiet
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    osc.connect(gain);
    gain.connect(masterGain!);
    
    osc.start(t);
    osc.stop(t + 0.05);
};

export const playClickSound = () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    
    // Thud/Click
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.connect(gain);
    gain.connect(masterGain!);
    
    osc.start(t);
    osc.stop(t + 0.1);
};

export const playCardFlip = () => {
    const ctx = getContext();
    if (!noiseBuffer) noiseBuffer = createNoiseBuffer();

    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain!); // Connect to Master

    noise.start(t);
    noise.stop(t + 0.1);
};

export const playShuffleDeal = () => {
    const ctx = getContext();
    if (!noiseBuffer) noiseBuffer = createNoiseBuffer();
    
    const t = ctx.currentTime;
    // Play a rapid sequence of flips
    for(let i=0; i<10; i++) {
        const offset = i * 0.06;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain!);

        noise.start(t + offset);
        noise.stop(t + offset + 0.05);
    }
};

export const playMeldSound = () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    
    // Pleasant "Ding"
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t); // C5
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    
    osc.connect(gain);
    gain.connect(masterGain!);
    
    osc.start(t);
    osc.stop(t + 0.5);
};

export const playRoundWin = () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    
    // Major Arpeggio
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, t + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5);
        
        osc.connect(gain);
        gain.connect(masterGain!);
        
        osc.start(t + i * 0.1);
        osc.stop(t + i * 0.1 + 0.5);
    });
};

export const playGrandWin = () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    
    // Fanfare
    [523.25, 523.25, 523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const offset = i < 3 ? i * 0.15 : 0.45 + (i-3)*0.2;
        
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.8);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain!);
        
        osc.start(t + offset);
        osc.stop(t + offset + 0.8);
    });
};

export const playTickSound = () => {
    const ctx = getContext();
    const t = ctx.currentTime;
    
    // High woodblock tick
    const osc = ctx.createOscillator();
    osc.type = 'sine'; // Using sine for softer tick, or triangle
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t); // Softer volume
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    osc.connect(gain);
    gain.connect(masterGain!);
    
    osc.start(t);
    osc.stop(t + 0.05);
};