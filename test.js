
const mysql = require("mysql2");

// Create a connection object with the connection details
const connection = mysql.createConnection({
  host: "online-collaborative-text-editor-online-collaborative-text-edit.e.aivencloud.com",
  user: "avnadmin",
  password: "AVNS_Bu5lDfkduJXLsrEjthj",
  database: "defaultdb",
  port: 23612,
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("An error occurred while connecting to the DB");
    throw err;
  }
  console.log("Connected!");
});
class Node {
    constructor(letter, position = -1, bold = false, italic = false, tombstone = false) {
        this.letter = letter;
        this.position = position;
        this.bold = bold;
        this.italic = italic;
        this.tombstone = tombstone;
    }
}

class CRDT {
    constructor() {
        // this.nodes = [new Node(Number.MIN_VALUE, ''), new Node(Number.MAX_VALUE, '')];
        this.nodes = [new Node('', 0), new Node('', 10)];
    }

    // When the server receives an insert event from a client, it inserts the node into the CRDT instance
    // When a client receives an insert event from the server, it inserts the node into the CRDT instance, it then calculates the display index from the position and displays the node at that index
    insertPosition(node) {
        let arrayIndex = this.positionToArrayIndex(node.position);
        this.nodes.splice(arrayIndex, 0, node);
    }

    // When the server receives a delete event from a client, it deletes the node from the CRDT instance
    // When a client receives a delete event from the server, it deletes the node from the CRDT instance, it then searches for the display index of the node and deletes the node at that index
    deletePosition(node) {
        let arrayIndex = this.positionToArrayIndex(node.position);
        this.nodes[arrayIndex].tombstone = true;
    }

    // When the client inserts a node, it calculates the position from the display index and inserts the node into the CRDT instance
    insertDisplayIndex(node, displayIndex) {
        let position = this.calculate_DisplayIndexToPosition(displayIndex);
        node.position = position;

        this.insertPosition(node);
    }

    // When the client deletes a node, it searches for the display index of the node and deletes the node at that index
    deleteDisplayIndex(displayIndex) {
        let position = this.get_DisplayIndexToPosition(displayIndex);
        let arrayIndex = this.positionToArrayIndex(position);

        this.nodes[arrayIndex].tombstone = true;
    }

    cleanUp() {
        this.nodes = this.nodes.filter(node => !node.tombstone);
    }

    ////////////////////////////////////////////////////// Helper Functions /////////////////////////////////////////////////////////////////////

    positionToArrayIndex(position) {
        return this.nodes.findIndex(node => node.position === position);
    }

    // Convert between displayIndex and position
    // Iterate over the array and skip over the tombstones = true nodes, when you reach the display index, find the average between the current and next position
    calculate_DisplayIndexToPosition(displayIndex) {
        let count = 0;
        for (let node of this.nodes) {
            if (!node.tombstone) {
                if (count === displayIndex) {
                    return (node.position + this.nodes[this.nodes.indexOf(node) + 1].position) / 2;
                }
                count++;
            }
        }
        return -1; // Invalid displayIndex
    }

    get_DisplayIndexToPosition(displayIndex) {
        let count = 0;
        for (let node of this.nodes) {
            if (!node.tombstone) {
                if (count === displayIndex) {
                    return node.position;
                }
                count++;
            }
        }
        return -1; // Invalid displayIndex
    }
     //update the node to be bold 
     updateBold(node) {
        let arrayIndex = this.positionToArrayIndex(node.position);
        this.nodes[arrayIndex].bold = !(this.nodes[arrayIndex].bold);
    }
    //update the node to be italic 
    updateItalic(node) {
        let arrayIndex = this.positionToArrayIndex(node.position);
        this.nodes[arrayIndex].italic = !(this.nodes[arrayIndex].italic);
    }

    save(docId) {
        const query = "UPDATE documents SET data = ? WHERE id = ?";
        const data = JSON.stringify(this.nodes);
        console.log("data before save", data)
        const dataBuffer = Buffer.from(data);
        connection.query(query, [dataBuffer, docId], (error, results, fields) => {
          if (error) throw error;
          console.log(dataBuffer);
          console.log(docId);
          console.log("Saved CRDT to database.");
        });
      }

}
function convertFromJsonToCrdtArray(json) {
    let nodes = JSON.parse(json);
    let crdt = new CRDT();
    crdt.nodes.pop();
    crdt.nodes.pop();
    for (let node of nodes) {
        crdt.nodes.push(new Node(node.letter, node.position, node.bold, node.italic, node.tombstone));
    }
    return crdt;
}


function testCRDT() {
    // Create a new CRDT instance
    let crdt_server = new CRDT();
    let crdt_client = new CRDT();

    // The client wrote a letter 'a' at display index 0
    // He stored it in his own CRDT instance
    let node = new Node('a');
    crdt_client.insertDisplayIndex(node, 0);
    console.assert(crdt_client.nodes[1].letter === 'a', 'Client insertDisplayIndex failed');

    // He sent the node to the server
    // The server stored the node in its own CRDT instance
    crdt_server.insertPosition(node);
    console.assert(crdt_server.nodes[1].letter === 'a', 'Server insertPosition failed');

    // The server broadcasted the node to all other clients
    // The other clients stored the node in their own CRDT instances
    // The other clients displayed the node at the display index calculated from the position
    let displayIndex = crdt_client.positionToArrayIndex(node.position);
    crdt_client.insertDisplayIndex(node, displayIndex);
    console.assert(crdt_client.nodes[1].letter === 'a', 'Client insertDisplayIndex failed');

    // A client deleted the node
    crdt_client.deleteDisplayIndex(displayIndex);
    console.assert(crdt_client.nodes[1].tombstone === true, 'Client deleteDisplayIndex failed');

    // The client sent the delete event to the server
    // The server stored the delete event in its own CRDT instance
    crdt_server.deletePosition(node);
    console.assert(crdt_server.nodes[1].tombstone === true, 'Server deletePosition failed');

    // The server broadcasted the delete event to all other clients
    // The other clients stored the delete event in their own CRDT instances
    // The other clients deleted the node from their own CRDT instances
    // The other clients displayed the delete event at the display index calculated from the position
    crdt_client.deletePosition(node);
    console.assert(crdt_client.nodes[1].tombstone === true, 'Client deletePosition failed');

    // Cleanup the CRDT
    crdt_server.cleanUp();
    console.assert(crdt_server.nodes.length === 2, 'Server cleanUp failed');
}








const express = require("express");
const http = require("http");

const Server = require("socket.io").Server;



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
    let crdt;
    if (socket.handshake.query.username && socket.handshake.query.docId) {
        username = socket.handshake.query.username;
        docId = socket.handshake.query.docId;

        console.log(`The provided username: ${username}`)
        console.log(`The provided document ID: ${docId}`)
      crdt=documentCRDTs.get(docId)
      console.log("documentCRDTs.get(docId)", documentCRDTs.get(docId));
    if (!documentCRDTs.has(docId)) {
        //documentCRDTs.set(docId, new CRDT());
        let docData = await new Promise((resolve, reject) => {
          const query = "SELECT data FROM documents WHERE id = ?";
          connection.query(query, [docId], (error, results, fields) => {
            if (error) {
              reject(error);
            }
            resolve(results[0]);
          });
        });
        console.log("docData", docData);

        if (docData && docData.data.length > 0) {
          documentCRDTs.set(docId, convertFromJsonToCrdtArray(docData.data.toString()));
          const data= convertFromJsonToCrdtArray(docData.data.toString())
         console.log("server is sending data", data);
         crdt=documentCRDTs.get(docId)
         console.log("server is sending crdt", crdt);
         socket.emit("crdt", crdt);
        } else {
          documentCRDTs.set(docId, new CRDT());
        }
        //console.log("documentCRDTs", documentCRDTs);
        // After conncting to the db, handling this condition should be retrieving the CRDT from the database.
        
      }
  } else {
    console.log("Username or document ID is not provided");
    socket.disconnect(true);
  }

    // Join the document room
    socket.join(docId);
    console.log(`User ${username} joined the document room ${docId}`);

    // If there's no CRDT for this document yet, create one.
    if (!documentCRDTs.has(docId)) {
        documentCRDTs.set(docId, new CRDT());
        //console.log("documentCRDTs", documentCRDTs);
        // After conncting to the db, handling this condition should be retrieving the CRDT from the database.
    }

    // Get the CRDT for this document.
     crdt = documentCRDTs.get(docId);
    // console.log("crdt", crdt);

    // Send the CRDT from the server to the client
    socket.emit('crdt', crdt);

    socket.on('insert', (node) => {

        console.log("Insert event received");
        crdt.insertPosition(node);
        documentCRDTs.set(docId, crdt);
        socket.to(docId).emit('insert', node); // broadcast the insert event to all other clients in the room
       console.log("server crdt after insert", crdt);

    });

    socket.on('delete', (node) => {
        console.log("Delete event received", node);
        crdt.deletePosition(node);
        documentCRDTs.set(docId, crdt);
        socket.to(docId).emit('delete', node); // broadcast the delete event to all other clients in the room 
        //console.log("crdt server after delete", crdt);
    });
    // Listen for insert and delete events

    socket.on("save", (docId) => {
        crdt.save(docId);
      });
    
    //listen for bold event
    socket.on('bold', (node) => {
        //console.log("node", node);

        const arrayIndex = crdt.positionToArrayIndex(node.position);
        //console.log("crdt server after bold");
        crdt.updateBold(crdt.nodes[arrayIndex]);
        documentCRDTs.set(docId, crdt);
       // console.log(crdt);
        const boldNode = crdt.nodes[arrayIndex];
        socket.to(docId).emit('bold', boldNode); // broadcast the bold event to all other clients in the room 
        //console.log("after emit ")
        //console.log(boldNode);
    });

    //listen for italic event
    socket.on('italic', (node) => {
        //console.log("node", node);

        const arrayIndex = crdt.positionToArrayIndex(node.position);
        //console.log("crdt server after italic");
        crdt.updateItalic(crdt.nodes[arrayIndex]);
        documentCRDTs.set(docId, crdt);
        const italicNode = crdt.nodes[arrayIndex];
        //console.log(crdt);
        socket.to(docId).emit('italic', italicNode); // broadcast the italic event to all other clients in the room
       
    });

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        //if (io.sockets.adapter?.rooms?.get(docId)?.size === 0) {
            // Save the CRDT to the database
            crdt.cleanUp();
            crdt.save(docId);
            documentCRDTs.set(docId, null);
            crdt = null;
            // Cleanup the CRDT
            // Remove the CRDT from the map
            documentCRDTs.delete(docId);
            console.log("before disconnect crdt ");
            console.log("after disconnect crdt ", crdt);

         // }

        // Check if this is the last user in the room, if so call cleanup function from CRDT


    });
});
//TODO: CANNOT READ UDEFINED READING TOMBSTONE  WHEN I DELETE ALL THE TEXT
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
