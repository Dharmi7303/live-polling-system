import React, { useState } from "react";
import stars from "../../assets/spark.svg";
import "./TeacherLandingPage.css";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import eyeIcon from "../../assets/eye.svg";
let apiUrl =
  import.meta.env.VITE_NODE_ENV === "production"
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:3000||https://live-polling-system-backend.onrender.com";
const socket = io(apiUrl);
const TeacherLandingPage = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ id: 1, text: "", correct: null }]);
  const [timer, setTimer] = useState("60");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const username = sessionStorage.getItem("username");
  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleTimerChange = (e) => {
    setTimer(e.target.value);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index].text = value;
    setOptions(updatedOptions);
  };

  const handleCorrectToggle = (index, isCorrect) => {
    const updatedOptions = [...options];
    updatedOptions[index].correct = isCorrect;
    setOptions(updatedOptions);
  };

  const addOption = () => {
    setOptions([
      ...options,
      { id: options.length + 1, text: "", correct: null },
    ]);
  };

  const validateForm = () => {
    if (question.trim() === "") {
      setError("Question cannot be empty");
      return false;
    }

    if (options.length < 2) {
      setError("At least two options are required");
      return false;
    }

    const optionTexts = options.map((option) => option.text.trim());
    if (optionTexts.some((text) => text === "")) {
      setError("All options must have text");
      return false;
    }

    const correctOptionExists = options.some(
      (option) => option.correct === true
    );
    if (!correctOptionExists) {
      setError("At least one correct option must be selected");
      return false;
    }

    setError("");
    return true;
  };

  const askQuestion = () => {
    if (validateForm()) {
      let teacherUsername = sessionStorage.getItem("username");
      let pollData = { question, options, timer, teacherUsername };
      socket.emit("createPoll", pollData);
      navigate("/teacher-poll");
    }
  };
  const handleViewPollHistory = () => {
    navigate("/teacher-poll-history");
  };

  return (
    <>
      <button
        className="btn rounded-pill ask-question px-4 m-2"
        onClick={handleViewPollHistory}
      >
        <img src={eyeIcon} alt="" />
        View Poll history
      </button>
      <div className="container my-4 w-75 ms-5">
        <button className="btn btn-sm intervue-btn mb-3">
          <img src={stars} className="px-1" alt="Poll Icon" />
          Intervue Poll
        </button>

        <h2 className="teacher-title">
          Let's <b>Get Started</b>
        </h2>
        <p className="teacher-info">
          <b>Teacher: </b>
          {username}
        </p>
        <p className="teacher-description">
          you'll have the ability to create and manage polls, ask questions, and
          monitor
          <br />
          your students' responses in real-time.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-4">
          <div className="form-header-row">
            <label htmlFor="question" className="form-label">
              Enter your question
            </label>
            <select
              className="form-select"
              value={timer}
              onChange={handleTimerChange}
            >
              <option value="60">60 seconds</option>
              <option value="90">30 seconds</option>
            </select>
          </div>
          <div className="question-container">
            <textarea
              id="question"
              className="form-control"
              onChange={handleQuestionChange}
              maxLength="100"
              placeholder="Type your question..."
            ></textarea>
            <div className="character-counter">{question.length}/100</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="form-header-row">
            <label className="form-label">Edit Options</label>
            <label className="form-label correct-label">Is it correct?</label>
          </div>
          {options.map((option, index) => (
            <div key={option.id} className="d-flex align-items-center mb-2">
              <span className="me-3 sNo">{index + 1}</span>
              <input
                type="text"
                className="form-control me-3 option-input"
                placeholder="Option text..."
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`correct-${index}`}
                  checked={option.correct === true}
                  onChange={() => handleCorrectToggle(index, true)}
                  required="required"
                />
                <label className="form-check-label">Yes</label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`correct-${index}`}
                  checked={option.correct === false}
                  onChange={() => handleCorrectToggle(index, false)}
                  required="required"
                />
                <label className="form-check-label">No</label>
              </div>
            </div>
          ))}
        </div>
        <button className="btn add-options" onClick={addOption}>
          + Add More option
        </button>
      </div>
      <hr />
      <button
        className="btn rounded-pill ask-question px-4 m-2"
        onClick={askQuestion}
      >
        Ask Question
      </button>
    </>
  );
};

export default TeacherLandingPage;
