const Poll = require("../models/pollModel");

// In-memory storage for when MongoDB is unavailable
let mockPolls = [];
let voteStorage = new Map(); // Store votes for mock polls

exports.createPoll = async (pollData) => {
  try {
    console.log("Attempting to create poll:", pollData.question);
    const newPoll = new Poll(pollData);
    const savedPoll = await newPoll.save();
    console.log("✅ Poll created successfully:", savedPoll._id);
    return savedPoll;
  } catch (error) {
    console.error("❌ Database error in createPoll:", error.message);
    // Create mock poll and store in memory
    const mockPoll = {
      _id: 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      question: pollData.question,
      options: pollData.options.map((opt, index) => ({
        id: index + 1,
        text: opt.text || opt,
        votes: 0
      })),
      timer: pollData.timer || 60,
      teacherUsername: pollData.teacherUsername,
      votes: new Map(),
      createdAt: new Date(),
      isActive: true
    };
    
    // Store in memory
    mockPolls.push(mockPoll);
    voteStorage.set(mockPoll._id, new Map());
    
    console.log("📝 Created mock poll:", mockPoll._id, "- Total mock polls:", mockPolls.length);
    return mockPoll;
  }
};

exports.voteOnOption = async (pollId, option) => {
  try {
    console.log("Attempting to record vote for poll:", pollId, "option:", option);
    
    if (pollId.startsWith('mock-')) {
      // Handle mock poll voting
      const pollVotes = voteStorage.get(pollId);
      if (pollVotes) {
        const currentVotes = pollVotes.get(option) || 0;
        pollVotes.set(option, currentVotes + 1);
        
        // Update the mock poll's option votes
        const mockPoll = mockPolls.find(p => p._id === pollId);
        if (mockPoll) {
          const optionToUpdate = mockPoll.options.find(opt => opt.text === option || opt.id.toString() === option);
          if (optionToUpdate) {
            optionToUpdate.votes = pollVotes.get(option);
          }
        }
        
        console.log("📝 Mock poll vote recorded:", pollId, "option:", option, "total votes:", pollVotes.get(option));
        return;
      }
    }
    
    const poll = await Poll.findById(pollId);
    if (poll) {
      poll.votes.set(option, (poll.votes.get(option) || 0) + 1);
      await poll.save();
      console.log("✅ Vote recorded successfully");
    }
  } catch (error) {
    console.error("❌ Database error in voteOnOption:", error.message);
    // Continue without saving to database
  }
};

exports.getPolls = async (req, res) => {
  try {
    const { teacherUsername } = req.params;
    console.log("Fetching polls for teacher:", teacherUsername);
    
    const polls = await Poll.find({ teacherUsername });
    console.log("✅ Found", polls.length, "polls");
    
    res.status(200).json({
      status: "success",
      polls: polls,
    });
  } catch (error) {
    console.error("❌ Database error in getPolls:", error.message);
    
    // Return mock polls for the requested teacher
    const teacherMockPolls = mockPolls.filter(poll => poll.teacherUsername === teacherUsername);
    console.log("📝 Returning", teacherMockPolls.length, "mock polls for teacher:", teacherUsername);
    
    res.status(200).json({
      status: "success",
      polls: teacherMockPolls,
      message: "Using temporary data - Database temporarily unavailable"
    });
  }
};

// Helper functions for debugging and cleanup
exports.getMockPollsStatus = () => {
  return {
    totalMockPolls: mockPolls.length,
    mockPolls: mockPolls.map(poll => ({
      id: poll._id,
      question: poll.question,
      teacherUsername: poll.teacherUsername,
      optionsCount: poll.options.length,
      totalVotes: poll.options.reduce((sum, opt) => sum + opt.votes, 0)
    }))
  };
};

exports.clearMockPolls = () => {
  mockPolls = [];
  voteStorage.clear();
  console.log("🧹 Cleared all mock polls and vote storage");
};
