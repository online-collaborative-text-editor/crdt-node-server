const express = require("express");
const http = require("http");

const Server = require("socket.io").Server;
const CRDT = require("./CRDT").CRDT;


// Application and servers initialization
const app = express();

const server = http.createServer(app);

const port = 5000;

server.listen(port, () => {
    console.log("Server is Up on port " + port);
});

const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: "*"
    },
});


// This map stores a CRDT instance for each document.
const documentCRDTs = new Map();

io.on("connection", async (socket) => {
    console.log(`A new user is connect with socked ID: ${socket.id}`);

    // Extract the username and document ID from the query parameter.
    let username, docId;
    if (socket.handshake.query.username && socket.handshake.query.docId) {
        username = socket.handshake.query.username;
        docId = socket.handshake.query.docId;
        console.log(`The provided username: ${username}`)
        console.log(`The provided document ID: ${docId}`)
    } else {
        console.log("Username or document ID is not provided");
        socket.disconnect(true);
    }

    // Join the document room
    socket.join(docId);

    // If there's no CRDT for this document yet, create one.
    if (!documentCRDTs.has(docId)) {
        documentCRDTs.set(docId, new CRDT());
        // After conncting to the db, handling this condition should be retrieving the CRDT from the database.
    }

    // Get the CRDT for this document.
    const crdt = documentCRDTs.get(docId);

    // Send the CRDT from the server to the client
    socket.emit('crdt', crdt);

    // Listen for insert and delete events
    socket.on('insert', (node) => {
        crdt.insertPosition(node);
        documentCRDTs.set(docId, crdt);
        socket.to(docId).emit('insert', node); // broadcast the insert event to all other clients in the room
    });

    socket.on('delete', (node) => {
        crdt.deletePosition(node);
        documentCRDTs.set(docId, crdt);
        socket.to(docId).emit('delete', node); // broadcast the delete event to all other clients in the room
    });

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);

        // Check if this is the last user in the room, if so call cleanup function from CRDT
        if (isLastUserInRoom(username)) {
            crdt.cleanup();
        }
    });
});

// export { app, io, server };

// io.on:
// This is used to set up a listener for a specific event on the Socket.IO server.
// The listener will be called whenever that event is emitted by any client.
// For example, io.on('connection', callback) sets up a listener for the 'connection' event,
// which is emitted whenever a client connects to the server.

// socket.on:
// This is used to set up a listener for a specific event on a specific socket.
// The listener will be called whenever that event is emitted by the client associated with that socket.
// For example, socket.on('disconnect', callback) sets up a listener for the 'disconnect' event,
// which is emitted when the client associated with the socket disconnects.

// io.emit:
// This is used to emit an event to all connected clients.

// socket.emit:
// This is used to emit an event to the client associated with that socket.

// io.to.emit:
// This is used to emit an event to all clients in a specific room.

// socket.to.emit:
// This is used to emit an event to all clients in a specific room, excluding the client associated with the socket.
