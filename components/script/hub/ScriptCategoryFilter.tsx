import React from 'react';
import { MasterOption } from '../../../types';
import { motion, LayoutGroup } from 'framer-motion';
import { Trash2, Layers } from 'lucide-react';

interface ScriptCategoryFilterProps {
  categories: MasterOption[];
  value: string; 
  onChange: (val: string) => void;
}

const ScriptCategoryFilter: React.FC<ScriptCategoryFilterProps> = ({
  categories,
  value,
  onChange
}) => {
  const clear = () => onChange('ALL');
  const isAll = !value || value === 'ALL';

  const ordered = [...categories].sort((a, b) => {
    if (a.key === value) return 1;
    if (b.key === value) return -1;
    return 0;
  });

  const selected = value
    ? categories.find(c => c.key === value)
    : null;

return (
  <LayoutGroup>
    <div className="w-full py-4">

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:flex items-center gap-6">

        <button
          onClick={!isAll ? clear : undefined}
          disabled={isAll}
          className={`
            text-[10px] font-black uppercase tracking-widest
            px-4 py-2 rounded-xl border transition-all duration-500 min-w-[110px]
            ${!isAll
              ? 'bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 border-indigo-200'
              : 'bg-white/50 text-gray-400 border-gray-100 opacity-60'
            }
          `}
        >
          {!isAll
            ? <> <Trash2 className="w-3.5 h-3.5 mr-2 inline animate-pulse" /> Clear </>
            : <> <Layers className="w-3.5 h-3.5 mr-2 inline opacity-50" /> Categories </>
          }
        </button>

        <motion.div layout className="flex items-center gap-3">
          {ordered.map((cat) => {
            const isActive = cat.key === value;

            return (
              <motion.button
                key={cat.key}
                layout
                layoutId={`category-${cat.key}`}
                onClick={() => onChange(cat.key)}
                whileHover={{ scale: 1.08, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              >
                <div
                  className={`
                    px-6 py-3 rounded-xl font-black text-sm shadow-lg
                    ${isActive
                      ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700'
                    }
                  `}
                >
                  {cat.label}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

      </div>

      {/* ================= MOBILE ================= */}
        <div className="md:hidden">
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div className="flex overflow-x-auto gap-3 px-1 pb-2 no-scrollbar">

            {categories.map((cat) => {
            const isActive = cat.key === value;

            return (
                <motion.button
                key={cat.key}
                onClick={() => onChange(cat.key)}
                className="relative shrink-0"
                whileTap={{ scale: 0.94 }}
                >
                {/* Active Background */}
                {isActive && (
                    <motion.div
                    layoutId="mobile-active-bg"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 shadow-md"
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 40
                    }}
                    />
                )}

                {/* Capsule */}
                <div
                    className={`
                    relative z-10 px-5 py-2 rounded-full text-sm font-black
                    transition-colors duration-300
                    ${
                        isActive
                        ? 'text-white'
                        : 'bg-gray-100 border border-gray-200 text-gray-700'
                    }
                    `}
                >
                    {cat.label}
                </div>
                </motion.button>
            );
            })}

        </div>

        </div>

    </div>
  </LayoutGroup>
);
};

export default ScriptCategoryFilter;