import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "@apollo/client";
import "./styles/TVmonitor.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { GET_DEPARTMENTS, GET_QUEUES_BY_DEPARTMENT } from "../../graphql/query";

const TVmonitor = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [currentTicket, setCurrentTicket] = useState(null);
  const [nextTickets, setNextTickets] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentPrefix, setDepartmentPrefix] = useState("");
  const lastUpdateRef = useRef(Date.now());

  // Fetch all departments
  const { data: deptData, loading: deptLoading } = useQuery(GET_DEPARTMENTS, {
    fetchPolicy: "cache-and-network",
  });

  // Fetch queues by selected department with refetch function
  const {
    data: queueData,
    loading: queueLoading,
    refetch,
  } = useQuery(GET_QUEUES_BY_DEPARTMENT, {
    variables: { departmentId },
    fetchPolicy: "network-only",
    skip: !departmentId,
    pollInterval: 3000, // Auto-refetch every 3 seconds as fallback
  });

  // Set initial department when data loads
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

  // SSE Connection with comprehensive logging
  useEffect(() => {
    if (!departmentId) return;

    console.log(
      "🔌 SSE connecting for department:",
      departmentName,
      "prefix:",
      departmentPrefix
    );

    const eventSource = new EventSource(
      "https://queuecalape.onrender.com/queue/stream"
    );

    eventSource.onopen = () => {
      console.log("✅ SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      console.log("📨 SSE Raw event:", event.data);

      try {
        const parsed = JSON.parse(event.data);
        console.log("📦 SSE Parsed data:", parsed);

        // Handle different possible SSE data structures
        const eventData = parsed.data || parsed;

        if (!eventData) {
          console.log("⚠️ No event data found");
          return;
        }

        console.log("🔍 Event data:", {
          department: eventData.department,
          number: eventData.number,
          service: eventData.service,
          currentDept: departmentName,
          currentPrefix: departmentPrefix,
        });

        // Check if this update is for our department
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

        console.log("🎯 Department match:", isMatch, {
          eventDept,
          matchPrefix,
          matchName,
        });

        if (isMatch) {
          console.log("✨ Match found! Triggering refetch...");
          lastUpdateRef.current = Date.now();

          // Force refetch
          if (refetch) {
            refetch()
              .then(() => console.log("✅ Refetch successful"))
              .catch((err) => console.error("❌ Refetch error:", err));
          }
        }
      } catch (e) {
        console.error("❌ SSE parse error:", e, "Raw:", event.data);
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ SSE connection error:", err);
      console.log("Reconnecting...");
    };

    return () => {
      console.log("🔌 SSE disconnecting");
      eventSource.close();
    };
  }, [departmentId, departmentPrefix, departmentName, refetch]);

  // ⏰ Update time display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📋 Process queue data - FIXED VERSION
  useEffect(() => {
    if (queueData && queueData.QueueByDepartment) {
      const queues = queueData.QueueByDepartment;
      console.log("📊 Queue data updated:", queues.length, "items");

      // Get currently serving ticket
      const serving = queues.find(
        (q) => String(q.status).toUpperCase() === "SERVING"
      );

      if (serving) {
        const prefix = serving.department?.prefix || departmentPrefix;
        const ticketNumber = `${prefix}-${serving.number}`;
        console.log("🎫 Now serving:", ticketNumber);

        // Store just the ticket number string, not an object
        setCurrentTicket(ticketNumber);
      } else {
        console.log("⏸️ No ticket currently serving");
        setCurrentTicket(null);
      }

      // Get next tickets in queue - FIXED: return array of strings, not objects
      const pending = queues
        .filter((q) => String(q.status).toUpperCase() === "WAITING")
        .sort((a, b) => {
          const aIsPriority = /priority|yes|senior|pwd|pregnant/i.test(
            String(a.priority || "")
          );
          const bIsPriority = /priority|yes|senior|pwd|pregnant/i.test(
            String(b.priority || "")
          );
          if (aIsPriority && !bIsPriority) return -1;
          if (!aIsPriority && bIsPriority) return 1;
          return new Date(a.createdAt) - new Date(b.createdAt);
        })
        .slice(0, 3)
        .map((q) => {
          const prefix = q.department?.prefix || departmentPrefix;
          // Return just the ticket number string
          return `${prefix}-${q.number}`;
        });

      console.log("📋 Next tickets:", pending.join(", "));
      setNextTickets(pending);
    }
  }, [queueData, departmentPrefix]);

  // Handle department change
  const handleDepartmentChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedDept = deptData.departments.find(
      (d) => d.departmentId === selectedId
    );
    if (selectedDept) {
      console.log("🔄 Department changed to:", selectedDept.departmentName);
      setDepartmentId(selectedId);
      setDepartmentName(selectedDept.departmentName);
      setDepartmentPrefix(selectedDept.prefix || "");
      setCurrentTicket(null);
      setNextTickets([]);
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
                <div className="current-ticket">
                  {queueLoading ? (
                    <div className="ticket-placeholder">Loading...</div>
                  ) : currentTicket ? (
                    <div className="ticket-number">{currentTicket}</div>
                  ) : (
                    <div className="ticket-placeholder">Waiting for queue...</div>
                  )}
                </div>
              </div>

              <div className="previous-panel">
                <div className="label">Coming Next</div>
                <div className="previous-tickets">
                  {nextTickets.length > 0 ? (
                    nextTickets.map((ticket, index) => (
                      <div key={index} className="previous-ticket">
                        <div className="prev-number">{ticket}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-previous">No upcoming tickets</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ad-section">
            <div className="ad-placeholder">
              <div className="ad-content">
                <span className="ad-text">Advertisement</span>
                <span className="coming-soon">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TVmonitor;