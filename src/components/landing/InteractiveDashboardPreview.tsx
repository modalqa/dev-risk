'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Bell, 
  Zap,
  Target,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface Hotspot {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const hotspots: Hotspot[] = [
  {
    id: 'risk-index',
    x: 8,
    y: 18,
    icon: <Shield className="w-4 h-4" />,
    title: 'Risk Index Score',
    description: 'Real-time overall risk score calculated from multiple factors including release stability, test coverage, and deployment frequency.',
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'trend-chart',
    x: 35,
    y: 45,
    icon: <TrendingUp className="w-4 h-4" />,
    title: 'Risk Trend Analysis',
    description: '30-day visualization of risk index vs engineering stability. Track improvements and identify patterns over time.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'high-risk',
    x: 78,
    y: 45,
    icon: <AlertTriangle className="w-4 h-4" />,
    title: 'High-Risk Releases',
    description: 'Instantly identify releases with risk index ≥50. Click to drill down into specific risk factors and mitigation steps.',
    color: 'from-amber-500 to-red-500',
  },
  {
    id: 'notifications',
    x: 92,
    y: 5,
    icon: <Bell className="w-4 h-4" />,
    title: 'Smart Notifications',
    description: 'Real-time alerts for risk threshold breaches, deployment issues, and AI-generated recommendations.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'heatmap',
    x: 20,
    y: 75,
    icon: <Target className="w-4 h-4" />,
    title: 'User Journey Heatmap',
    description: 'Visualize risk across your user journey flows. Quickly identify high-friction areas and conversion bottlenecks affecting user experience.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'correlations',
    x: 65,
    y: 75,
    icon: <Activity className="w-4 h-4" />,
    title: 'Risk Correlations',
    description: 'AI-discovered correlations between engineering signals and incidents. Understand what factors actually drive risk in your system.',
    color: 'from-violet-500 to-purple-500',
  },
];

export default function InteractiveDashboardPreview() {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div 
      className="relative rounded-xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveHotspot(null);
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
      
      {/* Main image */}
      <Image
        src="/ast-lp1.png"
        alt="DevRisk AI Dashboard - Risk Intelligence Overview"
        width={1920}
        height={1080}
        className="w-full h-auto"
        priority
      />

      {/* Hotspots */}
      <AnimatePresence>
        {isHovering && hotspots.map((hotspot) => (
          <motion.div
            key={hotspot.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: hotspots.indexOf(hotspot) * 0.05,
              type: 'spring',
              stiffness: 500,
              damping: 30
            }}
            className="absolute z-20"
            style={{ 
              left: `${hotspot.x}%`, 
              top: `${hotspot.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Pulse ring animation */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${hotspot.color} opacity-30`}
              animate={{ 
                scale: [1, 1.8, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{ width: 40, height: 40, marginLeft: -20, marginTop: -20 }}
            />

            {/* Hotspot button */}
            <motion.button
              className={`relative w-10 h-10 rounded-full bg-gradient-to-r ${hotspot.color} 
                flex items-center justify-center text-white shadow-lg cursor-pointer
                hover:scale-110 transition-transform`}
              onClick={() => setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {hotspot.icon}
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
              {activeHotspot === hotspot.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute z-30 w-72 p-4 rounded-xl bg-surface-2/95 backdrop-blur-sm 
                    border border-border shadow-xl ${
                      hotspot.x > 50 ? 'right-full mr-4' : 'left-full ml-4'
                    } ${hotspot.y > 50 ? 'bottom-0' : 'top-0'}`}
                >
                  <div className={`flex items-center gap-2 mb-2`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${hotspot.color} 
                      flex items-center justify-center text-white`}>
                      {hotspot.icon}
                    </div>
                    <h4 className="font-semibold text-white text-sm">{hotspot.title}</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {hotspot.description}
                  </p>
                  
                  {/* Arrow pointer */}
                  <div 
                    className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 
                      border-y-8 border-y-transparent ${
                        hotspot.x > 50 
                          ? 'right-0 translate-x-full border-l-8 border-l-surface-2/95' 
                          : 'left-0 -translate-x-full border-r-8 border-r-surface-2/95'
                      }`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Instruction hint */}
      <AnimatePresence>
        {!isHovering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 
              bg-surface-2/90 backdrop-blur-sm px-4 py-2 rounded-full 
              border border-border/50 shadow-lg"
          >
            <p className="text-sm text-gray-300 flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ✨
              </motion.span>
              Hover to explore features
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
