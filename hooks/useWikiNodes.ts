
import { useState, useEffect } from 'react';
import { WikiNode, User } from '../types';
import { useToast } from '../context/ToastContext';

const STORAGE_KEY = 'juijui_wiki_nodes';

export const useWikiNodes = (currentUser?: User) => {
    const [nodes, setNodes] = useState<WikiNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNodes(parsed.map((n: any) => ({
                    ...n,
                    createdAt: new Date(n.createdAt),
                    updatedAt: new Date(n.updatedAt)
                })));
            } catch (e) {
                console.error('Failed to parse wiki nodes', e);
            }
        }
        setIsLoading(false);
    }, []);

    // Save to localStorage whenever nodes change
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
        }
    }, [nodes, isLoading]);

    const addNode = async (node: Omit<WikiNode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
        if (!currentUser) return;
        const newNode: WikiNode = {
            ...node,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: currentUser.id
        };
        setNodes(prev => [...prev, newNode]);
        showToast('เพิ่มหัวข้อใหม่เรียบร้อย 🎉', 'success');
        return newNode;
    };

    const updateNode = async (id: string, updates: Partial<WikiNode>) => {
        setNodes(prev => prev.map(n => n.id === id ? {
            ...n,
            ...updates,
            updatedAt: new Date()
        } : n));
        showToast('อัปเดตข้อมูลเรียบร้อย ✅', 'success');
    };

    const deleteNode = async (id: string) => {
        // Recursive delete children
        const deleteRecursive = (nodeId: string, currentNodes: WikiNode[]): WikiNode[] => {
            const children = currentNodes.filter(n => n.parentId === nodeId);
            let updated = currentNodes.filter(n => n.id !== nodeId);
            children.forEach(child => {
                updated = deleteRecursive(child.id, updated);
            });
            return updated;
        };

        setNodes(prev => deleteRecursive(id, prev));
        showToast('ลบหัวข้อเรียบร้อย 🗑️', 'info');
    };

    return {
        nodes,
        isLoading,
        addNode,
        updateNode,
        deleteNode
    };
};
