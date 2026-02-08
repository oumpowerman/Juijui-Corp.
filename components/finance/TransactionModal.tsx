
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Users } from 'lucide-react';
import { MasterOption, TransactionType, AssetType, Task, User, Channel } from '../../types';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { format } from 'date-fns';

// Import Parts
import TransactionTypeSelector from './form-parts/TransactionTypeSelector';
import AmountDateInput from './form-parts/AmountDateInput';
import CategorySelector from './form-parts/CategorySelector';
import ProjectLinker from './form-parts/ProjectLinker';
import AssetTypeSelector from './form-parts/AssetTypeSelector';
import TaxForm from './form-parts/TaxForm';
import ReceiptUploader from './form-parts/ReceiptUploader';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<boolean>;
    masterOptions: MasterOption[];
    projects: Task[];
    users?: User[]; // New
    channels?: Channel[]; // New
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
    isOpen, onClose, onSave, masterOptions, projects, users = [], channels = []
}) => {
    // Basic Form State
    const [type, setType] = useState<TransactionType>('EXPENSE');
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [categoryKey, setCategoryKey] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('');
    const [assetType, setAssetType] = useState<AssetType>('NONE');
    const [receiptUrl, setReceiptUrl] = useState('');
    
    // Target User (For Salary)
    const [targetUserId, setTargetUserId] = useState('');
    
    // Tax State
    const [hasVat, setHasVat] = useState(false);
    const [whtRate, setWhtRate] = useState(0);
    const [entityName, setEntityName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [taxInvoiceNo, setTaxInvoiceNo] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Google Drive Hook
    const { uploadFileToDrive, isReady: isDriveReady, isUploading } = useGoogleDrive();

    // Derived Values (Tax Calc)
    const { vatAmount, whtAmount, netAmount, baseVal } = useMemo(() => {
        const base = parseFloat(amount) || 0;
        const vat = hasVat ? base * 0.07 : 0;
        const wht = whtRate > 0 ? base * (whtRate / 100) : 0;
        // Logic: Usually for Expenses -> Payment = Base + Vat - WHT
        // For Income -> Receive = Base + Vat - WHT
        const net = base + vat - wht;
        
        return {
            baseVal: base,
            vatAmount: vat,
            whtAmount: wht,
            netAmount: net
        };
    }, [amount, hasVat, whtRate]);

    // Reset on Open
    useEffect(() => {
        if(isOpen) {
            setType('EXPENSE');
            setName('');
            setAmount('');
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setCategoryKey('');
            setDescription('');
            setProjectId('');
            setAssetType('NONE');
            setReceiptUrl('');
            setTargetUserId('');
            
            // Tax Reset
            setHasVat(false);
            setWhtRate(0);
            setEntityName('');
            setTaxId('');
            setTaxInvoiceNo('');
        }
    }, [isOpen]);

    // Filter Categories
    const categories = masterOptions
        .filter(o => o.type === (type === 'INCOME' ? 'FINANCE_IN_CAT' : 'FINANCE_OUT_CAT') && o.isActive)
        .sort((a,b) => a.sortOrder - b.sortOrder);

    // Check if category is Salary to show user picker
    const isSalary = categoryKey === 'SALARY';

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const currentMonth = format(new Date(), 'yyyy-MM');
            uploadFileToDrive(file, (res) => {
                setReceiptUrl(res.thumbnailUrl || res.url);
            }, ['Finance_Receipts', currentMonth]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount || !categoryKey) {
            alert('กรุณากรอกข้อมูลสำคัญให้ครบ (ชื่อ, จำนวนเงิน, หมวดหมู่)');
            return;
        }

        setIsSubmitting(true);
        const success = await onSave({
            type,
            name,
            amount: baseVal,
            date: new Date(date),
            categoryKey,
            description,
            projectId: projectId || undefined,
            assetType,
            receiptUrl: receiptUrl || undefined,
            targetUserId: targetUserId || undefined, // Send target user
            
            // Tax Data
            vatRate: hasVat ? 7 : 0,
            vatAmount: vatAmount,
            whtRate: whtRate,
            whtAmount: whtAmount,
            netAmount: netAmount,
            taxInvoiceNo: taxInvoiceNo || undefined,
            entityName: entityName || undefined,
            taxId: taxId || undefined
        });
        setIsSubmitting(false);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                
                <TransactionTypeSelector 
                    type={type} 
                    setType={setType} 
                    onResetCategory={() => setCategoryKey('')} 
                    onClose={onClose}
                />

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6 bg-[#f8fafc] scrollbar-thin">
                    
                    <AmountDateInput 
                        amount={amount} setAmount={setAmount}
                        date={date} setDate={setDate}
                        netAmount={netAmount}
                        showNet={hasVat || whtRate > 0}
                    />

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">รายการ (Name)</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl outline-none text-sm font-bold text-gray-800 focus:border-indigo-400 transition-all"
                                placeholder={type === 'INCOME' ? "เช่น ค่าจ้าง Project A..." : "เช่น ค่าอาหาร, ค่ารถ..."}
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <CategorySelector 
                            categories={categories}
                            categoryKey={categoryKey}
                            setCategoryKey={setCategoryKey}
                        />

                        {/* Salary User Selector */}
                        {isSalary && users.length > 0 && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-red-500 uppercase mb-2 flex items-center">
                                    <Users className="w-3 h-3 mr-1"/> จ่ายให้ใคร? (Receiver)
                                </label>
                                <select 
                                    className="w-full px-3 py-2 bg-white border border-red-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-red-400 cursor-pointer"
                                    value={targetUserId}
                                    onChange={e => setTargetUserId(e.target.value)}
                                >
                                    <option value="">-- เลือกพนักงาน --</option>
                                    {users.filter(u => u.isActive).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {type === 'EXPENSE' && (
                        <>
                            <AssetTypeSelector 
                                assetType={assetType}
                                setAssetType={setAssetType}
                            />

                            <ProjectLinker 
                                projectId={projectId} setProjectId={setProjectId}
                                projects={projects}
                                channels={channels} // Pass channels
                            />
                        </>
                    )}
                    
                    <TaxForm 
                        hasVat={hasVat} setHasVat={setHasVat}
                        whtRate={whtRate} setWhtRate={setWhtRate}
                        entityName={entityName} setEntityName={setEntityName}
                        taxId={taxId} setTaxId={setTaxId}
                        taxInvoiceNo={taxInvoiceNo} setTaxInvoiceNo={setTaxInvoiceNo}
                        baseAmount={baseVal}
                        vatAmount={vatAmount}
                        whtAmount={whtAmount}
                        netAmount={netAmount}
                    />

                    <ReceiptUploader 
                        receiptUrl={receiptUrl}
                        setReceiptUrl={setReceiptUrl}
                        isUploading={isUploading}
                        isDriveReady={isDriveReady}
                        onFileChange={handleFileUpload}
                    />
                </form>

                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 transition-colors">ยกเลิก</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || isUploading}
                        className={`px-8 py-3 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 ${type === 'INCOME' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                    >
                        {isSubmitting ? 'กำลังบันทึก...' : <><Check className="w-5 h-5"/> บันทึกรายการ</>}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default TransactionModal;
