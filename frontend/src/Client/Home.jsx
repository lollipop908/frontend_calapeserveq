import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import "../pages/Citizens/styles/QueueForm.css"; // Reuse existing styles or create new ones

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="queue-page-wrapper">
      <Header />
      <div className="queue-home-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="queue-form-wrapper" style={{ textAlign: 'center', maxWidth: '600px' }}>
          <div className="queue-form" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '50%', color: '#3b82f6' }}>
               <Building2 size={48} />
            </div>
            
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                Welcome to Calape ServeQ
              </h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Skip the lines and manage your time better. Generate your queue number online and track your status in real-time.
              </p>
            </div>

            <button 
              className="queue-submit-btn" 
              style={{ padding: '1rem 2rem', fontSize: '1.1rem', width: 'auto' }}
              onClick={() => navigate("/queue")}
            >
              Get Started
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
