import { useCallback, useMemo } from 'react';
import {
    CompanyChecklistNode,
    MasterOption,
    User
} from '../../types';

interface UseChecklistMasterResolversArgs {
    masterOptions: MasterOption[];
    nodes: CompanyChecklistNode[];
}

export const useChecklistMasterResolvers = ({
    masterOptions,
    nodes
}: UseChecklistMasterResolversArgs) => {
    // Master options for POSITION and RESPONSIBILITY
    const positionOptions = useMemo(
        () =>
            (masterOptions || [])
                .filter(o => o.type === 'POSITION' && o.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder),
        [masterOptions]
    );

    const responsibilityOptions = useMemo(
        () =>
            (masterOptions || [])
                .filter(o => o.type === 'RESPONSIBILITY' && o.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder),
        [masterOptions]
    );

    const getPositionLabel = useCallback(
        (posKey?: string) => {
            if (!posKey) return '';
            const found = positionOptions.find(p => p.key === posKey || p.label === posKey);
            return found ? found.label : posKey;
        },
        [positionOptions]
    );

    const getResponsibilityLabel = useCallback(
        (respKey?: string) => {
            if (!respKey) return '';
            const found = responsibilityOptions.find(
                r => r.key === respKey || r.label === respKey
            );
            return found ? found.label : respKey;
        },
        [responsibilityOptions]
    );

    // Check if user is responsible for a section
    const isUserResponsibleForSection = useCallback(
        (section: CompanyChecklistNode, user?: User): boolean => {
            if (!user) return false;
            if (section.assignedUserIds && section.assignedUserIds.includes(user.id)) {
                return true;
            }

            const userPosOption = positionOptions.find(
                p =>
                    p.label.toLowerCase() === (user.position || '').toLowerCase() ||
                    p.key.toLowerCase() === (user.position || '').toLowerCase()
            );

            if (section.positionKey) {
                const secPosLabel = getPositionLabel(section.positionKey).toLowerCase();
                const userPos = (user.position || '').toLowerCase();
                if (
                    section.positionKey.toLowerCase() === userPos ||
                    (userPos && secPosLabel.includes(userPos)) ||
                    (userPos && userPos.includes(secPosLabel)) ||
                    (userPosOption && userPosOption.key === section.positionKey)
                ) {
                    return true;
                }
            }

            if (section.responsibilityKey) {
                const respOption = responsibilityOptions.find(
                    r => r.key === section.responsibilityKey
                );
                if (respOption && respOption.parentKey) {
                    if (
                        respOption.parentKey.toLowerCase() ===
                            (user.position || '').toLowerCase() ||
                        (userPosOption && userPosOption.key === respOption.parentKey)
                    ) {
                        return true;
                    }
                }
            }

            return false;
        },
        [positionOptions, responsibilityOptions, getPositionLabel]
    );

    // Get all ITEM nodes belonging to a Section (including items inside Sub-groups of that Section)
    const getSectionItemNodes = useCallback(
        (sectionId: string): CompanyChecklistNode[] => {
            const subgroupIds = new Set(
                nodes
                    .filter(n => n.parentId === sectionId && n.nodeType === 'SUBGROUP')
                    .map(n => n.id)
            );
            return nodes
                .filter(
                    n =>
                        n.nodeType === 'ITEM' &&
                        (n.parentId === sectionId ||
                            (n.parentId && subgroupIds.has(n.parentId)))
                )
                .sort((a, b) => a.sortOrder - b.sortOrder);
        },
        [nodes]
    );

    return {
        positionOptions,
        responsibilityOptions,
        getPositionLabel,
        getResponsibilityLabel,
        isUserResponsibleForSection,
        getSectionItemNodes
    };
};
