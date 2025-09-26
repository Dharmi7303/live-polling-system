const Teacher = require("../models/teacher");

exports.TeacherLogin = async (req, res) => {
  try {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    let teacherUsername = `teacher${randomNumber}`;
    let newTeacher = new Teacher({ username: teacherUsername });
    await newTeacher.save();
    
    res.status(201).json({
      status: "success",
      username: newTeacher.username,
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
