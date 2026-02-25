import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Booking from './pages/Booking';
import Buildings from './pages/Buildings';
import Floors from './pages/Floors';
import DeskAssignments from './pages/DeskAssignments';

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/resources"
                    element={
                        <ProtectedRoute>
                            <Resources />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/resources/:id"
                    element={
                        <ProtectedRoute>
                            <ResourceDetail />
                        </ProtectedRoute>
                    }
                />

                {/* NEW BOOKINGS ROUTE */}
                <Route
                    path="/bookings"
                    element={
                        <ProtectedRoute>
                            <Booking />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/buildings"
                    element={
                        <ProtectedRoute>
                            <Buildings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/floors"
                    element={
                        <ProtectedRoute>
                            <Floors />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/desk-assignments"
                    element={
                        <ProtectedRoute>
                            <DeskAssignments />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </Router>
    );
}

export default App;
