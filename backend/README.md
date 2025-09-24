
# Live Polling System - Backend

## 📋 Overview
This is the backend server for the Live Polling System, a real-time polling application designed for educational environments. It enables teachers to create interactive polls and students to participate in real-time voting with live results visualization.

**Assignment**: Intervue.io SDE Intern Role Assignment - Round 1

## ✨ Features

### 🎯 Core Functionality
- **Real-time Polling**: Create and manage live polls with instant results
- **Teacher Dashboard**: Complete poll management and student oversight
- **Student Participation**: Real-time voting with timer-based submissions
- **Live Chat System**: Interactive communication between teachers and students
- **Poll History**: Persistent storage and retrieval of past polls
- **Student Management**: Teacher can remove disruptive students

### 🔧 Technical Features
- **WebSocket Communication**: Real-time bidirectional communication using Socket.IO
- **RESTful API**: Clean API endpoints for poll management
- **MongoDB Integration**: Robust data persistence with cloud database support
- **Cross-Origin Support**: Proper CORS configuration for frontend integration
- **Environment Configuration**: Flexible deployment with environment variables

## 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas Cloud)
- **Real-time**: Socket.IO
- **Authentication**: Session-based authentication
- **Environment**: dotenv for configuration

## 📁 Project Structure
```
backend/
├── src/
│   ├── app.js              # Main application server
│   ├── controllers/        # Business logic controllers
│   │   ├── login.js       # Teacher authentication
│   │   └── poll.js        # Poll management
│   └── models/            # Database models
│       ├── pollModel.js   # Poll schema definition
│       └── teacher.js     # Teacher schema definition
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: Local installation or Atlas cloud account

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "live polling system/backend"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URL=mongodb+srv://your-connection-string
   ```

4. **Start the server**:
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## 🌐 API Endpoints

### Authentication
- `POST /teacher-login` - Generate teacher session

### Poll Management
- `GET /polls/:teacherUsername` - Retrieve teacher's poll history

### Socket.IO Events

#### Client → Server
- `createPoll` - Create a new poll
- `submitAnswer` - Submit student vote
- `joinChat` - Join chat room
- `chatMessage` - Send chat message
- `kickOut` - Remove student (teacher only)
- `studentLogin` - Student authentication

#### Server → Client
- `pollCreated` - New poll broadcast
- `pollResults` - Real-time vote results
- `chatMessage` - Chat message broadcast
- `participantsUpdate` - Active participants list
- `kickedOut` - Student removal notification
- `loginSuccess` - Authentication confirmation

## 🗄️ Database Schema

### Poll Model
```javascript
{
  teacherUsername: String,
  question: String,
  options: [{
    id: Number,
    text: String,
    correct: Boolean,
    votes: Number
  }],
  timer: Number,
  createdAt: Date
}
```

### Teacher Model
```javascript
{
  username: String,
  createdAt: Date
}
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```
Server runs on: `http://localhost:3000`

### Production Deployment
1. Set `NODE_ENV=production` in environment
2. Configure production MongoDB connection
3. Deploy to your preferred platform (Heroku, Vercel, etc.)

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URL` | Database connection string | mongodb://localhost:27017/ |

### CORS Configuration
The server is configured to accept requests from any origin for development. Update CORS settings for production deployment.

## 📊 Performance & Scalability
- **Real-time Connections**: Supports multiple concurrent users
- **Database Optimization**: Efficient MongoDB queries with indexing
- **Memory Management**: Proper connection pooling and resource cleanup
- **Error Handling**: Comprehensive error handling and logging

## 🔒 Security Features
- **Input Validation**: Sanitized user inputs
- **Session Management**: Secure session handling
- **CORS Protection**: Configurable cross-origin policies
- **Environment Security**: Sensitive data in environment variables

## 🧪 Testing
```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 📝 API Usage Examples

### Create a Poll
```javascript
socket.emit('createPoll', {
  question: "What is your favorite programming language?",
  options: [
    { id: 1, text: "JavaScript", correct: false },
    { id: 2, text: "Python", correct: true }
  ],
  timer: 60,
  teacherUsername: "teacher1234"
});
```

### Submit Answer
```javascript
socket.emit('submitAnswer', {
  username: "student_name",
  option: "JavaScript",
  pollId: "poll_id_here"
});
```

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
This project is part of the Intervue.io SDE Intern Assignment.

## 👥 Author
**Assignment Submission** - Intervue.io SDE Intern Role

---
*Built by Dharmi*
