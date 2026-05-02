// ==========================================================================
// SCRIPT PARTAGÉ - Growth-Ia
// Inclus sur toutes les pages
// ==========================================================================

// ⚠️ IMPORTANT : Remplace cette URL par celle de ton serveur déployé
// (Cloudflare Workers, Vercel, ou Netlify Functions)
// Tant que tu n'as pas déployé le serveur, le chatbot affichera un message d'erreur.
const CHATBOT_API_URL = 'https://mute-pine-ecc8.calm-wind-95d0.workers.dev';

// ==========================================================================
// BARRE DE PROGRESSION DE SCROLL + NAV STICKY
// ==========================================================================
const scrollProgress = document.getElementById('scrollProgress');
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = (scrollTop / docHeight) * 100;
  if (scrollProgress) scrollProgress.style.width = percent + '%';
  if (nav) {
    if (scrollTop > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
});

// ==========================================================================
// MENU MOBILE
// ==========================================================================
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
  });
}
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (navLinks) navLinks.classList.remove('mobile-open');
  });
});

// ==========================================================================
// REVEAL AU SCROLL
// ==========================================================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.08}s`;
  observer.observe(el);
});

// ==========================================================================
// CHATBOT — Le coeur interactif du site
// ==========================================================================
const chatTrigger = document.getElementById('chatTrigger');
const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatTyping = document.getElementById('chatTyping');
const chatBadge = document.getElementById('chatBadge');
const chatSuggestions = document.getElementById('chatSuggestions');

// Historique de la conversation pour le contexte
let chatHistory = [];

// Suggestions initiales (boutons rapides)
const initialSuggestions = [
  "C'est quoi un audit IA ?",
  "Combien ça coûte ?",
  "Comment ça marche ?",
  "Qui peut en bénéficier ?"
];

function openChat() {
  chatWindow.classList.add('open');
  chatTrigger.classList.add('open');
  if (chatBadge) chatBadge.style.display = 'none';
  
  // Premier message du bot si conversation vide
  if (chatMessages.children.length === 0) {
    setTimeout(() => {
      addBotMessage("Bonjour ! 👋 Je suis l'assistant Growth-Ia. Je peux répondre à vos questions sur la visibilité IA, nos offres, ou vous aider à choisir le bon pack pour votre activité. Posez-moi votre question !");
      showSuggestions(initialSuggestions);
    }, 300);
  }
}

function closeChat() {
  chatWindow.classList.remove('open');
  chatTrigger.classList.remove('open');
}

if (chatTrigger) {
  chatTrigger.addEventListener('click', () => {
    if (chatWindow.classList.contains('open')) closeChat();
    else openChat();
  });
}

function addUserMessage(text) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg user';
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  hideSuggestions();
}

function addBotMessage(text) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg bot';
  // Support markdown simple : **gras** et liens
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: var(--accent); text-decoration: underline;">$1</a>')
    .replace(/\n/g, '<br>');
  msg.innerHTML = html;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addErrorMessage(text) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg error';
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  if (chatTyping) {
    chatTyping.classList.add('show');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function hideTyping() {
  if (chatTyping) chatTyping.classList.remove('show');
}

function showSuggestions(suggestions) {
  if (!chatSuggestions) return;
  chatSuggestions.innerHTML = '';
  suggestions.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'chat-suggestion';
    btn.textContent = s;
    btn.addEventListener('click', () => sendMessage(s));
    chatSuggestions.appendChild(btn);
  });
  chatSuggestions.style.display = 'flex';
}

function hideSuggestions() {
  if (chatSuggestions) chatSuggestions.style.display = 'none';
}

async function sendMessage(text) {
  if (!text || text.trim().length === 0) return;
  text = text.trim();
  
  addUserMessage(text);
  chatInput.value = '';
  chatSend.disabled = true;
  showTyping();
  
  // Ajout au contexte
  chatHistory.push({ role: 'user', content: text });
  
  try {
    const response = await fetch(CHATBOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });
    
    if (!response.ok) {
      throw new Error('Erreur de connexion au serveur');
    }
    
    const data = await response.json();
    hideTyping();
    
    if (data.reply) {
      addBotMessage(data.reply);
      chatHistory.push({ role: 'assistant', content: data.reply });
      
      // Suggestions de relance après chaque réponse
      const followups = [
        "Demander un audit gratuit",
        "Voir les tarifs",
        "Plus de détails"
      ];
      showSuggestions(followups);
    } else {
      addErrorMessage("Réponse invalide. Réessayez.");
    }
  } catch (err) {
    hideTyping();
    addErrorMessage("Le chatbot n'est pas encore configuré. En attendant, contactez-nous directement à contact@growth-ia.com");
    console.error('Chatbot error:', err);
  }
  
  chatSend.disabled = false;
  chatInput.focus();
}

if (chatSend) {
  chatSend.addEventListener('click', () => sendMessage(chatInput.value));
}
if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });
}

// Gestion du bouton "Demander un audit gratuit" qui redirige vers contact
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('chat-suggestion')) {
    const text = e.target.textContent;
    if (text.toLowerCase().includes('audit gratuit')) {
      setTimeout(() => {
        window.location.href = 'contact.html';
      }, 200);
    } else if (text.toLowerCase().includes('tarifs')) {
      setTimeout(() => {
        window.location.href = 'tarifs.html';
      }, 200);
    }
  }
});
