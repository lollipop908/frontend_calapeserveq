import React from 'react';
import logo from '/calapelogo.png';
import './Header.css';

const Header = () => {
  

  return (
    <header className="app-header">
      <span className="logo-container"> 
        <img src={logo} alt="Calape Municipal Logo" className="logo-image" />
        <span className="logo-text">CalapeServeQ</span>
      </span>
      <div className="header-decoration">
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
      </div>
    </header>
  );
};

export default Header;