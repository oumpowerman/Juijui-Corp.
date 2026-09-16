import { ParsedInternItemPreview, processSingleInternRecord } from '../../../../../services/internImportValidator';

/**
 * Re-validates a single intern item after manual editing in modal
 */
export const revalidateInternItem = (
    originalItem: ParsedInternItemPreview,
    updatedFields: Partial<ParsedInternItemPreview>,
    baseYear: number = new Date().getFullYear()
): ParsedInternItemPreview => {
    const rawPeriod = updatedFields.rawPeriod !== undefined 
        ? updatedFields.rawPeriod 
        : `${updatedFields.startDateStr || originalItem.startDateStr} - ${updatedFields.endDateStr || originalItem.endDateStr}`;

    const reprocessed = processSingleInternRecord({
        rawName: updatedFields.fullName !== undefined ? updatedFields.fullName : originalItem.fullName,
        rawNickname: updatedFields.nickname !== undefined ? updatedFields.nickname : originalItem.nickname,
        rawGender: updatedFields.gender !== undefined ? updatedFields.gender : originalItem.gender,
        rawPosition: updatedFields.position !== undefined ? updatedFields.position : originalItem.position,
        rawUniversity: updatedFields.university !== undefined ? updatedFields.university : originalItem.university,
        rawFaculty: updatedFields.faculty !== undefined ? updatedFields.faculty : originalItem.faculty,
        rawYear: updatedFields.academicYear !== undefined ? updatedFields.academicYear : originalItem.academicYear,
        rawPeriod: rawPeriod,
        rawPhone: updatedFields.phoneNumber !== undefined ? updatedFields.phoneNumber : originalItem.phoneNumber,
        rawEmail: updatedFields.email !== undefined ? updatedFields.email : originalItem.email,
        rawPortfolio: updatedFields.portfolioUrl !== undefined ? updatedFields.portfolioUrl : originalItem.portfolioUrl,
        rawStatus: updatedFields.status !== undefined ? updatedFields.status : originalItem.status,
        rawNotes: updatedFields.notes !== undefined ? updatedFields.notes : originalItem.notes,
        rawSource: updatedFields.source !== undefined ? updatedFields.source : originalItem.source
    }, originalItem.index, baseYear);

    return {
        ...reprocessed,
        index: originalItem.index
    };
};
