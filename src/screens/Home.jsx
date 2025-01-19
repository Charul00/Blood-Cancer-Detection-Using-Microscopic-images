import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from "../config/axios";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, X } from 'lucide-react';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState([]); // Ensure it's initialized as an empty array
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // State for error message

    const navigate = useNavigate();

    // Function to fetch all projects
    const fetchProjects = async () => {
        try {
            const res = await axios.get('/projects/all');
            console.log('Fetched Projects:', res.data.projects); // Debug log
            // Ensure that the response contains valid projects array
            setProjects(res.data.projects || []);
        } catch (err) {
            console.log(err);
            setErrorMessage('Failed to load projects. Please try again.');
        }
    };

    // Initial fetch of projects
    useEffect(() => {
        fetchProjects();
    }, []);

    // Handle project creation
    const createProject = async (e) => {
        e.preventDefault();
        if (!projectName.trim()) return; // Prevent creating project without a name

        setIsLoading(true);
        setErrorMessage(''); // Clear previous error message

        try {
            const res = await axios.post('/projects/create', {
                name: projectName,
            });
            console.log('Created Project:', res.data.project); // Debug log

            // Update projects list immediately
            setProjects(prevProjects => [...prevProjects, res.data.project]);
            setProjectName('');
            setIsModalOpen(false); // Close modal after successful creation
        } catch (error) {
            console.log(error);
            setErrorMessage('Failed to create project. Please try again.'); // Show error message
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-full h-full">
                    {[...Array(10)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-blue-500/5"
                            style={{
                                width: Math.random() * 200 + 50,
                                height: Math.random() * 200 + 50,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                x: [0, Math.random() * 50 - 25],
                                y: [0, Math.random() * 50 - 25],
                            }}
                            transition={{
                                duration: Math.random() * 10 + 10,
                                repeat: Infinity,
                                repeatType: "reverse",
                            }}
                        />
                    ))}
                </div>
            </div>

            <main className="relative z-10 p-8 container mx-auto max-w-7xl">
                <motion.h1 
                    className="text-3xl font-bold text-slate-900 mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Your Projects
                </motion.h1>

                <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* New Project Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Card 
                            onClick={() => setIsModalOpen(true)}
                            className="h-48 border border-dashed border-slate-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all cursor-pointer flex items-center justify-center"
                        >
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                <Plus className="w-8 h-8 text-blue-600 mb-3" />
                                <span className="text-slate-600 font-medium">New Project</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Project Cards */}
                    {projects.length > 0 ? (
                        projects.map((proj, index) => (
                            <motion.div
                                key={proj._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <Card 
                                    onClick={() => navigate(`/project`, { state: { project: proj } })}
                                    className="h-48 bg-white/80 backdrop-blur-sm hover:bg-white transition-all cursor-pointer group"
                                >
                                    <CardContent className="p-6 h-full flex flex-col">
                                        <h2 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {proj.name}
                                        </h2>
                                        <div className="mt-auto flex items-center text-slate-600">
                                            <Users className="w-4 h-4 mr-2" />
                                            <span className="text-sm">
                                                {proj.users.length} Collaborator{proj.users.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-center text-slate-600">No projects found. Please create a new one.</p>
                    )}
                </motion.div>
            </main>

            {/* Create Project Modal */}
            {isModalOpen && (
                <motion.div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div 
                        className="bg-white rounded-lg shadow-xl w-full max-w-md"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-slate-900">Create New Project</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setProjectName('');
                                }}
                                disabled={isLoading}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <form onSubmit={createProject} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            {/* Display error message */}
                            {errorMessage && (
                                <div className="text-red-600 text-sm mb-4">
                                    <p>{errorMessage}</p>
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setProjectName('');
                                    }}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating...' : 'Create Project'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default Home;
