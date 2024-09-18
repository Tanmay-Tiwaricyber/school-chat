const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};

// Serve static files (client-side code)
app.use(express.static(path.join(__dirname, 'public')));

// Handle connection
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Handle login
    // Modify login handler to include profile picture
socket.on('login', ({ username, profilePic }) => {
    users[socket.id] = { username, profilePic };
    io.emit('userList', users); // Send updated user list to all clients
});
    

    // Handle message sending
    socket.on('sendMessage', ({ recipient, message, emoji }) => {
        if (users[recipient]) {
            io.to(recipient).emit('receiveMessage', { message, from: users[socket.id], emoji });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        delete users[socket.id];
        io.emit('userList', users); // Send updated user list to all clients
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
