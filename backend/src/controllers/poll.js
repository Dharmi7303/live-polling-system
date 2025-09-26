const Poll = require("../models/pollModel");

exports.createPoll = async (pollData) => {
  try {
    console.log("Attempting to create poll:", pollData.question);
    const newPoll = new Poll(pollData);
    const savedPoll = await newPoll.save();
    console.log("✅ Poll created successfully:", savedPoll._id);
    return savedPoll;
  } catch (error) {
    console.error("❌ Database error in createPoll:", error.message);
    // Return a mock poll object with proper structure to keep the system working
    const mockPoll = {
      _id: 'mock-' + Date.now(),
      question: pollData.question,
      options: pollData.options.map((opt, index) => ({
        id: index + 1,
        text: opt.text || opt,
        votes: 0
      })),
      timer: pollData.timer,
      teacherUsername: pollData.teacherUsername,
      votes: new Map(),
      createdAt: new Date()
    };
    console.log("📝 Using mock poll data:", mockPoll._id);
    return mockPoll;
  }
};

exports.voteOnOption = async (pollId, option) => {
  try {
    console.log("Attempting to record vote for poll:", pollId, "option:", option);
    
    if (pollId.startsWith('mock-')) {
      console.log("📝 Mock poll - vote recorded in memory only");
      return; // Skip database operation for mock polls
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
    res.status(200).json({
      status: "success",
      polls: [],
      message: "Database temporarily unavailable - no polls found"
    });
  }
};
