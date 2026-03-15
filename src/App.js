import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import ProtectedRoute from "./pages/ProtectedRoute";
import Vote from "./pages/Vote";
import Success from "./pages/Success";
import Result from "./pages/Result";
import CandidateDashboard from "./pages/CandidateDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/success" element={<Success />} />
        <Route path="/result" element={<Result />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="/home" element={
          <ProtectedRoute allowedRole="student"><Home /></ProtectedRoute>
        } />

        <Route path="/candidate-dashboard" element={
          <ProtectedRoute allowedRole="candidate"><CandidateDashboard /></ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;