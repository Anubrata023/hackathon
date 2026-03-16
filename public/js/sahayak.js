// hackathon-dev/backend/public/js/sahayak.js

const Sahayak = {
    synth: window.speechSynthesis,
    voice: null,
    
    init: function() {
        // Load voices and prefer Hindi or Indian English for regional familiarity
        let voices = this.synth.getVoices();
        this.voice = voices.find(v => v.lang === 'hi-IN' || v.lang === 'en-IN') || voices[0];
        
        // Inject the Sahayak Floating Button into the UI
        const btn = document.createElement('button');
        btn.id = 'sahayak-btn';
        btn.innerHTML = '🔊 Ask Sahayak';
        btn.style.cssText = 'position: fixed; bottom: 30px; right: 30px; z-index: 9999; padding: 15px 25px; border-radius: 50px; background-color: #15803d; color: white; border: none; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); font-weight: bold; font-size: 16px; cursor: pointer; transition: all 0.3s ease;';
        
        // Add a gentle pulse animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes sahayak-pulse {
                0% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(21, 128, 61, 0); }
                100% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0); }
            }
            #sahayak-btn:hover { transform: scale(1.05); }
            .sahayak-active { animation: sahayak-pulse 1.5s infinite; background-color: #16a34a !important; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(btn);
    },

    speak: function(text, lang = 'en-IN') {
        if (!window.speechSynthesis) return;
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

        let utter = new SpeechSynthesisUtterance(text);
        
        // --- FEMALE VOICE FILTER ---
        let availableVoices = window.speechSynthesis.getVoices();
        let femaleVoice = availableVoices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('Zira') || 
            voice.name.includes('Samantha') || 
            voice.name.includes('Veena') || 
            voice.name.includes('Aditi')
        );
        if (femaleVoice) { utter.voice = femaleVoice; }
        utter.pitch = 1.35; 
        utter.rate = 0.90; 
        // ---------------------------

        utter.lang = lang;
        window.speechSynthesis.speak(utter);
    }
};

// Initialize when voices are loaded by the browser
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => Sahayak.init();
} else {
    setTimeout(() => Sahayak.init(), 1000);
}
