import React, { useState, useMemo, useEffect } from 'react';
import { Company } from '../../../../types';
import { useCompanies } from '../../../../hooks/useCompanies';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { useToast } from '../../../../context/ToastContext';
import { useUserSession } from '../../../../context/UserSessionContext';
import { useMasterData } from '../../../../hooks/useMasterData';
import { getSuperApproverUserIds } from '../../../../utils/adminApprovalHelpers';
import { 
    COMPANY_COLOR_PRESETS,
    CompanyHeaderBanner,
    CompanyFilterBar,
    CompanyGrid,
    SuperApproversSection,
    CompanyFormModal,
    CompanyFormData
} from './company';

// Re-export for backward compatibility
export { COMPANY_COLOR_PRESETS };

const CompanyMasterView: React.FC = () => {
    const { companies, isLoading, addCompany, updateCompany, deleteCompany } = useCompanies();
    const { masterOptions, addMasterOption, updateMasterOption } = useMasterData();
    const { allUsers } = useUserSession();
    const { showConfirm } = useGlobalDialog();
    const { showToast } = useToast();

    // Local filter and search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

    // Super Approver State (Group Executives who can approve across all companies)
    const [selectedSuperApproverIds, setSelectedSuperApproverIds] = useState<string[]>([]);
    const [isSavingSuperApprovers, setIsSavingSuperApprovers] = useState(false);

    // Filter all system admins
    const allAdminUsers = useMemo(() => {
        return allUsers.filter(u => u.role === 'ADMIN');
    }, [allUsers]);

    // Load initial super approvers from masterOptions
    useEffect(() => {
        const ids = getSuperApproverUserIds(masterOptions);
        setSelectedSuperApproverIds(ids);
    }, [masterOptions]);

    const superApproverAdmins = useMemo(() => {
        return allAdminUsers.filter(u => selectedSuperApproverIds.includes(u.id));
    }, [allAdminUsers, selectedSuperApproverIds]);

    const handleRemoveSuperApprover = (userId: string) => {
        setSelectedSuperApproverIds(prev => prev.filter(id => id !== userId));
    };

    const handleSaveSuperApprovers = async () => {
        setIsSavingSuperApprovers(true);
        try {
            const existing = masterOptions.find(o => o.type === 'COMPANY_CONFIG' && o.key === 'SUPER_APPROVER_USER_IDS');
            const payloadString = JSON.stringify(selectedSuperApproverIds);
            
            if (existing) {
                await updateMasterOption({
                    ...existing,
                    label: 'Super Approver User IDs',
                    description: payloadString,
                    isActive: true
                });
            } else {
                await addMasterOption({
                    type: 'COMPANY_CONFIG',
                    key: 'SUPER_APPROVER_USER_IDS',
                    label: 'Super Approver User IDs',
                    color: 'amber',
                    description: payloadString,
                    isActive: true,
                    sortOrder: 1
                });
            }
            showToast('บันทึกรายชื่อผู้บริหารที่มีสิทธิ์อนุมัติข้ามบริษัทเรียบร้อยแล้ว', 'success');
        } catch (error) {
            console.error('Failed to save super approvers:', error);
            showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        } finally {
            setIsSavingSuperApprovers(false);
        }
    };

    // Modal / Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState<CompanyFormData>({
        name: '',
        shortName: '',
        code: '',
        description: '',
        color: COMPANY_COLOR_PRESETS[0].class,
        isActive: true,
        sortOrder: 1
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Active counts
    const activeCount = useMemo(() => companies.filter(c => c.isActive).length, [companies]);
    const inactiveCount = useMemo(() => companies.length - activeCount, [companies, activeCount]);

    // Filtered companies
    const filteredCompanies = useMemo(() => {
        return companies.filter(c => {
            const matchesSearch = 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.shortName && c.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (statusFilter === 'ACTIVE' && !c.isActive) return false;
            if (statusFilter === 'INACTIVE' && c.isActive) return false;

            return true;
        });
    }, [companies, searchQuery, statusFilter]);

    // Open add form
    const handleOpenAdd = () => {
        setEditingCompany(null);
        setFormData({
            name: '',
            shortName: '',
            code: '',
            description: '',
            color: COMPANY_COLOR_PRESETS[companies.length % COMPANY_COLOR_PRESETS.length].class,
            isActive: true,
            sortOrder: companies.length + 1
        });
        setIsFormOpen(true);
    };

    // Open edit form
    const handleOpenEdit = (company: Company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            shortName: company.shortName || '',
            code: company.code || '',
            description: company.description || '',
            color: company.color || COMPANY_COLOR_PRESETS[0].class,
            isActive: company.isActive ?? true,
            sortOrder: company.sortOrder || 1
        });
        setIsFormOpen(true);
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showToast('กรุณาระบุชื่อบริษัท', 'warning');
            return;
        }

        if (!formData.shortName.trim()) {
            showToast('กรุณาระบุชื่อย่อบริษัท (เช่น JJ, JP)', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingCompany) {
                const res = await updateCompany(editingCompany.id, {
                    name: formData.name.trim(),
                    shortName: formData.shortName.trim().toUpperCase(),
                    code: formData.code.trim().toUpperCase() || formData.shortName.trim().toUpperCase(),
                    description: formData.description.trim(),
                    color: formData.color,
                    isActive: formData.isActive,
                    sortOrder: Number(formData.sortOrder) || 1
                });
                if (res) {
                    showToast('อัปเดตข้อมูลบริษัทสำเร็จ! ✨', 'success');
                    setIsFormOpen(false);
                } else {
                    showToast('ไม่สามารถอัปเดตข้อมูลบริษัทได้', 'error');
                }
            } else {
                const res = await addCompany({
                    name: formData.name.trim(),
                    shortName: formData.shortName.trim().toUpperCase(),
                    code: formData.code.trim().toUpperCase() || formData.shortName.trim().toUpperCase(),
                    description: formData.description.trim(),
                    color: formData.color,
                    isActive: formData.isActive,
                    sortOrder: Number(formData.sortOrder) || 1
                });
                if (res) {
                    showToast('เพิ่มบริษัทในเครือสำเร็จ! 🏢✨', 'success');
                    setIsFormOpen(false);
                } else {
                    showToast('ไม่สามารถเพิ่มบริษัทได้', 'error');
                }
            }
        } catch (err: any) {
            console.error('Submit company error:', err);
            showToast('เกิดข้อผิดพลาด: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle active
    const handleToggleActive = async (company: Company) => {
        const nextState = !company.isActive;
        const res = await updateCompany(company.id, { isActive: nextState });
        if (res) {
            showToast(nextState ? `เปิดใช้งานบริษัท ${company.name} แล้ว` : `ปิดใช้งานบริษัท ${company.name} แล้ว`, 'info');
        }
    };

    // Delete company
    const handleDelete = async (company: Company) => {
        const confirmed = await showConfirm(
            `คุณแน่ใจหรือไม่ว่าต้องการลบบริษัท "${company.name}" (${company.shortName})? หากมีพนักงานสังกัดบริษัทนี้อยู่ การลบอาจส่งผลกระทบต่อการแสดงผล`,
            'ยืนยันการลบบริษัทในเครือ',
            true
        );
        if (confirmed) {
            const success = await deleteCompany(company.id);
            if (success) {
                showToast('ลบบริษัทเรียบร้อยแล้ว', 'success');
            } else {
                showToast('ไม่สามารถลบบริษัทได้', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Smart Mode Banner */}
            <CompanyHeaderBanner
                activeCount={activeCount}
                totalCount={companies.length}
                onOpenAdd={handleOpenAdd}
            />

            {/* Search & Filter Bar */}
            <CompanyFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                totalCount={companies.length}
                activeCount={activeCount}
                inactiveCount={inactiveCount}
            />

            {/* Companies Grid */}
            <CompanyGrid
                companies={filteredCompanies}
                isLoading={isLoading}
                onToggleActive={handleToggleActive}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            {/* Super Approvers Section (Group Executives with cross-company approval privileges) */}
            <SuperApproversSection
                superApproverAdmins={superApproverAdmins}
                allAdminUsers={allAdminUsers}
                selectedSuperApproverIds={selectedSuperApproverIds}
                onUpdateSuperApproverIds={setSelectedSuperApproverIds}
                companies={companies}
                onRemoveSuperApprover={handleRemoveSuperApprover}
                onSaveSuperApprovers={handleSaveSuperApprovers}
                isSaving={isSavingSuperApprovers}
            />

            {/* Form Modal (Add / Edit) */}
            <CompanyFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                editingCompany={editingCompany}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default CompanyMasterView;
