
import React from 'react';
import { Skull, LogOut, ShieldAlert, Ghost, XCircle, SkullIcon } from 'lucide-react';
import { User } from '../../types';

interface DeathScreenProps {
    user: User | null;
    onLogout: () => void;
}

const DeathScreen: React.FC<DeathScreenProps> = ({ user, onLogout }) => {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
            
            {/* Dark/Glitchy Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a0b0b_0%,#000000_100%)]"></div>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)', backgroundSize: '100% 4px' }}></div>
            
            {/* Red accent lights */}
            <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-red-900/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-slate-900/40 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
                
                {/* Mission Failed Header */}
                <div className="mb-12 text-center animate-in slide-in-from-top duration-1000">
                    <h2 className="text-red-600 font-black text-6xl md:text-8xl tracking-tighter uppercase mb-2 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] italic">
                        MISSION FAILED
                    </h2>
                    <p className="text-red-500/80 font-bold tracking-[0.5em] uppercase text-xs md:text-sm">
                        Vital Signs Terminated
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-red-900/50 w-full rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] p-10 text-center relative overflow-hidden group animate-in zoom-in-95 duration-700">
                    
                    {/* Inner Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none"></div>

                    <div className="w-28 h-28 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-500/20 relative">
                        <SkullIcon className="w-12 h-12 text-red-600 animate-pulse" />
                        <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all"></div>
                    </div>

                    <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
                        สิ้นสุดระยะการฟื้นฟู 💀
                    </h1>
                    
                    <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                        คุณ <span className="font-bold text-white italic">{user?.name}</span>,<br/>
                        วิญญาณของคุณได้สลายไปอย่างสมบูรณ์เนื่องจาก <span className="text-red-500 font-bold underline decoration-2 underline-offset-4">HP ไม่ได้รับการฟื้นฟูภายใน 7 วันทำการ</span>
                    </p>

                    <div className="bg-black/60 rounded-[2rem] p-6 border border-white/5 mb-10 text-left space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0 border border-red-500/20">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase tracking-wider mb-1">Status: DECEASED</p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    ระบบได้ตั้งสถานะบัญชีของคุณเป็น <span className="text-red-500 font-bold">DEATH</span> ซึ่งถือว่าพ้นสภาพพนักงานโดยสมบูรณ์ในระบบ gamification
                                </p>
                            </div>
                        </div>
                        
                        <div className="h-px bg-white/5 w-full"></div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                                <Ghost className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">Recovery Options</p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    หากต้องการยื่นอุทธรณ์เพื่อขอเกิดใหม่ (Resurrection) กรุณาติดต่อ Grand Master (Admin) โดยตรงเพื่อพิจารณาเป็นกรณีพิเศษ
                                </p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center py-5 px-6 bg-red-600 text-white font-black rounded-2xl hover:bg-white hover:text-black transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 group mb-4"
                    >
                        <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                        ออกจากระบบ (ACCEPT DEFEAT)
                    </button>
                    
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        System Signature: 0xDEADBEEF-777
                    </p>
                </div>

                {/* Dead Man Walking Footnote */}
                <div className="mt-12 flex items-center gap-6 text-slate-700 animate-pulse">
                    <XCircle className="w-4 h-4" />
                    <span className="h-px w-20 bg-slate-800"></span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Game Over</p>
                    <span className="h-px w-20 bg-slate-800"></span>
                    <XCircle className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

export default DeathScreen;
