import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '/calapelogo.png';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/home");
  };

  return (
    <header className="home-header">
      <div className="logo-container" onClick={handleLogoClick}>
        <img src={logo} alt="Calape Municipal Logo" className="logo-image" />
        <span className="logo-text">CalapeServeQ</span>
      </div>
      <div className="header-decoration">
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
      </div>
    </header>
  );
};

export default Header;