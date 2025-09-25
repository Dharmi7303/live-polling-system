import React from "react";
import { useNavigate } from "react-router-dom";
import stars from "../../assets/spark.svg";
import "./KickedOutPage.css";

const KickedOutPage = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="kicked-out-container text-center">
        <button className="btn btn-sm intervue-btn mb-4">
          <img src={stars} className="px-1" alt="Poll Icon" />
          Intervue Poll
        </button>
        
        <h2 className="kicked-out-title">
          You've been <b>Kicked out !</b>
        </h2>
        
        <p className="kicked-out-description">
          Looks like the teacher had removed you from the poll system. Please
          <br />
          Try again sometime.
        </p>

        <button 
          className="btn continue-btn mt-4" 
          onClick={handleTryAgain}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default KickedOutPage;