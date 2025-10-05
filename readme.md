# E-Invoicing Readiness Gap Analyzer

This repository contains a full-stack application developed for the Complyance Full Stack Developer Intern assignment. The application assesses an organization's readiness for e-invoicing compliance, identifying gaps and providing actionable insights.

**Live URL:** [http://einvoicechecker.online/](http://einvoicechecker.online/)  
**Postman Collection:** [Click here](https://.postman.co/workspace/My-Workspace~51915c36-4ea5-4c85-82fc-acd226440e92/request/27634321-7530db8e-f571-4e04-a94b-11698b6cafd9?action=share&creator=27634321&ctx=documentation)

---

## **API Routes**

| Method | Route        | Description                                 |
| ------ | ------------ | ------------------------------------------- |
| POST   | /upload      | Upload an invoice file for analysis         |
| POST   | /analyze     | Analyze uploaded data and generate insights |
| GET    | /report/{id} | Get a single report                         |
| GET    | /reports     | Get all reports                             |
| GET    | /health      | Check server and database health            |

☁️ The live server is hosted on a small 512MB Digital Ocean droplet. The app can scale easily in the cloud without limitations.

---

## 🛠️ Project Structure

The project is organized into two main directories:

- **`frontend/`**: Contains the React.js application for the user interface.
- **`backend/`**: Hosts the Express.js server, API routes, and MongoDB integration.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Prethish-Kumar/E-Invoicing-Readiness-Gap-Analyzer.git
cd E-Invoicing-Readiness-Gap-Analyzer
```

### 2. Set Up the Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Build the React application:

```bash
npm run build
```

> **Note:** You do not need to start the React server. The Express backend serves the built files in production.

---

### 3. Set Up the Backend

1. Navigate to the backend directory:

```bash
cd ../backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/your_database_name
```

4. Ensure MongoDB is running locally or provide a remote URI in `.env`.

5. Start the backend server:

```bash
node index.js
```

> The server will automatically serve the React frontend build and API routes.

---

## 📄 Features

- **E-Invoicing Compliance Assessment:** Evaluate your organization's readiness for mandatory e-invoicing.
- **Gap Analysis:** Identify areas where compliance measures are missing or incomplete.
- **Actionable Insights:** Receive practical recommendations to bridge compliance gaps.
- **Report Management:** Upload invoices, analyze, and fetch detailed reports.

---

## ⚙️ Technologies Used

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Environment Variables:** `.env` for configuration
- **Deployment:** Digital Ocean Droplet, can scale to cloud services

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Useful Links

- **Live App:** [http://einvoicechecker.online/](http://einvoicechecker.online/)
- **Postman Collection:** [Click here](https://.postman.co/workspace/My-Workspace~51915c36-4ea5-4c85-82fc-acd226440e92/request/27634321-7530db8e-f571-4e04-a94b-11698b6cafd9?action=share&creator=27634321&ctx=documentation)
- **Complyance:** [Company Website](https://complyance.io)
