import React from 'react';
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import './Footer.css';

const Footer = () => {
  return (
    <footer className="home-footer">
      <div className="footer-content">
        <div className="footer-text">
          © 2025 Municipality of Calape. All rights reserved.
        </div>
        <div className="footer-links">
          <a href="#contact" className="footer-link">
            <FaPhone />
            <span>Contact</span>
          </a>
          <a href="#location" className="footer-link">
            <FaMapMarkerAlt />
            <span>Location</span>
          </a>
          <a href="#support" className="footer-link">
            <FaEnvelope />
            <span>Support</span>
          </a>
        </div>
        <div className="footer-version">
          v1.0.0
        </div>
      </div>
    </footer>
  );
};

export default Footer;