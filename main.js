// Initialize scripts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true });
    }

    // Preloader handler
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                document.body.classList.remove('loading');
            }, 500);
        }
    });

    // Chatbot Initialization
    initChatbot();

    // Success Metrics Counters
    initCounters();
});

function initCounters() {
    const counters = document.querySelectorAll('.count');
    const speed = 200;

    const startCounter = (counter) => {
        const target = +counter.innerText;
        const count = 0;
        const updateCount = () => {
            const current = +counter.innerText;
            const inc = target / speed;

            if (current < target) {
                counter.innerText = Math.ceil(current + inc);
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target;
            }
        };
        updateCount();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 1 });

    counters.forEach(counter => observer.observe(counter));
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            const offset = 80; // navbar height
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = targetElement.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Close bootstrap mobile menu if open
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                const bCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bCollapse) bCollapse.hide();
            }
        }
    });
});

function initChatbot() {
    const toggle = document.querySelector("#chatbot-toggle");
    const container = document.querySelector("#chatbot-container");
    const closeBtn = document.getElementById("chatbot-close");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const messages = document.getElementById("chatbot-messages");

    // Mode buttons
    const billsoftBtn = document.getElementById("mode-billsoft-data");
    const openaiBtn = document.getElementById("mode-openai");

    if (!toggle || !container) return;

    // Current mode: "billsoft" or "openai"
    let currentMode = "billsoft";

    toggle.addEventListener("click", () => container.classList.toggle("active"));
    closeBtn.addEventListener("click", () => container.classList.remove("active"));

    billsoftBtn.addEventListener("click", () => {
        currentMode = "billsoft";
        billsoftBtn.classList.add("active");
        openaiBtn.classList.remove("active");
        appendMessage("🧾 BillSoft Mode activated. I will answer based on BillSoft GST billing software information.", "bot");
    });

    openaiBtn.addEventListener("click", () => {
        currentMode = "openai";
        openaiBtn.classList.add("active");
        billsoftBtn.classList.remove("active");
        appendMessage("🤖 General AI Mode activated. I will answer anything you ask.", "bot");
    });

    function appendMessage(text, type) {
        const msg = document.createElement("div");
        msg.classList.add("msg", type);

        // Format text with basic markdown (bold)
        const formattedText = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        msg.innerHTML = formattedText;

        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        appendMessage(text, "user");
        input.value = "";

        const typing = document.createElement("div");
        typing.classList.add("msg", "bot", "typing");
        typing.innerHTML = `<span></span><span></span><span></span>`;
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;

        try {
            console.log("DEBUG (frontend): Sending", { message: text, mode: currentMode });

            const res = await fetch("inc/chatbot-api.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, mode: currentMode }),
                credentials: "include"
            });

            if (!res.ok) {
                throw new Error("HTTP error: " + res.status);
            }

            const data = await res.json();
            typing.remove();
            appendMessage(data.reply, "bot");

        } catch (e) {
            typing.remove();
            console.error("DEBUG (frontend) Error:", e);
            appendMessage("⚠️ Server error or OpenAI failed. Please try again or switch to BillSoft mode.", "bot");
        }
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // Initial greeting (will appear once user opens the chat)
    appendMessage("👋 Welcome! I'm your BillSoft assistant. Choose BillSoft mode for GST billing software info or General AI mode for other questions. How can I help you today?", "bot");
}
