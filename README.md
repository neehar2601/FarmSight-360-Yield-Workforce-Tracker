# FarmSight-360: Yield & Workforce Tracker

## 1. Overview

### Purpose
This project aims to develop a comprehensive cloud-based, loosely coupled, three-tier web application to help farmers and agriculturists manage all aspects of farm operations, including yield tracking, financial management, worker attendance, fertiliser usage, weather data, equipment management, and compliance tracking. A mobile application will be developed in future phases.

### Objectives
- Centralize agricultural data storage and access across all farm operations
- Enable multi-produce management with separate and aggregated reporting
- Integrate weather forecasts, historical trends, and predictive analytics for informed decision-making
- Provide secure, scalable, cloud-based architecture with comprehensive farm management capabilities
- Support data-driven farming decisions through advanced analytics and reporting
- Ensure compliance with agricultural regulations and food safety standards

---

## 2. System Architecture

- **Deployment:** Cloud infrastructure (AWS / Azure / GCP)
- **Architecture Type:** Loosely coupled, three-tier design
  - **Presentation Tier**  Responsive web interface (HTML5, CSS3, JavaScript, PWA capabilities
  - **Application Tier**  Backend logic, APIs, and microservices
  - **Data Tier**  Database (SQL/NoSQL hybrid), data lake for analytics
- **API-Based Modules** for future mobile integration and third-party integrations
- **Microservices Architecture** for scalability and maintainability
- **Load Balancing** and auto-scaling capabilities
- **Content Delivery Network (CDN)** for optimal performance
---
## 🚀 How to Run the Application

Follow the steps below to set up and run the application locally:

```bash
# Clone the repository
git clone https://github.com/neehar2601/FarmSight-360-Yield-Workforce-Tracker

# Navigate to the project directory
cd <project-folder>

# Install dependencies
npm install

# Start the development server
npm run dev
```
###Once the browser starts:

```bash
http://localhost:5173
```
