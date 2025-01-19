// src/screens/LandingPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Bot, Users, Code, Zap, PlayCircle, Download, ChevronRight, Pen } from 'lucide-react';
import { motion } from 'framer-motion';

const Logo = () => (
  <div className="flex items-center gap-2">
    <motion.div
      initial={{ rotate: -45 }}
      animate={{ rotate: 0 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <Pen className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
    </motion.div>
    <motion.span
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="text-3xl font-bold text-slate-900"
    >
      Kalpataru
    </motion.span>
  </div>
);

const BackgroundPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute w-full h-full">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-500/5"
          style={{
            width: Math.random() * 300 + 50,
            height: Math.random() * 300 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
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
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <Bot className="w-8 h-8 text-blue-500" />,
      title: "Chat with AI",
      description: "Transform your ideas into reality through natural conversations with our intelligent AI assistant."
    },
    {
      icon: <Code className="w-8 h-8 text-green-500" />,
      title: "Create Instantly",
      description: "Watch your website take shape in real-time as you describe your vision - no coding required."
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: "Collaborate Seamlessly",
      description: "Work together with team members in real-time, making decisions and adjustments collectively."
    },
    {
      icon: <PlayCircle className="w-8 h-8 text-orange-500" />,
      title: "Preview & Perfect",
      description: "See instant previews of your website and refine until it matches your vision perfectly."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 relative overflow-hidden">
      <BackgroundPattern />

      {/* Navigation */}
      <nav className="relative z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo />
            <div className="flex gap-4">
              <Button variant="ghost">Features</Button>
              <Button variant="ghost">How It Works</Button>
              <Button variant="ghost">Pricing</Button>
              <Button onClick={handleGetStarted}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl font-bold text-slate-900 mb-6">
              <motion.span
                className="block mb-2"
                animate={{
                  opacity: [0.5, 1],
                  scale: [0.98, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                Chat, Create, Collaborate
              </motion.span>
              <motion.span
                className="text-blue-600 text-5xl block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Craft Your Digital Presence
              </motion.span>
            </h1>

            <motion.p
              className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Transform your ideas into stunning websites through natural conversations.
              No coding required - just chat and watch your vision come to life.
            </motion.p>

            <motion.div
              className="flex justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 relative group"
                onClick={handleGetStarted}
              >
                <motion.span
                  className="absolute inset-0 bg-white opacity-25"
                  animate={{
                    scale: [1, 2],
                    opacity: [0.25, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
                Start Creating Free
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="group">
                See How It Works
                <PlayCircle className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Transform Your Ideas Into Reality
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <CardContent className="p-6">
                    <motion.div
                      className="mb-4"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-20 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-blue-500"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.5) 100%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of creators who are building their digital presence with Kalpataru.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 group relative overflow-hidden"
              onClick={handleGetStarted}
            >
              <motion.span
                className="absolute inset-0 bg-blue-100"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
              <span className="relative">
                Start Your Journey
                <Zap className="ml-2 w-4 h-4 inline-block group-hover:rotate-12 transition-transform" />
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;