import React, { useState, useEffect, useCallback } from 'react';
import { InternCandidate } from '../../../../types';
import { 
    validateAndParseInternFile, 
    buildValidationResultFromCandidates,
    InternImportValidationResult, 
    ParsedInternItemPreview 
} from '../../../../services/internImportValidator';
import { generateInternCSVTemplate, generateInternJSONTemplate } from '../../../../services/csvService';
import { InternImportGuideModal } from './InternImportGuideModal';
import { InternImportPreviewModal } from './InternImportPreviewModal';
import { InternAiExtractModal } from './InternAiExtractModal';

interface InternImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: Partial<InternCandidate>[]) => Promise<void>;
}

export const InternImportModal: React.FC<InternImportModalProps> = ({
    isOpen,
    onClose,
    onImport
}) => {
    const [stage, setStage] = useState<'GUIDE' | 'PREVIEW'>('GUIDE');
    const [validationResult, setValidationResult] = useState<InternImportValidationResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [baseYear, setBaseYear] = useState<number>(new Date().getFullYear());

    // Reset flow whenever modal is opened
    useEffect(() => {
        if (isOpen) {
            setStage('GUIDE');
            setValidationResult(null);
            setIsProcessing(false);
            setIsSubmitting(false);
            setIsAiModalOpen(false);
        }
    }, [isOpen]);

    // Handle Stage 1 file selection & validation
    const handleProcessFile = useCallback(async (file: File, selectedBaseYear: number) => {
        setIsProcessing(true);
        setBaseYear(selectedBaseYear);

        try {
            const result = await validateAndParseInternFile(file, selectedBaseYear);
            setValidationResult(result);
            setStage('PREVIEW');
        } catch (err: any) {
            console.error('File parsing error:', err);
            throw new Error(err.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // Handle AI Extracted Candidates (Multi-candidate or single from screenshot/chat)
    const handleAiExtracted = useCallback((
        candidate: Partial<InternCandidate>,
        allCandidates?: Partial<InternCandidate>[]
    ) => {
        const candidatesToProcess = allCandidates && allCandidates.length > 0 ? allCandidates : [candidate];
        const result = buildValidationResultFromCandidates(candidatesToProcess, 'AI Smart Ingestion (ภาพ / แชท)', baseYear);
        setValidationResult(result);
        setStage('PREVIEW');
        setIsAiModalOpen(false);
    }, [baseYear]);

    // Download CSV template with BOM
    const handleDownloadCSVTemplate = useCallback(() => {
        const csvContent = generateInternCSVTemplate();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `intern_template_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    // Download JSON template
    const handleDownloadJSONTemplate = useCallback(() => {
        const jsonContent = generateInternJSONTemplate();
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `intern_template_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    // Confirm import from Stage 2
    const handleConfirmImport = useCallback(async (
        validItems: ParsedInternItemPreview[],
        _skipErrors: boolean
    ) => {
        if (validItems.length === 0) return;

        setIsSubmitting(true);
        try {
            const payloads: Partial<InternCandidate>[] = validItems.map(item => item.payload);
            await onImport(payloads);
            onClose();
        } catch (err) {
            console.error('Failed to import intern candidates:', err);
        } finally {
            setIsSubmitting(false);
        }
    }, [onImport, onClose]);

    return (
        <>
            {/* Stage 1: Guide & File Upload Modal */}
            <InternImportGuideModal
                isOpen={isOpen && stage === 'GUIDE'}
                onClose={onClose}
                onProcessFile={handleProcessFile}
                isProcessing={isProcessing}
                onDownloadCSVTemplate={handleDownloadCSVTemplate}
                onDownloadJSONTemplate={handleDownloadJSONTemplate}
                onOpenAiExtract={() => setIsAiModalOpen(true)}
            />

            {/* Stage 2: Interactive Smart Preview & Validation Modal */}
            <InternImportPreviewModal
                isOpen={isOpen && stage === 'PREVIEW'}
                onClose={() => setStage('GUIDE')}
                validationResult={validationResult}
                isSubmitting={isSubmitting}
                onConfirmImport={handleConfirmImport}
                onDownloadTemplate={handleDownloadCSVTemplate}
                baseYear={baseYear}
            />

            {/* Stage 1.5: AI Smart Ingestion Extraction Modal */}
            <InternAiExtractModal
                isOpen={isOpen && isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onExtracted={handleAiExtracted}
                title="AI Smart Ingestion (สกัดข้อมูลเข้าตาราง)"
                description="วางรูปภาพ Resume, แคปหน้าแชท LINE หรือวางข้อความ เพื่อให้ AI สกัดรายชื่อเข้าสู่ Smart Preview"
                applyButtonText="✨ นำเข้าสู่ตารางตรวจสอบ (Stage 2)"
            />
        </>
    );
};

export default InternImportModal;
