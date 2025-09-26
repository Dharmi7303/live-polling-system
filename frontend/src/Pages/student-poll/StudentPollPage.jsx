import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import io from "socket.io-client";
import "./StudentPollPage.css";
import stopwatch from "../../assets/stopwatch.svg";
import ChatPopover from "../../components/chat/ChatPopover";
import { useNavigate } from "react-router-dom";
import stars from "../../assets/spark.svg";
import KickedOutPage from "../kicked-out/KickedOutPage";
let apiUrl =
  import.meta.env.VITE_NODE_ENV === "production"
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:3000";
const socket = io(apiUrl);

const StudentPollPage = () => {
  const [votes, setVotes] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([]);
  const [pollId, setPollId] = useState("");
  const [kickedOut, setKickedOut] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  // Format timer as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (selectedOption) {
      const username = sessionStorage.getItem("username");
      if (username) {
        socket.emit("submitAnswer", {
          username: username,
          option: selectedOption,
          pollId: pollId,
        });
        setSubmitted(true);
      } else {
        console.error("No username found in session storage!");
      }
    }
  };

  useEffect(() => {
    const handleKickedOut = () => {
      setKickedOut(true);
      sessionStorage.removeItem("username");
    };

    socket.on("kickedOut", handleKickedOut);

    return () => {
      socket.off("kickedOut", handleKickedOut);
    };
  }, [navigate]);

  useEffect(() => {
    socket.on("pollCreated", (pollData) => {
      setPollQuestion(pollData.question);
      setPollOptions(pollData.options);
      setVotes({});
      setSubmitted(false);
      setSelectedOption(null);
      setTimeLeft(pollData.timer);
      setPollId(pollData._id);
      setQuestionNumber(prevNum => prevNum + 1);
    });

    socket.on("pollResults", (updatedVotes) => {
      setVotes(updatedVotes);
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            setSubmitted(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, submitted]);

  const calculatePercentage = (count) => {
    if (totalVotes === 0) return 0;
    return (count / totalVotes) * 100;
  };

  return (
    <>
      <ChatPopover />
      {kickedOut ? (
        <KickedOutPage />
      ) : (
        <>
          {" "}
          {pollQuestion === "" && timeLeft === 0 && (
            <div className="d-flex justify-content-center align-items-center vh-100 w-75  mx-auto">
              <div className="student-landing-container text-center">
                <button className="btn btn-sm intervue-btn mb-5">
                  <img src={stars} className="px-1" alt="" />
                  Intervue Poll
                </button>
                <br />
                <div
                  className="spinner-border text-center spinner"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h3 className="landing-title">
                  <b>Wait for the teacher to ask questions..</b>
                </h3>
              </div>
            </div>
          )}
          {pollQuestion !== "" && (
            <div className="container mt-5 w-50">
              <div className="d-flex align-items-center mb-4">
                <h5 className="m-0 pe-5">Question {questionNumber}</h5>
                <img
                  src={stopwatch}
                  width="15px"
                  height="auto"
                  alt="Stopwatch"
                />
                <span className="ps-2 ml-2 text-danger">{formatTime(timeLeft)}</span>
              </div>
              <div className="poll-results-container">
                <div className="poll-question-header">
                  {pollQuestion}?
                </div>
                <div className="poll-options-list">
                  {pollOptions.map((option, index) => (
                    <div
                      key={option.id}
                      className={`poll-option-result ${
                        !submitted && timeLeft > 0 ? 'poll-option-clickable' : ''
                      } ${
                        selectedOption === option.text ? 'selected-option' : ''
                      } ${
                        submitted && selectedOption === option.text ? 'selected' : ''
                      }`}
                      onClick={() => {
                        if (!submitted && timeLeft > 0) {
                          handleOptionSelect(option.text);
                        }
                      }}
                    >
                      <div 
                        className="option-progress-bg" 
                        style={{
                          width: submitted ? `${calculatePercentage(votes[option.text] || 0)}%` : '0%'
                        }}
                      />
                      <div className="option-number">
                        {index + 1}
                      </div>
                      <div className="option-text">
                        {option.text}
                      </div>
                      <div className="option-percentage">
                        {submitted ? `${Math.round(calculatePercentage(votes[option.text] || 0))}%` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!submitted && selectedOption && timeLeft > 0 && (
                <div className="d-flex  justify-content-end align-items-center">
                  <button
                    type="submit"
                    className="btn continue-btn my-3 w-25"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              )}

              {submitted && (
                <div className="mt-5">
                  <h6 className="text-center">
                    Wait for the teacher to ask a new question...
                  </h6>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default StudentPollPage;
