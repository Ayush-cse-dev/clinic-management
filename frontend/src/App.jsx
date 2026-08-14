import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Prescriptions from "./pages/Prescriptions";
import MedicalRecords from "./pages/MedicalRecords";
import Billing from "./pages/Billing";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute roles={["admin", "receptionist", "doctor"]} />
                }
              >
                <Route index element={<Patients />} />
              </Route>
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route
                path="/prescriptions"
                element={<ProtectedRoute roles={["admin", "doctor", "patient"]} />}
              >
                <Route index element={<Prescriptions />} />
              </Route>
              <Route
                path="/medical-records"
                element={<ProtectedRoute roles={["admin", "doctor", "patient"]} />}
              >
                <Route index element={<MedicalRecords />} />
              </Route>
              <Route
                path="/billing"
                element={<ProtectedRoute roles={["admin", "receptionist", "patient"]} />}
              >
                <Route index element={<Billing />} />
              </Route>
              <Route path="/documents" element={<Documents />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
