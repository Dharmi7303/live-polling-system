const Teacher = require("../models/teacher");

exports.TeacherLogin = async (req, res) => {
  try {
    console.log("Teacher login function called");
    
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    let teacherUsername = `teacher${randomNumber}`;
    
    // Try to save to database, but don't fail if DB is unavailable
    try {
      let newTeacher = new Teacher({ username: teacherUsername });
      await newTeacher.save();
      console.log("Teacher saved to database:", teacherUsername);
    } catch (dbError) {
      console.log("Database unavailable, continuing without saving:", dbError.message);
      // Continue without database - still return success
    }
    
    res.status(201).json({
      status: "success",
      username: teacherUsername,
    });
  } catch (error) {
    console.error("Teacher login error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create teacher login",
      error: error.message
    });
  }
};
