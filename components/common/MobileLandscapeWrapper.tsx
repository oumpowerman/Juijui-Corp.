import React, { useEffect, useState } from "react";
import { RotateCcw, Smartphone, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isActive: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MobileLandscapeWrapper: React.FC<Props> = ({
  isActive,
  onClose,
  children,
}) => {
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    
    if (isActive) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      document.body.style.overflow = '';
    };
  }, [isActive]);

  return (
    <>
      {!isActive && children}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-white flex flex-col"
          >
            {isPortrait ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
              >
                {/* Decorative Pastel Blobs */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 20, 0],
                    y: [0, -20, 0]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-20 -left-20 w-64 h-64 bg-rose-100/50 rounded-full blur-3xl"
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, -120, 0],
                    x: [0, -30, 0],
                    y: [0, 40, 0]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl"
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    x: [0, 50, 0],
                    y: [0, 50, 0]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/4 -right-10 w-40 h-40 bg-amber-100/40 rounded-full blur-2xl"
                />

                <div className="relative z-10 flex flex-col items-center">
                  {/* Playful Phone Animation */}
                  <div className="relative mb-12">
                    <motion.div 
                      animate={{ 
                        rotate: [0, 90, 90, 0],
                        y: [0, -10, -10, 0]
                      }}
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity, 
                        ease: "easeInOut", 
                        times: [0, 0.4, 0.6, 1] 
                      }}
                      className="relative z-10"
                    >
                      <div className="w-20 h-36 border-[6px] border-gray-800 rounded-[2.5rem] bg-white shadow-2xl relative flex items-center justify-center overflow-hidden">
                        <div className="w-12 h-1 bg-gray-100 rounded-full absolute top-4" />
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="w-6 h-1 bg-gray-800 rounded-full absolute bottom-4" />
                      </div>
                    </motion.div>
                    
                    {/* Floating Arrows */}
                    <motion.div
                      animate={{ opacity: [0, 1, 0], x: [20, 40, 20] }}
                      transition={{ duration: 2.5, repeat: Infinity, times: [0.3, 0.5, 0.7] }}
                      className="absolute top-1/2 -right-12 text-rose-400"
                    >
                      <ArrowRightLeft className="w-8 h-8 rotate-45" />
                    </motion.div>
                  </div>
                  
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500 mb-4"
                  >
                    หมุนจอเพื่อเริ่มสนุก!
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-500 mb-10 max-w-[260px] leading-relaxed font-medium"
                  >
                    วางโทรศัพท์ในแนวนอน <br/>
                    เพื่อเปิดมุมมองปฏิทินแบบกว้างขวางครับ ✨
                  </motion.p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-10 py-4 bg-white text-gray-500 rounded-full font-bold shadow-lg border border-gray-100 hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    กลับไปก่อน
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col relative overflow-hidden"
              >
                <button
                  onClick={onClose}
                  className="fixed top-4 right-4 z-[510] bg-white/90 backdrop-blur-md shadow-xl p-3 rounded-full border border-white/50 text-gray-600 active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileLandscapeWrapper;