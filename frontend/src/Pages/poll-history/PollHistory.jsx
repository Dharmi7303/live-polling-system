import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import backIcon from "../../assets/back.svg";
let apiUrl =
  import.meta.env.VITE_NODE_ENV === "production"
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:3000";
const socket = io(apiUrl);

const PollHistoryPage = () => {
  const [polls, setPolls] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const getPolls = async () => {
      const username = sessionStorage.getItem("username");

      try {
        const response = await axios.get(`${apiUrl}/polls/${username}`);
        console.log("Polls response:", response.data);
        // Handle both possible response structures
        const pollsData = response.data.polls || response.data.data || [];
        setPolls(Array.isArray(pollsData) ? pollsData : []);
      } catch (error) {
        console.error("Error fetching polls:", error);
        setPolls([]); // Set empty array on error
      }
    };

    getPolls();
  }, []);

  const calculatePercentage = (count, totalVotes) => {
    if (totalVotes === 0) return 0;
    return (count / totalVotes) * 100;
  };
  const handleBack = () => {
    navigate("/teacher-home-page");
  };
  let questionCount = 0;

  return (
    <div className="container mt-5 w-50">
      <div className="mb-4 text-left">
        <img
          src={backIcon}
          alt=""
          width={"25px"}
          srcset=""
          style={{ cursor: "pointer" }}
          onClick={handleBack}
        />{" "}
        View <b>Poll History</b>
      </div>
      {polls && polls.length > 0 ? (
        polls.map((poll) => {
          // Safety checks for poll data
          if (!poll || !poll.options || !Array.isArray(poll.options)) {
            return null; // Skip invalid poll data
          }
          
          const totalVotes = poll.options.reduce(
            (sum, option) => sum + (option.votes || 0),
            0
          );

          return (
            <>
              <div className="pb-3">{`Quetion ${++questionCount}`}</div>
              <div key={poll._id} className="card mb-4">
                <div className="card-body">
                  <h6 className="question py-2 ps-2 text-left rounded text-white">
                    {poll.question} ?
                  </h6>
                  <div className="list-group mt-4">
                    {poll.options && poll.options.length > 0 ? poll.options.map((option) => (
                      <div
                        key={option._id || Math.random()}
                        className="list-group-item rounded m-2"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{option.text || option}</span>
                          <span>
                            {Math.round(
                              calculatePercentage(option.votes || 0, totalVotes)
                            )}
                            %
                          </span>
                        </div>
                        <div className="progress mt-2">
                          <div
                            className="progress-bar progress-bar-bg"
                            role="progressbar"
                            style={{
                              width: `${calculatePercentage(
                                option.votes || 0,
                                totalVotes
                              )}%`,
                            }}
                            aria-valuenow={option.votes || 0}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-muted">No options available</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          );
        })
      ) : (
        <div className="text-muted">polls not found</div>
      )}
    </div>
  );
};

export default PollHistoryPage;
