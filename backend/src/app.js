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

const DB =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URL || "mongodb+srv://dharmijaviya_db_user:Y2GCc4UizPrinVik@livepollintervue.ov60ktd.mongodb.net/livepoll?retryWrites=true&w=majority"
    : "mongodb+srv://dharmijaviya_db_user:Y2GCc4UizPrinVik@livepollintervue.ov60ktd.mongodb.net/livepoll?retryWrites=true&w=majority";

let isMongoConnected = false;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // Increased timeout
    socketTimeoutMS: 45000,
    bufferCommands: true, // Re-enable buffering to prevent timing issues
    bufferMaxEntries: 0,
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");
    isMongoConnected = true;
  })
  .catch((e) => {
    console.error("Failed to connect to MongoDB:", e.message);
    console.log("Server will continue running without database connection");
    isMongoConnected = false;
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
  console.log(`Server running on port ${port}...`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database URL configured: ${DB ? 'Yes' : 'No'}`);
});
