const SahayakChat = {
    isOpen: false,
    currentLang: 'en',
    recognition: null,
    isVoiceOutputEnabled: true, // Toggle for bot speaking back
    
    // Multilingual Dictionary
    responses: {
        en: {
            welcome: "Namaskar! I am Sahayak AI. How can I help you navigate the Suvidha Portal today?",
            electricity: "I can help you pay your electricity bill. Click the button below.",
            gas: "I can take you to the LPG Gas services page.",
            grievance: "I can help you file a municipal complaint.",
            scholarship: "I can help you explore and apply for state scholarships.",
            water: "I can take you to the water supply services.",
            waste: "I can guide you to waste management services.",
            documents: "For most services, you will need your Aadhaar card, PAN card, and a registered mobile number.",
            help: "If you need human assistance, please call our toll-free helpline at 14455 or email support@suvidha.assam.gov.in.",
            fallback: "I am still learning! You can ask me about 'electricity', 'gas', 'water', 'scholarship', 'documents', or 'complaints'.",
            listening: "Listening... Please speak now.",
            cleared: "Chat session cleared for the next user."
        },
        as: {
            welcome: "নমস্কাৰ! মই সহায়ক AI। মই আপোনাক সুবিধা প'ৰ্টেলত কেনেকৈ সহায় কৰিব পাৰোঁ?",
            electricity: "মই আপোনাক বিদ্যুতৰ বিল পৰিশোধ কৰাত সহায় কৰিব পাৰো।",
            gas: "মই আপোনাক গেছ সেৱালৈ লৈ যাব পাৰো।",
            grievance: "মই আপোনাক অভিযোগ দাখিল কৰাত সহায় কৰিব পাৰো।",
            scholarship: "মই আপোনাক ৰাজ্যিক জলপানীৰ বিষয়ে সহায় কৰিব পাৰো।",
            water: "মই আপোনাক পানী যোগান সেৱালৈ লৈ যাব পাৰো।",
            waste: "মই আপোনাক আৱৰ্জনা ব্যৱস্থাপনা সেৱালৈ লৈ যাব পাৰো।",
            documents: "অধিকাংশ সেৱাৰ বাবে আপোনাক আধাৰ কাৰ্ড, প্যান কাৰ্ড আৰু পঞ্জীয়নভুক্ত ম’বাইল নম্বৰৰ প্ৰয়োজন হ’ব।",
            help: "মানৱীয় সহায়ৰ বাবে, অনুগ্ৰহ কৰি আমাৰ টোল-ফ্ৰী হেল্পলাইন ১৪৪৫৫ ত কল কৰক।",
            fallback: "মই এতিয়াও শিকি আছো! আপুনি মোক বিজুলী, গেছ, পানী বা জলপানীৰ বিষয়ে সোধক।",
            listening: "শুনো... অনুগ্ৰহ কৰি এতিয়া কওক।",
            cleared: "পৰৱৰ্তী ব্যৱহাৰকাৰীৰ বাবে চ্যাট চাফা কৰা হৈছে।"
        },
        hi: {
            welcome: "नमस्ते! मैं सहायक AI हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
            electricity: "मैं आपका बिजली बिल भरने में मदद कर सकता हूँ।",
            gas: "मैं आपको गैस सेवाओं पर ले जा सकता हूँ।",
            gririevance: "मैं शिकायत दर्ज करने में मदद कर सकता हूँ।",
            scholarship: "मैं आपको छात्रवृत्ति पोर्टल पर ले जा सकता हूँ।",
            water: "मैं आपको जल आपूर्ति सेवाओं पर ले जा सकता हूँ।",
            waste: "मैं आपको अपशिष्ट प्रबंधन सेवाओं पर ले जा सकता हूँ।",
            documents: "ज्यादातर सेवाओं के लिए आपको अपना आधार कार्ड, पैन कार्ड और पंजीकृत मोबाइल नंबर चाहिए होगा।",
            help: "मानवीय सहायता के लिए, कृपया हमारे टोल-फ्री हेल्पलाइन 14455 पर कॉल करें।",
            fallback: "मैं अभी सीख रहा हूँ! कृपया 'बिजली', 'गैस', 'पानी' या 'छात्रवृत्ति' के बारे में पूछें।",
            listening: "सुन रहा हूँ... कृपया अब बोलें।",
            cleared: "अगले उपयोगकर्ता के लिए चैट साफ़ कर दी गई है।"
        }
    },

    init: function() {
        this.injectStyles();
        this.createWidget();
        this.setupVoiceRecognition();
        this.makeDraggable();
    },

    // 1. SPEECH-TO-TEXT (User Voice Input)
    setupVoiceRecognition: function() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log("Voice detected:", transcript);
                document.getElementById('chat-input').value = transcript;
                this.sendMessage(); 
            };
            
            this.recognition.onerror = (e) => { 
                console.error("Speech Recognition Error:", e.error);
                document.getElementById('mic-btn').style.color = '#1a1a1a'; 
                document.getElementById('mic-btn').classList.remove('pulsing-mic');
            };
            
            this.recognition.onend = () => {
                document.getElementById('mic-btn').style.color = '#1a1a1a';
                document.getElementById('mic-btn').classList.remove('pulsing-mic');
            };
        }
    },

    startListening: function() {
        if (!this.recognition) return alert("Microphone not supported in this browser.");
        const langMap = { 'en': 'en-IN', 'hi': 'hi-IN', 'as': 'hi-IN' }; // Assamese falls back to Indian accent engine
        this.recognition.lang = langMap[this.currentLang];
        
        const micBtn = document.getElementById('mic-btn');
        micBtn.style.color = '#e11d48'; 
        micBtn.classList.add('pulsing-mic');
        
        this.addMessage(this.responses[this.currentLang].listening, 'bot-msg');
        try {
            this.recognition.start();
        } catch(e) {
            console.warn("Speech recognition already running or failed to start:", e.message);
        }
    },

    // 2. TEXT-TO-SPEECH (Bot Voice Output)
    speakReply: function(text) {
        if (!this.isVoiceOutputEnabled) return;
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
        
        if (femaleVoice) {
            utter.voice = femaleVoice;
        }
        utter.pitch = 1.55; // Higher pitch sounds more feminine
        utter.rate = 0.82; // Slightly slower and clearer
        // ---------------------------
        utter.rate = 0.82; // Slightly slower for kiosk users
        const langMap = { 'en': 'en-IN', 'hi': 'hi-IN', 'as': 'hi-IN' }; 
        utter.lang = langMap[this.currentLang];
        
        window.speechSynthesis.speak(utter);
    },

    toggleVoiceOutput: function() {
        this.isVoiceOutputEnabled = !this.isVoiceOutputEnabled;
        const speakerBtn = document.getElementById('speaker-btn');
        speakerBtn.innerText = this.isVoiceOutputEnabled ? '🔊' : '🔇';
        if(!this.isVoiceOutputEnabled && window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    },

    // 3. UI INJECTION & STYLES
    injectStyles: function() {
        const style = document.createElement('style');
        style.innerHTML = `
            #sahayak-chat-wrapper { position: fixed; bottom: 180px; right: 30px; width: 350px; height: 500px; background: #fff; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); display: none; flex-direction: column; overflow: hidden; z-index: 10000; font-family: 'Poppins', sans-serif; border: 2px solid #344F1F; transition: opacity 0.3s; }
            #chat-header { background: #344F1F; color: white; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; cursor: move; user-select: none; }
            #chat-header-controls { display: flex; gap: 8px; align-items: center; }
            #chat-header select { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); padding: 4px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer; outline: none; }
            #chat-header select option { color: black; }
            .header-btn { background: none; border: none; color: white; font-size: 16px; cursor: pointer; padding: 2px; transition: transform 0.2s; }
            .header-btn:hover { transform: scale(1.1); }
            
            #chat-body { flex: 1; padding: 15px; overflow-y: auto; background: #f9f5f0; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
            .chat-msg { padding: 10px 14px; border-radius: 12px; font-size: 13.5px; max-width: 85%; line-height: 1.4; box-shadow: 0 1px 2px rgba(0,0,0,0.05); animation: fadeIn 0.3s ease; }
            .bot-msg { background: #fff; color: #1a2910; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #e0e0e0; }
            .user-msg { background: #344F1F; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
            
            .action-btn { background: #F4991A; color: white; border: none; padding: 8px 12px; border-radius: 6px; margin-top: 8px; cursor: pointer; font-size: 12px; font-weight: bold; display: block; text-align: center; text-decoration: none; transition: background 0.2s; }
            .action-btn:hover { background: #e08910; }
            
            #chat-footer { padding: 10px 12px; background: white; border-top: 1px solid #eee; display: flex; gap: 8px; align-items: center; }
            #chat-input { flex: 1; padding: 12px; border: 1px solid #ccc; border-radius: 8px; outline: none; font-family: inherit; font-size: 13px; background: #f9f9f9; transition: border 0.3s; }
            #chat-input:focus { border-color: #344F1F; background: #fff; }
            
            #mic-btn { background: #f0f0f0; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 18px; cursor: pointer; color: #1a1a1a; transition: all 0.3s; display: flex; align-items: center; justify-content: center; }
            #mic-btn:hover { background: #e0e0e0; }
            .pulsing-mic { animation: pulseRed 1.5s infinite; background: #ffebee !important; }
            
            #chat-send { background: #344F1F; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: transform 0.2s; }
            #chat-send:hover { transform: scale(1.05); }
            
            #chat-fab { position: fixed; bottom: 100px; right: 30px; width: 65px; height: 65px; border-radius: 50%; background: linear-gradient(135deg, #344F1F, #4a6f35); color: white; border: none; box-shadow: 0 4px 15px rgba(52, 79, 31, 0.4); font-size: 28px; cursor: pointer; z-index: 10000; transition: transform 0.2s, box-shadow 0.2s; display: flex; justify-content: center; align-items: center; }
            #chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(52, 79, 31, 0.6); }

            /* Animations */
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulseRed { 0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); } 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); } }
            
            /* Typing Indicator */
            .typing-indicator { display: flex; gap: 4px; padding: 12px 16px; align-items: center; width: fit-content; }
            .typing-dot { width: 6px; height: 6px; background: #a0a0a0; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
            .typing-dot:nth-child(1) { animation-delay: -0.32s; }
            .typing-dot:nth-child(2) { animation-delay: -0.16s; }
            @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        `;
        document.head.appendChild(style);
    },

    createWidget: function() {
        const fab = document.createElement('button');
        fab.id = 'chat-fab';
        fab.innerHTML = '🤖';
        fab.onclick = () => this.toggleChat();
        document.body.appendChild(fab);

        const wrapper = document.createElement('div');
        wrapper.id = 'sahayak-chat-wrapper';
        wrapper.innerHTML = `
            <div id="chat-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span>🤖 Sahayak AI</span>
                </div>
                <div id="chat-header-controls">
                    <button id="speaker-btn" class="header-btn" onclick="SahayakChat.toggleVoiceOutput()" title="Toggle Voice">🔊</button>
                    <select id="chat-lang" onchange="SahayakChat.changeLanguage(this.value)">
                        <option value="en">EN</option>
                        <option value="as">অসমীয়া</option>
                        <option value="hi">हिंदी</option>
                    </select>
                    <button class="header-btn" onclick="SahayakChat.clearChat()" title="Clear Chat">🗑️</button>
                    <button class="header-btn" onclick="SahayakChat.toggleChat()" title="Close">✖</button>
                </div>
            </div>
            <div id="chat-body"></div>
            <div id="chat-footer">
                <button id="mic-btn" onclick="SahayakChat.startListening()" title="Click to Speak">🎤</button>
                <input type="text" id="chat-input" placeholder="Type or speak..." autocomplete="off" onkeypress="if(event.key === 'Enter') SahayakChat.sendMessage()">
                <button id="chat-send" onclick="SahayakChat.sendMessage()">➤</button>
            </div>
        `;
        document.body.appendChild(wrapper);
        this.addMessage(this.responses[this.currentLang].welcome, 'bot-msg');
        this.speakReply(this.responses[this.currentLang].welcome);
    },

    // 4. DRAGGABLE WINDOW LOGIC
    makeDraggable: function() {
        const wrapper = document.getElementById('sahayak-chat-wrapper');
        const header = document.getElementById('chat-header');
        let isDragging = false, startX, startY, initialLeft, initialTop;

        header.onmousedown = (e) => {
            // Don't drag if clicking buttons or dropdown
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            
            // Convert fixed bottom/right to absolute top/left for dragging
            const rect = wrapper.getBoundingClientRect();
            wrapper.style.bottom = 'auto';
            wrapper.style.right = 'auto';
            wrapper.style.left = rect.left + 'px';
            wrapper.style.top = rect.top + 'px';
            
            initialLeft = wrapper.offsetLeft;
            initialTop = wrapper.offsetTop;
            
            document.onmousemove = (moveEvent) => {
                if (!isDragging) return;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                wrapper.style.left = (initialLeft + dx) + 'px';
                wrapper.style.top = (initialTop + dy) + 'px';
            };
            document.onmouseup = () => { isDragging = false; document.onmousemove = null; document.onmouseup = null; };
        };
    },

    toggleChat: function() {
        this.isOpen = !this.isOpen;
        const wrapper = document.getElementById('sahayak-chat-wrapper');
        wrapper.style.display = this.isOpen ? 'flex' : 'none';
        if(this.isOpen) document.getElementById('chat-input').focus();
    },

    clearChat: function() {
        document.getElementById('chat-body').innerHTML = '';
        this.addMessage(this.responses[this.currentLang].cleared, 'bot-msg');
        setTimeout(() => {
            document.getElementById('chat-body').innerHTML = '';
            this.addMessage(this.responses[this.currentLang].welcome, 'bot-msg');
            this.speakReply(this.responses[this.currentLang].welcome);
        }, 1000);
    },

    changeLanguage: function(lang) {
        this.currentLang = lang;
        document.getElementById('chat-body').innerHTML = ''; 
        this.addMessage(this.responses[this.currentLang].welcome, 'bot-msg');
        this.speakReply(this.responses[this.currentLang].welcome);
    },

    addMessage: function(text, type, actionLink = null, actionText = null) {
        const body = document.getElementById('chat-body');
        const msg = document.createElement('div');
        msg.className = `chat-msg ${type}`;
        msg.innerText = text;

        if (actionLink && actionText) {
            const btn = document.createElement('a');
            btn.href = actionLink;
            btn.className = 'action-btn';
            btn.innerText = actionText;
            msg.appendChild(btn);
        }

        body.appendChild(msg);
        body.scrollTop = body.scrollHeight; 
    },

    showTypingIndicator: function() {
        const body = document.getElementById('chat-body');
        const typing = document.createElement('div');
        typing.id = 'typing-indicator';
        typing.className = 'chat-msg bot-msg typing-indicator';
        typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        body.appendChild(typing);
        body.scrollTop = body.scrollHeight;
    },

    removeTypingIndicator: function() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    },

    // 5. CORE LOGIC & API FETCHING
    sendMessage: async function() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim().toLowerCase();
        if (!text) return;

        this.addMessage(input.value, 'user-msg');
        input.value = '';

        // Show bouncy typing animation
        this.showTypingIndicator();

        setTimeout(async () => {
            this.removeTypingIndicator();

            if (text.includes('bill') || text.includes('electricity') || text.includes('বিজুলী') || text.includes('बिजली')) {
                try {
                    const token = sessionStorage.getItem('authToken'); 
                    if (token) {
                        const response = await fetch('/api/electricity/bills', {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await response.json();

                        if (data.success && data.data && data.data.length > 0) {
                            const pendingAmount = data.data[0].amount;
                            const replyText = `I found your APDCL bill. You have a pending amount of ₹${pendingAmount}.`;
                            this.addMessage(replyText, 'bot-msg');
                            this.speakReply(replyText);
                            setTimeout(() => window.location.href = '/electricity-services.html', 2000);
                            return; 
                        }
                    }
                    this.addMessage(this.responses[this.currentLang].electricity, 'bot-msg');
                    this.speakReply(this.responses[this.currentLang].electricity);
                    setTimeout(() => window.location.href = '/electricity-services.html', 2000);
                } catch (error) {
                    console.error("Chatbot API Error:", error);
                    this.addMessage(this.responses[this.currentLang].electricity, 'bot-msg');
                    this.speakReply(this.responses[this.currentLang].electricity);
                    setTimeout(() => window.location.href = '/electricity-services.html', 2000);
                }
            } else if (text.includes('gas') || text.includes('lpg') || text.includes('গেছ') || text.includes('गैस')) {
                this.addMessage(this.responses[this.currentLang].gas, 'bot-msg');
                this.speakReply(this.responses[this.currentLang].gas);
                setTimeout(() => window.location.href = '/gas-services.html', 1500);
            } else if (text.includes('municipal') || text.includes('corporation') || text.includes('পৌৰ') || text.includes('नगर')) {
                this.addMessage("Navigating to Municipal Corporation services...", 'bot-msg');
                this.speakReply("Navigating to Municipal Corporation services");
                setTimeout(() => window.location.href = '/municipal-services.html', 1500);
            } else if (text.includes('scholarship') || text.includes('student') || text.includes('বিদ্যালয়') || text.includes('छात्र')) {
                this.addMessage(this.responses[this.currentLang].scholarship, 'bot-msg');
                this.speakReply(this.responses[this.currentLang].scholarship);
                setTimeout(() => window.location.href = '/scholarship-portal.html', 1500);
            } else if (text.includes('water') || text.includes('pani') || text.includes('পানী') || text.includes('पानी')) {
                this.addMessage(this.responses[this.currentLang].water, 'bot-msg');
                this.speakReply(this.responses[this.currentLang].water);
                setTimeout(() => window.location.href = '/water-supply.html', 1500);
            } else if (text.includes('waste') || text.includes('garbage') || text.includes('আৱৰ্জনা') || text.includes('अपशिष्ट') || text.includes('कचरा')) {
                this.addMessage(this.responses[this.currentLang].waste, 'bot-msg');
                this.speakReply(this.responses[this.currentLang].waste);
                setTimeout(() => window.location.href = '/waste-management.html', 1500);
            } else if (text.includes('document') || text.includes('aadhaar') || text.includes('pan') || text.includes('দস্তাবেজ') || text.includes('दस्तावेज़')) {
                this.addMessage(this.responses[this.currentLang].documents, 'bot-msg');
                this.speakReply(this.responses[this.currentLang].documents);
            } else if (text.includes('help') || text.includes('contact') || text.includes('human') || text.includes('সহায়') || text.includes('मदद')) {
                this.addMessage(this.responses[this.currentLang].help, 'bot-msg');
                this.speakReply(this.responses[this.currentLang].help);
            } else if (text.includes('complaint') || text.includes('problem') || text.includes('অভিযোগ') || text.includes('शिकायत')) {
                this.addMessage(this.responses[this.currentLang].grievance, 'bot-msg');
                this.speakReply(this.responses[this.currentLang].grievance);
                setTimeout(() => window.location.href = '/grievance-portal.html', 1500);
            } else {
                this.addMessage(this.responses[this.currentLang].fallback, 'bot-msg');
                this.speakReply(this.responses[this.currentLang].fallback);
            }
        }, 1500); // 1.5 seconds delay for realistic "typing" feel
    }
};

window.addEventListener('load', () => { SahayakChat.init(); });