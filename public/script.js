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

// Store user profile pictures and status
const userProfilePics = {};
const userStatus = {};

// Function to get a random profile picture
function getRandomProfilePic() {
    const randomIndex = Math.floor(Math.random() * profilePics.length);
    return profilePics[randomIndex];
}

window.addEventListener('DOMContentLoaded', (event) => {
    // Login
    const username = prompt("Enter your username:");
    const profilePic = getRandomProfilePic(); // Assign a random profile picture
    userProfilePics[socket.id] = profilePic; // Store your own profile pic
    socket.emit('login', { username, profilePic });

    // Receive updated user list
    socket.on('userList', (users) => {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        Object.keys(users).forEach(id => {
            if (id !== socket.id) {
                const userStatusIcon = users[id].status === 'online' ? '🟢' : '🔴';
                userProfilePics[id] = users[id].profilePic;
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex align-items-center';
                li.innerHTML = `
                    <img src="${users[id].profilePic}" class="user-pic mr-2" alt="${users[id].username}" />
                    ${users[id].username} ${userStatusIcon}
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

    // Typing indicator
    let typingTimeout;
    const messageInput = document.getElementById('messageInput');

    messageInput.addEventListener('input', () => {
        socket.emit('typing', { to: currentRecipient, username });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping', { to: currentRecipient });
        }, 1000);
    });

    socket.on('displayTyping', ({ username }) => {
        document.getElementById('chatWith').textContent = `${username} is typing...`;
    });

    socket.on('hideTyping', () => {
        const chatWith = document.getElementById('chatWith');
        if (currentRecipient) {
            chatWith.textContent = `Chatting with ${userProfilePics[currentRecipient].username}`;
        }
    });

    // Send message
    document.getElementById('sendButton').addEventListener('click', () => {
        const message = messageInput.value;
        const emoji = selectedEmoji || ''; // Get selected emoji (if any)
        if (message && currentRecipient) {
            socket.emit('sendMessage', { recipient: currentRecipient, message, emoji });
            appendMessage(message, 'sent', socket.id); // Pass your socket ID as sender
            messageInput.value = ''; // Clear message input
            selectedEmoji = ''; // Clear emoji selection
        } else {
            alert('Please select a user to chat with and write a message!');
        }
    });

    // Receive message
    socket.on('receiveMessage', ({ message, from, emoji }) => {
        appendMessage(message + emoji, 'received', from); // Use 'from' for correct sender profile picture
    });

    // Receive online status updates
    socket.on('userStatus', (users) => {
        Object.keys(users).forEach(id => {
            userStatus[id] = users[id].status;
        });
    });
});

// Helper function to append messages to the chat window
function appendMessage(message, type, sender) {
    const messagesDiv = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message-item ${type} d-flex align-items-start`;

    // Get the correct profile picture based on the sender (either for you or the recipient)
    const profilePic = userProfilePics[sender] || getRandomProfilePic();

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
