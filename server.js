const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};
const userStatus = {};

// Serve static files (client-side code)
app.use(express.static(path.join(__dirname, 'public')));

// Handle connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle login and store user details
    socket.on('login', ({ username, profilePic }) => {
        users[socket.id] = { username, profilePic, status: 'online' };
        userStatus[socket.id] = 'online';
        io.emit('userList', users); // Send updated user list to all clients
        io.emit('userStatus', users); // Broadcast user status (online) to all clients
    });

    // Handle message sending with timestamp
    socket.on('sendMessage', ({ recipient, message, emoji }) => {
        const timestamp = new Date().toLocaleTimeString(); // Add a timestamp
        if (users[recipient]) {
            io.to(recipient).emit('receiveMessage', { 
                message, 
                from: users[socket.id].username, 
                emoji, 
                timestamp // Include timestamp in the message
            });
        }
    });

    // Handle typing indicator
    socket.on('typing', ({ to, username }) => {
        if (users[to]) {
            io.to(to).emit('displayTyping', { username });
        }
    });

    // Handle stop typing event
    socket.on('stopTyping', ({ to }) => {
        if (users[to]) {
            io.to(to).emit('hideTyping');
        }
    });

    // Handle clear chat request (front-end to handle removing UI elements)
    socket.on('clearChat', ({ recipient }) => {
        if (users[recipient]) {
            io.to(recipient).emit('clearChatWindow'); // Emit clear chat event to recipient
        }
    });

    // Handle message deletion (allow only the sender to delete their message)
    socket.on('deleteMessage', ({ messageId, recipient }) => {
        if (users[recipient]) {
            io.to(recipient).emit('deleteMessage', { messageId });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (users[socket.id]) {
            users[socket.id].status = 'offline';
            io.emit('userList', users); // Send updated user list to all clients
            io.emit('userStatus', users); // Broadcast user status (offline) to all clients
        }
        delete users[socket.id];
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
