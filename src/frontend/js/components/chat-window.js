import { chatApi } from '../api.js';
import { formatCurrency } from '../utils/formatCurrency.js';

let currentImageBase64 = null;
let recognition = null;
let isOpen = false;

export function initChat() {
    const aiFab = document.getElementById('ai-fab');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const chatClose = document.getElementById('chat-close');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    const chatAttach = document.getElementById('chat-attach');
    const chatFileInput = document.getElementById('chat-file-input');
    const chatImagePreview = document.getElementById('chat-image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImg = document.getElementById('remove-img');
    const chatMic = document.getElementById('chat-mic');

    // FAB Toggle
    aiFab.addEventListener('click', () => {
        isOpen = !isOpen;
        chatWindow.classList.toggle('open', isOpen);
        if (isOpen) {
            setTimeout(() => chatInput.focus(), 100);
        }
    });

    chatClose.addEventListener('click', () => {
        isOpen = false;
        chatWindow.classList.remove('open');
    });

    // Update send button state
    const updateSendButton = () => {
        const hasText = chatInput.value.trim().length > 0;
        const hasImage = currentImageBase64 !== null;
        chatSend.disabled = !(hasText || hasImage);
    };

    chatInput.addEventListener('input', updateSendButton);

    // Attach button
    chatAttach.addEventListener('click', () => chatFileInput.click());

    chatFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentImageBase64 = e.target.result;
                previewImg.src = currentImageBase64;
                chatImagePreview.classList.add('visible');
                updateSendButton();
            };
            reader.readAsDataURL(file);
        }
    });

    removeImg.addEventListener('click', () => {
        currentImageBase64 = null;
        chatFileInput.value = '';
        chatImagePreview.classList.remove('visible');
        updateSendButton();
    });

    // Drag and drop
    chatWindow.addEventListener('dragover', (e) => {
        e.preventDefault();
        chatWindow.classList.add('dragover');
    });

    chatWindow.addEventListener('dragleave', () => {
        chatWindow.classList.remove('dragover');
    });

    chatWindow.addEventListener('drop', (e) => {
        e.preventDefault();
        chatWindow.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                currentImageBase64 = ev.target.result;
                previewImg.src = currentImageBase64;
                chatImagePreview.classList.add('visible');
                updateSendButton();
            };
            reader.readAsDataURL(file);
        }
    });

    // Keyboard paste (CTRL+V)
    document.addEventListener('paste', (e) => {
        if (!isOpen) return;

        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        currentImageBase64 = ev.target.result;
                        previewImg.src = currentImageBase64;
                        chatImagePreview.classList.add('visible');
                        updateSendButton();
                    };
                    reader.readAsDataURL(file);
                }
                break;
            }
        }
    });

    // Mic handling (voice input)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
            chatMic.classList.add('active');
            chatInput.placeholder = "Mendengarkan... (Klik tombol mic untuk berhenti)";
        };

        recognition.onend = () => {
            chatMic.classList.remove('active');
            chatInput.placeholder = "Tanya atau kirim gambar...";
            updateSendButton();
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                const currentText = chatInput.value;
                const separator = currentText && !currentText.endsWith(' ') ? ' ' : '';
                chatInput.value += separator + finalTranscript.trim();
                updateSendButton();
                chatInput.scrollTop = chatInput.scrollHeight;
            }
        };

        recognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                chatMic.classList.remove('active');
                chatInput.placeholder = "Tanya atau kirim gambar...";
            }
        };

        chatMic.addEventListener('click', () => {
            if (chatMic.classList.contains('active')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        chatMic.style.display = 'none';
    }

    // Send message
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !chatSend.disabled) {
            e.preventDefault();
            chatSend.click();
        }
    });

    chatSend.addEventListener('click', async () => {
        const userText = chatInput.value.trim();
        const imageToSend = currentImageBase64;

        if (!userText && !imageToSend) return;

        addMessage(userText, 'user', imageToSend);
        chatInput.value = '';

        currentImageBase64 = null;
        chatFileInput.value = '';
        chatImagePreview.classList.remove('visible');
        updateSendButton();

        chatSend.disabled = true;
        const typingId = addTypingIndicator();

        try {
            const result = await chatApi.send(userText, imageToSend);
            removeTypingIndicator(typingId);
            addMessage(result.response, 'bot');
        } catch (error) {
            removeTypingIndicator(typingId);
            const errorMessage = error.message || 'Terjadi kesalahan. Silakan coba lagi.';
            addMessage(errorMessage, 'bot');
        } finally {
            chatSend.disabled = false;
        }
    });
}

function addMessage(text, sender, imageSrc = null) {
    const chatMessages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${sender}`;

    let content = '';
    if (imageSrc) {
        content += `<img src="${imageSrc}" alt="Uploaded image">`;
    }
    if (text) {
        content += text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    }

    div.innerHTML = content;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot typing-indicator';
    div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
