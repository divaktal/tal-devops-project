// Smooth scrolling for anchor links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent default anchor behavior
        const targetId = this.getAttribute('href').substring(1); // Get the target section ID
        const targetSection = document.getElementById(targetId); // Find the target section
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth', // Smooth scroll
                block: 'start' // Align to the top of the section
            });
        }
    });
});

// Toggle Chat Window
function toggleChat() {
    var chatWindow = document.getElementById("chatWindow");
    var chatButton = document.querySelector(".chat-toggle");
    chatWindow.classList.toggle("open");
    chatButton.style.display = chatWindow.classList.contains("open") ? "none" : "block";
    chatWindow.setAttribute("aria-hidden", !chatWindow.classList.contains("open"));
}

// Close Chat Window when clicking outside
document.addEventListener('click', function (e) {
    var chatWindow = document.getElementById("chatWindow");
    var chatButton = document.querySelector(".chat-toggle");
    if (!chatWindow.contains(e.target) && !chatButton.contains(e.target)) {
        chatWindow.classList.remove("open");
        chatButton.style.display = "block";
        chatWindow.setAttribute("aria-hidden", "true");
    }
});

// Send Message in Chat
function sendMessage(message) {
    var chatBody = document.getElementById("chatBody");
    var newMessage = document.createElement("div");
    newMessage.textContent = "You: " + message;
    chatBody.appendChild(newMessage);

    // Show typing animation for the bot
    var typingMessage = document.createElement("div");
    typingMessage.innerHTML = 'Lily_Bot: <span class="typing-animation"></span>';
    chatBody.appendChild(typingMessage);

    // Simulate a delay for the bot's response
    setTimeout(function() {
        // Remove typing animation
        typingMessage.innerHTML = 'Lily_Bot: Thank you for your message! How can I assist you further?';
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1500);
}

// Open Modal with Maximized Photo
function openModal(imageSrc, dressName) {
    var modal = document.getElementById("modal");
    var modalImage = document.getElementById("modalImage");
    var modalOverlay = document.getElementById("modalOverlay");
    modalImage.src = imageSrc;
    modalOverlay.textContent = dressName;
    modal.classList.add("open");
}

// Close Modal
function closeModal() {
    var modal = document.getElementById("modal");
    modal.classList.remove("open");
}

// Appointment Scheduling
document.getElementById("scheduleForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const appointmentsList = document.getElementById("appointmentsList");

    if (date && time) {
        const li = document.createElement("li");
        li.textContent = `📅 ${date} at ⏰ ${time}`;
        appointmentsList.appendChild(li);

        // Save to localStorage
        let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
        appointments.push({ date, time });
        localStorage.setItem("appointments", JSON.stringify(appointments));

        this.reset();
    }
});

// Load saved appointments on page load
window.addEventListener("DOMContentLoaded", () => {
    const appointments = JSON.parse(localStorage.getItem("appointments")) || [];
    const appointmentsList = document.getElementById("appointmentsList");

    appointments.forEach(app => {
        const li = document.createElement("li");
        li.textContent = `📅 ${app.date} at ⏰ ${app.time}`;
        appointmentsList.appendChild(li);
    });
});