const EventEmitter = require('events');
class OrderEventEmitter extends EventEmitter { }
const orderEvents = new OrderEventEmitter();

// Prevent memory leak warnings when many clients are connected to SSE streams
orderEvents.setMaxListeners(0);

module.exports = orderEvents;
