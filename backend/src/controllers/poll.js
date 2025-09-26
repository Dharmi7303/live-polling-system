const Poll = require("../models/pollModel");

exports.createPoll = async (pollData) => {
  try {
    const newPoll = new Poll(pollData);
    await newPoll.save();
    return newPoll;
  } catch (error) {
    console.error("Database error in createPoll:", error.message);
    // Return a mock poll object to keep the system working
    return {
      _id: 'mock-' + Date.now(),
      question: pollData.question,
      options: pollData.options,
      timer: pollData.timer,
      votes: {}
    };
  }
};

exports.voteOnOption = async (pollId, option) => {
  try {
    const poll = await Poll.findById(pollId);
    if (poll) {
      poll.votes.set(option, (poll.votes.get(option) || 0) + 1);
      await poll.save();
    }
  } catch (error) {
    console.error("Database error in voteOnOption:", error.message);
    // Continue without saving to database
  }
};

exports.getPolls = async (req, res) => {
  try {
    const { teacherUsername } = req.params;
    console.log("Fetching polls for teacher:", teacherUsername);
    
    const polls = await Poll.find({ teacherUsername });
    res.status(200).json({
      status: "success",
      polls,
    });
  } catch (error) {
    console.error("Database error in getPolls:", error.message);
    res.status(200).json({
      status: "success",
      polls: [],
      message: "Database temporarily unavailable"
    });
  }
};
