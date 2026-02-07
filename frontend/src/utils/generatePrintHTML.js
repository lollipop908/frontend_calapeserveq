const generatePrintHTML = (queueData) => {
    // Extract data from queue object
    const {
        number,           // queue number
        department,       // department object
        service,          // service object
        priority,         // priority status
        createdAt,        // creation timestamp
        counter          // counter object (optional)
    } = queueData;

    // Format date and time
    const queueDate = new Date(createdAt);
    const formattedDate = queueDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const formattedTime = queueDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    // Get department info
    const departmentName = department?.departmentName || 'N/A';
    const prefix = department?.prefix || '';

    // Get service info
    const serviceName = service?.serviceName || 'General Service';

    // Format queue number with prefix
    const displayNumber = `${prefix}${number}`;

    // Priority badge
    const priorityBadge = priority ?
        '<div class="priority-badge">PRIORITY</div>' : '';

    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Queue Ticket - ${displayNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          background: white;
          color: #000;
          padding: 20px;
          line-height: 1.6;
        }
        
        .ticket-container {
          max-width: 380px;
          margin: 0 auto;
          border: 3px solid #000;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          background: #fff;
          position: relative;
        }
        
        .header {
          border-bottom: 2px dashed #000;
          padding-bottom: 18px;
          margin-bottom: 20px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .logo-circle {
          width: 50px;
          height: 50px;
          border: 3px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          color: #000;
        }
        
        .system-name {
          font-size: 22px;
          font-weight: bold;
          color: #000;
          letter-spacing: 1px;
        }
        
        .municipality {
          font-size: 14px;
          color: #333;
          margin-top: 5px;
          font-weight: 500;
        }
        
        .priority-badge {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
          letter-spacing: 1px;
        }
        
        .queue-section {
          margin: 20px 0;
          padding: 25px 15px;
          background: #f5f5f5;
          border-radius: 10px;
          border: 2px solid #000;
        }
        
        .queue-label {
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .queue-number {
          font-size: 56px;
          font-weight: bold;
          color: #000;
          margin: 10px 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          letter-spacing: 2px;
        }
        
        .details {
          margin-top: 20px;
          text-align: left;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 15px;
          margin: 8px 0;
          background: #fafafa;
          border-left: 3px solid #000;
          border-radius: 4px;
        }
        
        .detail-label {
          font-weight: bold;
          color: #000;
          font-size: 13px;
        }
        
        .detail-value {
          color: #333;
          font-size: 13px;
          text-align: right;
          max-width: 60%;
        }
        
        .instructions {
          margin-top: 20px;
          padding: 15px;
          background: #000;
          color: #fff;
          border-radius: 8px;
          font-size: 13px;
          font-weight: bold;
          line-height: 1.8;
        }
        
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px dashed #000;
          font-size: 11px;
          color: #666;
          line-height: 1.6;
        }
        
        .footer p {
          margin: 4px 0;
        }
        
        .ticket-number {
          position: absolute;
          top: 10px;
          right: 15px;
          font-size: 10px;
          color: #999;
          font-family: 'Courier New', monospace;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 10px; 
          }
          .ticket-container { 
            box-shadow: none;
            border: 2px solid #000;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <div class="ticket-number">#${displayNumber}</div>
        
        <div class="header">
          <div class="logo-section">
            <div class="logo-circle">C</div>
            <div>
              <div class="system-name">CalapeServeQ</div>
            </div>
          </div>
          <div class="municipality">Municipality of Calape</div>
          ${priorityBadge}
        </div>

        <div class="queue-section">
          <div class="queue-label">Your Queue Number</div>
          <div class="queue-number">${displayNumber}</div>
        </div>

        <div class="details">
          <div class="detail-item">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${formattedTime}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Department:</span>
            <span class="detail-value">${departmentName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Service:</span>
            <span class="detail-value">${serviceName}</span>
          </div>
          ${counter ? `
          <div class="detail-item">
            <span class="detail-label">Counter:</span>
            <span class="detail-value">${counter.counterName}</span>
          </div>
          ` : ''}
        </div>

        <div class="instructions">
          PLEASE BE SEATED<br>
          WAIT FOR YOUR NUMBER TO BE CALLED<br>
          THANK YOU FOR YOUR PATIENCE
        </div>

        <div class="footer">
          <p><strong>Important:</strong> Please keep this ticket until you are served</p>
          <p>For assistance, please approach the information desk</p>
          <p>Thank you for visiting Municipality of Calape</p>
        </div>
      </div>
      
      <script>
        // Auto-print when page loads
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
  </html>
  `;
};

export default generatePrintHTML;