const socket = io();

// List of profile pictures
const profilePics = [
    'images/man.png',
    'images/user.png',
    'images/profile.png',
    'images/ran.png',
    'images/women.png'
];

// Store current recipient for 1-to-1 chat
let currentRecipient = null;

// Store user profile pictures
const userProfilePics = {};

// Function to get a random profile picture
function getRandomProfilePic() {
    const randomIndex = Math.floor(Math.random() * profilePics.length);
    return profilePics[randomIndex];
}

window.addEventListener('DOMContentLoaded', (event) => {
    // Login
    const username = prompt("Enter your username:");
    const profilePic = getRandomProfilePic(); // Assign a random profile picture
    socket.emit('login', { username, profilePic });

    // Receive updated user list
    socket.on('userList', (users) => {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        Object.keys(users).forEach(id => {
            if (id !== socket.id) {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex align-items-center';
                li.innerHTML = `
                    <img src="${users[id].profilePic}" class="user-pic mr-2" alt="${users[id].username}" />
                    ${users[id].username}
                `;
                li.dataset.id = id;
                li.addEventListener('click', () => {
                    currentRecipient = li.dataset.id;
                    document.getElementById('chatWith').textContent = `Chatting with ${users[id].username}`;
                });
                userList.appendChild(li);
            }
        });
    });

    // Set up emoji picker event
    const emojiPicker = document.querySelector('emoji-picker');
    let selectedEmoji = '';

    emojiPicker.addEventListener('emoji-click', (event) => {
        selectedEmoji = event.detail.unicode;
        const messageInput = document.getElementById('messageInput');
        messageInput.value += selectedEmoji; // Append emoji to message input
    });

    // Send message
    document.getElementById('sendButton').addEventListener('click', () => {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value;
        const emoji = selectedEmoji || ''; // Get selected emoji (if any)
        if (message && currentRecipient) {
            socket.emit('sendMessage', { recipient: currentRecipient, message, emoji });
            appendMessage(message, 'sent');
            messageInput.value = ''; // Clear message input
            selectedEmoji = ''; // Clear emoji selection
        } else {
            alert('Please select a user to chat with and write a message!');
        }
    });

    // Receive message
    socket.on('receiveMessage', ({ message, from, emoji }) => {
        appendMessage(message, 'received', from);
    });
});

// Helper function to append messages to the chat window
function appendMessage(message, type, sender) {
    const messagesDiv = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message-item ${type} d-flex align-items-start`;
    const profilePic = userProfilePics[sender] || getRandomProfilePic(); // Default to random pic if not set

    if (type === 'received') {
        div.innerHTML = `
            <img src="${profilePic}" class="message-pic mr-2" alt="${sender}" />
            <div>
                <strong>${sender}:</strong> ${message}
            </div>
        `;
    } else {
        div.innerHTML = `
            <img src="${profilePic}" class="message-pic mr-2" alt="You" />
            <div>
                You: ${message}
            </div>
        `;
    }
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
}
