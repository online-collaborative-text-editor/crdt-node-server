// // In the NODE class we define the following attributes:
// // position: the largest float number available in JavaScript; it represents the position of the node in the CRDT array.
// // flags indicating the formating of the letter stored in the node (bold & italic)
// // letter: the letter stored in the node
// // Tomstone: a boolean value indicating if the node has been deleted

// // The CDRDT class is a list of nodes. It has the following attributes
// // It is initialized with two nodes, the first and the last node of the list
// // The first is initialized with the smallest float number available in JavaScript 10e-37
// // The last is initialized with the largest float number available in JavaScript 10e37

// // The class has the following methods:
// // insert: inserts a new node in the list given its position
// // delete: deletes a node given its position
// class Node {
//     constructor(position, letter, bold = false, italic = false, tombstone = false) {
//         this.position = position;
//         this.letter = letter;
//         this.bold = bold;
//         this.italic = italic;
//         this.tombstone = tombstone;
//     }
// }

// class CRDT {
//     constructor() {
//         this.nodes = [new Node(Number.MIN_VALUE, ''), new Node(Number.MAX_VALUE, '')];
//     }

//     insert(node) {
//         // The splice() method changes the contents of an array by removing or replacing
//         // existing elements and/or adding new elements in place.
//         // Here, it's used to insert the new node at the correct position in the nodes array.
//         // The first argument to splice() is the index at which to start changing the array.
//         // The second argument is the number of elements in the array to remove from the start index.
//         // In this case, we're not removing any elements, so it's 0.
//         // The remaining arguments are the elements to add to the array, starting from the start index.
//         // Here, we're adding the new node to the array.
//         this.nodes.splice(this.findPosition(node.position), 0, node);
//     }

//     delete(node) {
//         let index = this.findPosition(node.position);
//         if (index !== -1) {
//             this.nodes[index].tombstone = true;
//         }
//     }

//     findPosition(position) {
//         for (let i = 0; i < this.nodes.length; i++) {
//             if (this.nodes[i].position > position) {
//                 return i;
//             }
//         }
//         return -1;
//     }

//     cleanup() {
//         // The filter() method creates a new array with all elements that pass the test implemented by the provided function.
//         // Here, it's used to create a new array that only includes nodes where tombstone is false.
//         this.nodes = this.nodes.filter(node => !node.tombstone);
//     }
// }


import { PriorityQueue } from 'priorityqueuejs';

class Node {
    constructor(position, letter, bold = false, italic = false, tombstone = false) {
        this.position = position;
        this.letter = letter;
        this.bold = bold;
        this.italic = italic;
        this.tombstone = tombstone;
        this.timestamp = Date.now();
    }
}

class CRDT {
    constructor() {
        this.nodes = new PriorityQueue();
        this.nodes.enqueue(new Node(Number.MIN_VALUE, ''));
        this.nodes.enqueue(new Node(Number.MAX_VALUE, ''));
    }

    insert(node) {
        this.nodes.enqueue(node);
    }

    delete(node) {
        let index = this.findPosition(node.position);
        if (index !== -1) {
            this.nodes.update(node, { tombstone: true });
        }
    }

    findPosition(position) {
        let index = -1;
        this.nodes.forEach((node, i) => {
            if (node.position > position) {
                index = i;
                return false; // Stop iterating
            }
        });
        return index;
    }

    cleanup() {
        this.nodes = this.nodes.filter(node => !node.tombstone);
    }
}