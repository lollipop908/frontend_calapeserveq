import React, { useEffect, useState, useRef } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { useQuery, gql } from "@apollo/client";
import "./styles/TVmonitor.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { GET_DEPARTMENTS, GET_QUEUES_BY_DEPARTMENT } from "../../graphql/query";

// GraphQL query for ads
const GET_ADS = gql`
  query GetAds {
    ads {
      id
      filename
      filepath
      mimetype
    }
  }
`;

const TVMonitor = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [nextRegularTickets, setNextRegularTickets] = useState([]);
  const [nextPriorityTickets, setNextPriorityTickets] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentPrefix, setDepartmentPrefix] = useState("");
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const lastUpdateRef = useRef(Date.now());
  const videoRef = useRef(null);

  const { data: deptData, loading: deptLoading } = useQuery(GET_DEPARTMENTS, {
    fetchPolicy: "cache-and-network",
  });

  const {
    data: queueData,
    loading: queueLoading,
    refetch,
  } = useQuery(GET_QUEUES_BY_DEPARTMENT, {
    variables: { departmentId },
    fetchPolicy: "network-only",
    skip: !departmentId,
    pollInterval: 3000,
  });

  // Ads
  const { data: adsData, loading: adsLoading } = useQuery(GET_ADS);
  const ads = adsData?.ads || [];

  // BASE_URL for images
  const BASE_URL = import.meta.env.VITE_GRAPHQL_URI
    ? import.meta.env.VITE_GRAPHQL_URI.replace("/graphql", "")
    : "http://localhost:3000";

  const getImageUrl = (filepath) => {
    if (!filepath) return "";
    return `${BASE_URL}${filepath.startsWith("/") ? "" : "/"}${filepath}`;
  };

  // Initial department setup
  useEffect(() => {
    if (
      deptData &&
      deptData.departments &&
      deptData.departments.length > 0 &&
      !departmentId
    ) {
      const firstDept = deptData.departments[0];
      setDepartmentId(firstDept.departmentId);
      setDepartmentName(firstDept.departmentName);
      setDepartmentPrefix(firstDept.prefix || "");
    }
  }, [deptData, departmentId]);

  // SSE connection (same as before)
  useEffect(() => {
    if (!departmentId) return;

    const eventSource = new EventSource(
      "https://queuecalape.onrender.com/queue/stream",
    );

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const eventData = parsed.data || parsed;
        const eventDept = String(eventData.department || "")
          .trim()
          .toUpperCase();
        const matchPrefix = String(departmentPrefix).trim().toUpperCase();
        const matchName = String(departmentName).trim().toUpperCase();

        const isMatch =
          eventDept === matchPrefix ||
          eventDept === matchName ||
          eventDept.includes(matchPrefix) ||
          matchName.includes(eventDept);

        if (isMatch && refetch) refetch();
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    return () => eventSource.close();
  }, [departmentId, departmentPrefix, departmentName, refetch]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [servingTickets, setServingTickets] = useState([]);

  // ... (lines 126-127)
  useEffect(() => {
    if (queueData?.QueueByDepartment) {
      const queues = queueData.QueueByDepartment;

      const serving = queues
        .filter((q) => q.status.toUpperCase() === "SERVING")
        .map((q) => ({
          ticket: `${q.department?.prefix || departmentPrefix}-${q.number}`,
          counterName: q.counter?.counterName || "Unknown",
        }));
      setServingTickets(serving);

      const waiting = queues
        .filter((q) => q.status.toUpperCase() === "WAITING")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      // Regular tickets
      const regular = waiting
        .filter((q) => q.priority.toLowerCase() === "regular")
        .slice(0, 3)
        .map((q) => `${q.department?.prefix || departmentPrefix}-${q.number}`);

      // Priority tickets (Senior, PWD, Pregnant)
      const priority = waiting
        .filter((q) => q.priority.toLowerCase() !== "regular")
        .slice(0, 3)
        .map((q) => `${q.department?.prefix || departmentPrefix}-${q.number}`);

      setNextRegularTickets(regular);
      setNextPriorityTickets(priority);
    }
  }, [queueData, departmentPrefix]);

  // Department change
  const handleDepartmentChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedDept = deptData.departments.find(
      (d) => d.departmentId === selectedId,
    );
    if (selectedDept) {
      setDepartmentId(selectedId);
      setDepartmentName(selectedDept.departmentName);
      setDepartmentPrefix(selectedDept.prefix || "");
      setCurrentTicket(null);
      setNextRegularTickets([]);
      setNextPriorityTickets([]);
    }
  };

  // Local Storage Polling for Ad Settings
  const [showAdsGlobally, setShowAdsGlobally] = useState(() => {
    const saved = localStorage.getItem("tv_show_ads_global");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [allowedAdIds, setAllowedAdIds] = useState(() => {
    const saved = localStorage.getItem("tv_selected_ad_ids");
    return saved ? JSON.parse(saved) : [];
  });

  // Optimize polling to avoid unnecessary re-renders
  const lastGlobalRef = useRef(localStorage.getItem("tv_show_ads_global"));
  const lastIdsRef = useRef(localStorage.getItem("tv_selected_ad_ids"));

  useEffect(() => {
    const checkLocalStorage = () => {
      const savedGlobal = localStorage.getItem("tv_show_ads_global");
      const savedIds = localStorage.getItem("tv_selected_ad_ids");

      // Only update if value changed
      if (savedGlobal !== null && savedGlobal !== lastGlobalRef.current) {
        setShowAdsGlobally(JSON.parse(savedGlobal));
        lastGlobalRef.current = savedGlobal;
      }

      if (savedIds && savedIds !== lastIdsRef.current) {
        setAllowedAdIds(JSON.parse(savedIds));
        lastIdsRef.current = savedIds;
      }
    };

    const interval = setInterval(checkLocalStorage, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter ads based on selection
  const visibleAds = ads.filter((ad) => allowedAdIds.includes(String(ad.id)));

  // Update effect to use visibleAds instead of ads
  useEffect(() => {
    if (visibleAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % visibleAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [visibleAds]);

  // Handle case where currentAdIndex might be out of bounds after filtering
  useEffect(() => {
    if (currentAdIndex >= visibleAds.length && visibleAds.length > 0) {
      setCurrentAdIndex(0);
    }
  }, [visibleAds, currentAdIndex]);

  // Toggle audio
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="queue-container">
      <Header />
      <div className="queue-content">
        <div className="department-section">
          <select
            id="department"
            name="department"
            className="department-select"
            value={departmentId || ""}
            onChange={handleDepartmentChange}
            disabled={deptLoading}
          >
            {deptLoading ? (
              <option>Loading departments...</option>
            ) : (
              deptData?.departments?.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </option>
              ))
            )}
          </select>
          <div className="time-display">{currentTime}</div>
        </div>

        <div className="main-layout">
          <div className="queue-section">
            <div className="queue-cards">
              <div className="now-serving-panel">
                <div className="label">Now Serving</div>
                <div className="serving-tickets-list">
                  {queueLoading ? (
                    <div className="ticket-placeholder">Loading...</div>
                  ) : servingTickets.length > 0 ? (
                    servingTickets.map((item, idx) => (
                      <div key={idx} className="serving-ticket-item">
                        <div className="ticket-number">{item.ticket}</div>
                        <div className="counter-name-label">
                          {item.counterName}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="ticket-placeholder">
                      Waiting for queue...
                    </div>
                  )}
                </div>
              </div>

              <div className="previous-panel">
                <div className="split-columns">
                  {/* Regular Column */}
                  <div className="queue-column">
                    <div className="label">Regular</div>
                    <div className="previous-tickets">
                      {nextRegularTickets.length > 0 ? (
                        nextRegularTickets.map((ticket, index) => (
                          <div key={index} className="previous-ticket">
                            <div className="prev-number">{ticket}</div>
                          </div>
                        ))
                      ) : (
                        <div className="no-previous">No regular tickets</div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="column-divider"></div>

                  {/* Priority Column */}
                  <div className="queue-column">
                    <div className="label priority-label">Priority</div>
                    <div className="previous-tickets">
                      {nextPriorityTickets.length > 0 ? (
                        nextPriorityTickets.map((ticket, index) => (
                          <div
                            key={index}
                            className="previous-ticket priority-ticket"
                          >
                            <div className="prev-number">{ticket}</div>
                          </div>
                        ))
                      ) : (
                        <div className="no-previous">No priority tickets</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ads Section */}
          {showAdsGlobally && (
            <div className="ad-section">
              {adsLoading || visibleAds.length === 0 ? (
                <div className="ad-placeholder">
                  <div className="ad-content">
                    <span className="ad-text">Advertisement</span>
                    <span className="coming-soon">Coming Soon</span>
                  </div>
                </div>
              ) : (
                <div className="ad-card" style={{ position: "relative" }}>
                  {/* IMAGE PREVIEW */}
                  {visibleAds[currentAdIndex] &&
                    visibleAds[currentAdIndex].mimetype?.startsWith(
                      "image/",
                    ) && (
                      <img
                        src={getImageUrl(visibleAds[currentAdIndex].filepath)}
                        alt={visibleAds[currentAdIndex].filename}
                        className="ad-media"
                      />
                    )}

                  {/* VIDEO PREVIEW */}
                  {visibleAds[currentAdIndex] &&
                    visibleAds[currentAdIndex].mimetype?.startsWith(
                      "video/",
                    ) && (
                      <video
                        ref={videoRef}
                        src={getImageUrl(visibleAds[currentAdIndex].filepath)}
                        className="ad-media"
                        autoPlay
                        loop
                        muted={isMuted}
                      />
                    )}

                  {/* Audio Toggle Button */}
                  <button
                    onClick={toggleMute}
                    className="audio-toggle-btn"
                    style={{
                      position: "absolute",
                      bottom: "20px",
                      right: "20px",
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 10,
                      transition: "background 0.3s",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.background = "rgba(0,0,0,0.8)")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.background = "rgba(0,0,0,0.6)")
                    }
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <FaVolumeMute size={20} />
                    ) : (
                      <FaVolumeUp size={20} />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TVMonitor;
