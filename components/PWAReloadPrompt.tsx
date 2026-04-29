
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

function PWAReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
           initial={{ y: 100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: 100, opacity: 0 }}
           className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] p-4 min-w-[300px]"
        >
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-slate-900 font-extrabold text-lg">
                  {offlineReady ? 'พร้อมใช้งานแบบ Offline!' : 'มีการอัปเดตใหม่!'}
                </h4>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  {offlineReady 
                    ? 'แอปนี้พร้อมใช้งานแม้ไม่มีอินเทอร์เน็ต' 
                    : 'เวอร์ชันใหม่พร้อมให้ใช้งานแล้ว กดรีเฟรชเพื่ออัปเดต'}
                </p>
              </div>
              <button 
                onClick={close}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {needRefresh && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateServiceWorker(true)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:brightness-110 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                อัปเดตเดี๋ยวนี้
              </motion.button>
            )}

            {offlineReady && !needRefresh && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={close}
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm border border-emerald-100 transition-all"
              >
                ตกลง
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PWAReloadPrompt;
