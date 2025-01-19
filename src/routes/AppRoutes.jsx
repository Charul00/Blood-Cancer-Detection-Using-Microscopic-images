import React from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Home from '../screens/Home';
import Project from '../screens/Project';
import UserAuth from '../auth/UserAuth';

// If you have a LandingPage component, import it here
import LandingPage from '../screens/LandingPage'; // Assuming it's defined in the 'screens' folder

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* LandingPage route */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* Wrapping Project route inside UserAuth for authentication */}
                <Route path="/project" element={<UserAuth><Project /></UserAuth>} />
                {/* You can also add other routes like /home if needed */}
                <Route path="/home" element={<Home />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
