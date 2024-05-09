import express from "express";
import http from "http";
import { Server } from "socket.io";

import jwt from "jsonwebtoken";

import { User } from "../db/models/User.js";

// Application and servers initialization
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
});

// Helper function
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// This object maps user IDs to socket IDs.
const userSocketMap = {}; 


io.on("connection", async (socket) => {
    
    console.log(`A new user is connect with socked ID: ${socket.id}`);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    // Get the user from the provided token to fill the userSocketMap.

    // Extract the token from the query parameter.
    let token;
     
    if (socket.handshake.query.token) {
        token = socket.handshake.query.token.split(" ")[1];
        console.log(`The provided token: ${token}`)
    } else {
        console.log("Token is not provided");
    }

    let user_token;

    try {
        user_token = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.log({
            err: { status: 401, message: `Invalid Token: ${err.message}` },
        });
    }

    // Get the user id from the token.
    const user_id = user_token._id;

    // Get the user from the id.
    const user = await User.findById(user_id);

    if (!user) {
        console.log({ err: { status: 404, message: "User not found" } });
    } else {
        userSocketMap[user_id] = socket.id;
    }

    // Send the CRDT from the server to the client
    socket.emit('crdt', crdt);

    // Listen for insert and delete events
    socket.on('insert', (node) => {
        crdt.insert(node);
        socket.to(room).emit('insert', node); // broadcast the insert event to all other clients in the room
    });

    socket.on('delete', (node) => {
        crdt.delete(node);
        socket.to(room).emit('delete', node); // broadcast the delete event to all other clients in the room
    });

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[user_id];

        // Check if this is the last user in the room, if so call cleanup function from CRDT
        if (isLastUserInRoom(user_id)) {
            crdt.cleanup();
        }
    });

    // socket.on() is used to listen to the events. can be used both on client and server side
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[user_id];
    });
});

// Set up event listeners:
// on connection send the CRDT from the server to the client
// on insert or delete call the corresponsing function in the CRDT class
// on disconnect delete the user from the userSocketMap & check if this is the last user in the room, if so you should call clean up function from crdt

export { app, io, server };

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
