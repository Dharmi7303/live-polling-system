const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");
const { TeacherLogin } = require("./controllers/login");
const {
  createPoll,
  voteOnOption,
  getPolls,
} = require("../src/controllers/poll");

const app = express();
app.use(cors({
  origin: "*", // Allow all origins for now to ensure deployment works
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Add explicit CORS middleware for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

const port = process.env.PORT || 3000;

// URL encode the password to handle special characters
const MONGO_PASSWORD = "Y2GCc4UizPrinVik";
const DB =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URL || `mongodb+srv://dharmijaviya_db_user:${encodeURIComponent(MONGO_PASSWORD)}@livepollintervue.ov60ktd.mongodb.net/livepollintervue?retryWrites=true&w=majority`
    : `mongodb+srv://dharmijaviya_db_user:${encodeURIComponent(MONGO_PASSWORD)}@livepollintervue.ov60ktd.mongodb.net/livepollintervue?retryWrites=true&w=majority`;

console.log("Attempting to connect to MongoDB...");
console.log("Database URL:", DB.replace(/([^:]*:\/\/[^:]*:)([^@]*)(@.*)/, '$1****$3'));

let isMongoConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 3;

const connectToMongoDB = async () => {
  try {
    console.log(`Connection attempt ${connectionRetries + 1}/${MAX_RETRIES}`);
    
    await mongoose.connect(DB, {
      serverSelectionTimeoutMS: 10000, // Reduced timeout to fail faster
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      maxPoolSize: 5, // Reduced pool size
      heartbeatFrequencyMS: 30000,
      bufferCommands: false,
    });
    
    console.log("✅ Connected to MongoDB successfully");
    isMongoConnected = true;
    connectionRetries = 0; // Reset on successful connection
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    console.error("Full error:", error);
    isMongoConnected = false;
    
    if (connectionRetries < MAX_RETRIES - 1) {
      connectionRetries++;
      console.log(`Retrying connection in 10 seconds... (${connectionRetries}/${MAX_RETRIES})`);
      setTimeout(connectToMongoDB, 10000);
    } else {
      console.log("Maximum retry attempts reached. Server will continue with mock data only");
      connectionRetries = 0;
    }
  }
};

// Start MongoDB connection in background - don't block server startup
setTimeout(() => {
  console.log("Starting MongoDB connection attempt...");
  connectToMongoDB();
}, 1000);

// Monitor connection status
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
  isMongoConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
  isMongoConnected = false;
  
  // Attempt to reconnect on error
  setTimeout(() => {
    console.log('Attempting to reconnect due to connection error...');
    connectToMongoDB();
  }, 10000);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  isMongoConnected = false;
  
  // Attempt to reconnect on disconnect
  setTimeout(() => {
    console.log('Attempting to reconnect due to disconnection...');
    connectToMongoDB();
  }, 5000);
});

// Export connection status for other modules
module.exports.isMongoConnected = () => isMongoConnected;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let votes = {};
let connectedUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createPoll", async (pollData) => {
    votes = {};
    const poll = await createPoll(pollData);
    io.emit("pollCreated", poll);
  });

  socket.on("kickOut", (userToKick) => {
    for (let id in connectedUsers) {
      if (connectedUsers[id] === userToKick) {
        io.to(id).emit("kickedOut", { message: "You have been kicked out." });
        const userSocket = io.sockets.sockets.get(id);
        if (userSocket) {
          userSocket.disconnect(true);
        }
        delete connectedUsers[id];
        break;
      }
    }
    io.emit("participantsUpdate", Object.values(connectedUsers));
  });

  socket.on("joinChat", ({ username }) => {
    connectedUsers[socket.id] = username;
    io.emit("participantsUpdate", Object.values(connectedUsers));

    socket.on("disconnect", () => {
      delete connectedUsers[socket.id];
      io.emit("participantsUpdate", Object.values(connectedUsers));
    });
  });

  socket.on("studentLogin", (name) => {
    socket.emit("loginSuccess", { message: "Login successful", name });
  });

  socket.on("chatMessage", (message) => {
    io.emit("chatMessage", message);
  });

  socket.on("submitAnswer", (answerData) => {
    votes[answerData.option] = (votes[answerData.option] || 0) + 1;
    voteOnOption(answerData.pollId, answerData.option);
    io.emit("pollResults", votes);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Polling System Backend - Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
});

app.get("/test", (req, res) => {
  res.json({
    message: "Test endpoint working",
    cors: "enabled",
    mongoConnected: isMongoConnected,
    timestamp: new Date().toISOString()
  });
});

app.get("/debug", (req, res) => {
  const { getMockPollsStatus } = require("./controllers/poll");
  const mockPollsInfo = getMockPollsStatus();
  
  res.json({
    message: "Debug endpoint",
    environment: process.env.NODE_ENV || "development",
    mongoConnected: isMongoConnected,
    mongoUrl: DB ? "configured" : "not configured",
    hasMongodbUrl: !!process.env.MONGODB_URL,
    mockPolls: mockPollsInfo,
    timestamp: new Date().toISOString()
  });
});

app.post("/teacher-login", (req, res) => {
  console.log("Teacher login endpoint hit");
  try {
    TeacherLogin(req, res);
  } catch (error) {
    console.error("Teacher login error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/polls/:teacherUsername", (req, res) => {
  console.log("Polls endpoint hit for:", req.params.teacherUsername);
  getPolls(req, res);
});

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}!`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database URL configured: ${DB ? 'Yes' : 'No'}`);
  console.log(`Server started successfully at ${new Date().toISOString()}`);
  
  // Basic health check to ensure server is responsive
  console.log("✅ Express server is ready to accept connections");
});
