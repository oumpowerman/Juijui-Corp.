
import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  buttonText = "ตกลง" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-300 text-center border-4 border-purple-50">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-green-50 animate-bounce-slow">
                <Check className="w-10 h-10 text-green-600 stroke-[3px]" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-800 mb-2">{title}</h3>
            <div className="text-gray-500 mb-8 leading-relaxed text-sm">
                {description}
            </div>

            <button 
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:shadow-purple-300 active:scale-95 transition-all flex items-center justify-center"
            >
                {buttonText} <ArrowRight className="w-4 h-4 ml-2" />
            </button>
        </div>
    </div>
  );
};

export default SuccessModal;
