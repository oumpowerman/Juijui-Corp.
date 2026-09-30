
import React, { forwardRef, useMemo } from 'react';
import { Duty, User } from '../../../types';
import { format, getDay } from 'date-fns';
import th from 'date-fns/locale/th';
import { Calendar, CheckCircle2, ClipboardCheck, ShieldCheck, Users, Layers, Sparkles } from 'lucide-react';
import { BRAND_CONFIG } from '../../../config/brand.ts';

interface ExportTemplateProps {
    groupedDuties: { date: Date; duties: Duty[] }[];
    users: User[];
}

interface DayTheme {
    en: string;
    thName: string;
    accentBar: string;
    dateBg: string;
    dateBorder: string;
    pillBg: string;
    pillText: string;
    numText: string;
    subText: string;
    roleBadgeBg: string;
    roleBadgeText: string;
    roleBadgeBorder: string;
    bulletColor: string;
}

const DAY_THEMES: Record<number, DayTheme> = {
    1: {
        en: 'MON',
        thName: 'วันจันทร์',
        accentBar: '#f59e0b',
        dateBg: '#fffbeb',
        dateBorder: '#fde68a',
        pillBg: '#fef3c7',
        pillText: '#b45309',
        numText: '#d97706',
        subText: '#92400e',
        roleBadgeBg: '#fffbeb',
        roleBadgeText: '#b45309',
        roleBadgeBorder: '#fde68a',
        bulletColor: '#f59e0b',
    },
    2: {
        en: 'TUE',
        thName: 'วันอังคาร',
        accentBar: '#f43f5e',
        dateBg: '#fff1f2',
        dateBorder: '#fecdd3',
        pillBg: '#ffe4e6',
        pillText: '#be123c',
        numText: '#e11d48',
        subText: '#9f1239',
        roleBadgeBg: '#fff1f2',
        roleBadgeText: '#be123c',
        roleBadgeBorder: '#fecdd3',
        bulletColor: '#f43f5e',
    },
    3: {
        en: 'WED',
        thName: 'วันพุธ',
        accentBar: '#10b981',
        dateBg: '#ecfdf5',
        dateBorder: '#a7f3d0',
        pillBg: '#d1fae5',
        pillText: '#047857',
        numText: '#059669',
        subText: '#065f46',
        roleBadgeBg: '#ecfdf5',
        roleBadgeText: '#047857',
        roleBadgeBorder: '#a7f3d0',
        bulletColor: '#10b981',
    },
    4: {
        en: 'THU',
        thName: 'วันพฤหัสบดี',
        accentBar: '#f97316',
        dateBg: '#fff7ed',
        dateBorder: '#fed7aa',
        pillBg: '#ffedd5',
        pillText: '#c2410c',
        numText: '#ea580c',
        subText: '#9a3412',
        roleBadgeBg: '#fff7ed',
        roleBadgeText: '#c2410c',
        roleBadgeBorder: '#fed7aa',
        bulletColor: '#f97316',
    },
    5: {
        en: 'FRI',
        thName: 'วันศุกร์',
        accentBar: '#3b82f6',
        dateBg: '#eff6ff',
        dateBorder: '#bfdbfe',
        pillBg: '#dbeafe',
        pillText: '#1d4ed8',
        numText: '#2563eb',
        subText: '#1e40af',
        roleBadgeBg: '#eff6ff',
        roleBadgeText: '#1d4ed8',
        roleBadgeBorder: '#bfdbfe',
        bulletColor: '#3b82f6',
    },
    6: {
        en: 'SAT',
        thName: 'วันเสาร์',
        accentBar: '#8b5cf6',
        dateBg: '#f5f3ff',
        dateBorder: '#ddd6fe',
        pillBg: '#ede9fe',
        pillText: '#6d28d9',
        numText: '#7c3aed',
        subText: '#5b21b6',
        roleBadgeBg: '#f5f3ff',
        roleBadgeText: '#6d28d9',
        roleBadgeBorder: '#ddd6fe',
        bulletColor: '#8b5cf6',
    },
    0: {
        en: 'SUN',
        thName: 'วันอาทิตย์',
        accentBar: '#ef4444',
        dateBg: '#fef2f2',
        dateBorder: '#fecaca',
        pillBg: '#fee2e2',
        pillText: '#b91c1c',
        numText: '#dc2626',
        subText: '#991b1b',
        roleBadgeBg: '#fef2f2',
        roleBadgeText: '#b91c1c',
        roleBadgeBorder: '#fecaca',
        bulletColor: '#ef4444',
    },
};

const parseDescriptionItems = (description?: string): string[] => {
    if (!description || !description.trim()) return [];
    const rawLines = description
        .split(/\r?\n/)
        .flatMap((line) => (line.includes('•') ? line.split('•') : [line]));

    return rawLines
        .map((item) => item.replace(/^[\s•\-*–—]+/, '').trim())
        .filter(Boolean);
};

const ExportTemplate = forwardRef<HTMLDivElement, ExportTemplateProps>(({ groupedDuties, users }, ref) => {
    const stats = useMemo(() => {
        const totalDays = groupedDuties.length;
        let totalShifts = 0;
        const assigneeSet = new Set<string>();

        groupedDuties.forEach((group) => {
            totalShifts += group.duties.length;
            group.duties.forEach((d) => {
                if (d.assigneeId) assigneeSet.add(d.assigneeId);
            });
        });

        return {
            totalDays,
            totalShifts,
            uniqueMembers: assigneeSet.size,
        };
    }, [groupedDuties]);

    const dateRangeLabel = useMemo(() => {
        if (groupedDuties.length === 0) return '-';
        const firstDate = groupedDuties[0].date;
        const lastDate = groupedDuties[groupedDuties.length - 1].date;
        return `${format(firstDate, 'd MMM', { locale: th })} – ${format(lastDate, 'd MMM yyyy', { locale: th })}`;
    }, [groupedDuties]);

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                top: '-9999px',
                left: '-9999px',
                width: '1040px',
                padding: '36px',
                backgroundColor: '#f1f5f9',
                fontFamily: "'Kanit', 'Inter', sans-serif",
                boxSizing: 'border-box',
            }}
        >
            {/* Outer Enterprise Sheet Card */}
            <div
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '28px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
                }}
            >
                {/* 1. EXECUTIVE HERO HEADER */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)',
                        padding: '34px 40px',
                        position: 'relative',
                        overflow: 'hidden',
                        borderBottom: '3px solid #6366f1',
                    }}
                >
                    {/* Subtle Grid Pattern Overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            pointerEvents: 'none',
                        }}
                    />

                    <div
                        style={{
                            position: 'relative',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '24px',
                        }}
                    >
                        {/* Left: Title & Official Period */}
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginBottom: '12px',
                                }}
                            >
                                {/* Badge 1: Official Roster */}
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        backgroundColor: 'rgba(99, 102, 241, 0.22)',
                                        border: '1px solid rgba(129, 140, 248, 0.4)',
                                        borderRadius: '999px',
                                        padding: '4px 14px 8px 14px',
                                    }}
                                >
                                    <ShieldCheck style={{ width: '14px', height: '14px', color: '#fbbf24', marginTop: '3px', flexShrink: 0 }} />
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            letterSpacing: '0.08em',
                                            color: '#e0e7ff',
                                            lineHeight: 1.2,
                                            position: 'relative',
                                            top: '-2px',
                                        }}
                                    >
                                        OFFICIAL OPERATIONS ROSTER
                                    </span>
                                </div>

                                {/* Badge 2: Brand Name */}
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.16)',
                                        borderRadius: '999px',
                                        padding: '4px 12px 8px 12px',
                                    }}
                                >
                                    <Sparkles style={{ width: '12px', height: '12px', color: '#a5b4fc', marginTop: '3px', flexShrink: 0 }} />
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            color: '#cbd5e1',
                                            lineHeight: 1.2,
                                            position: 'relative',
                                            top: '-2px',
                                        }}
                                    >
                                        {BRAND_CONFIG.name}
                                    </span>
                                </div>
                            </div>

                            <h1
                                style={{
                                    fontSize: '28px',
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    margin: '0 0 12px 0',
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.3,
                                    position: 'relative',
                                    top: '-3px',
                                }}
                            >
                                ตารางปฏิบัติหน้าที่ประจำสัปดาห์ (Duty Roster)
                            </h1>

                            {/* Period Pill */}
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                                    border: '1px solid rgba(255, 255, 255, 0.14)',
                                    borderRadius: '12px',
                                    padding: '6px 14px 11px 14px',
                                }}
                            >
                                <Calendar style={{ width: '15px', height: '15px', color: '#818cf8', marginTop: '4px', flexShrink: 0 }} />
                                <span
                                    style={{
                                        fontSize: '13.5px',
                                        fontWeight: 400,
                                        color: '#cbd5e1',
                                        lineHeight: 1.2,
                                        position: 'relative',
                                        top: '-2px',
                                    }}
                                >
                                    ช่วงเวลาปฏิบัติงาน:
                                </span>
                                <span
                                    style={{
                                        fontSize: '13.5px',
                                        fontWeight: 600,
                                        color: '#ffffff',
                                        lineHeight: 1.2,
                                        position: 'relative',
                                        top: '-2px',
                                    }}
                                >
                                    {dateRangeLabel}
                                </span>
                            </div>
                        </div>

                        {/* Right: Summary Stat Pills */}
                        <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
                            {[
                                {
                                    label: 'WORKING DAYS',
                                    sub: 'จำนวนวันทำงาน',
                                    value: `${stats.totalDays}`,
                                    unit: 'Days',
                                    icon: Calendar,
                                    accent: '#38bdf8',
                                },
                                {
                                    label: 'TOTAL SHIFTS',
                                    sub: 'จำนวนเวรทั้งหมด',
                                    value: `${stats.totalShifts}`,
                                    unit: 'Shifts',
                                    icon: Layers,
                                    accent: '#a78bfa',
                                },
                                {
                                    label: 'ASSIGNED TEAM',
                                    sub: 'ผู้รับผิดชอบ',
                                    value: `${stats.uniqueMembers}`,
                                    unit: 'Members',
                                    icon: Users,
                                    accent: '#34d399',
                                },
                            ].map((stat, idx) => {
                                const IconComp = stat.icon;
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            minWidth: '130px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                            border: '1px solid rgba(255, 255, 255, 0.14)',
                                            borderRadius: '18px',
                                            padding: '12px 16px 16px 16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '6px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '10px',
                                                    fontWeight: 500,
                                                    letterSpacing: '0.06em',
                                                    color: '#94a3b8',
                                                    lineHeight: 1.2,
                                                    position: 'relative',
                                                    top: '-2px',
                                                }}
                                            >
                                                {stat.label}
                                            </span>
                                            <IconComp style={{ width: '14px', height: '14px', color: stat.accent }} />
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'baseline',
                                                gap: '6px',
                                                position: 'relative',
                                                top: '-3px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '26px',
                                                    fontWeight: 600,
                                                    color: '#ffffff',
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {stat.value}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    color: stat.accent,
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {stat.unit}
                                            </span>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 400,
                                                color: '#cbd5e1',
                                                marginTop: '4px',
                                                lineHeight: 1.2,
                                                position: 'relative',
                                                top: '-2px',
                                            }}
                                        >
                                            {stat.sub}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 2. COLOR-CODED DAY TIMELINE & SHIFT CARDS */}
                <div style={{ padding: '32px 40px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {groupedDuties.map((group) => {
                            const dayIndex = getDay(group.date);
                            const theme = DAY_THEMES[dayIndex] || DAY_THEMES[1];

                            return (
                                <div
                                    key={`exp-${group.date.toISOString()}`}
                                    style={{
                                        display: 'flex',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '22px',
                                        border: '1px solid #e2e8f0',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.03)',
                                    }}
                                >
                                    {/* Day Color Accent Strip */}
                                    <div
                                        style={{
                                            width: '8px',
                                            backgroundColor: theme.accentBar,
                                            flexShrink: 0,
                                        }}
                                    />

                                    {/* Left Date Column */}
                                    <div
                                        style={{
                                            width: '160px',
                                            backgroundColor: theme.dateBg,
                                            borderRight: `1px solid ${theme.dateBorder}`,
                                            padding: '18px 14px 22px 14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {/* English Day Pill */}
                                        <div
                                            style={{
                                                backgroundColor: theme.pillBg,
                                                border: `1px solid ${theme.dateBorder}`,
                                                borderRadius: '8px',
                                                padding: '2px 12px 7px 12px',
                                                marginBottom: '6px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: theme.pillText,
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.08em',
                                                    lineHeight: 1.2,
                                                    position: 'relative',
                                                    top: '-1px',
                                                }}
                                            >
                                                {theme.en}
                                            </span>
                                        </div>

                                        {/* Thai Day Name */}
                                        <div
                                            style={{
                                                fontSize: '13.5px',
                                                fontWeight: 500,
                                                color: theme.subText,
                                                lineHeight: 1.3,
                                                marginBottom: '4px',
                                                position: 'relative',
                                                top: '-2px',
                                            }}
                                        >
                                            {theme.thName}
                                        </div>

                                        {/* Date Number */}
                                        <div
                                            style={{
                                                fontSize: '38px',
                                                fontWeight: 600,
                                                color: theme.numText,
                                                lineHeight: 1.05,
                                                marginBottom: '4px',
                                                position: 'relative',
                                                top: '-4px',
                                            }}
                                        >
                                            {format(group.date, 'd')}
                                        </div>

                                        {/* Month & Year */}
                                        <div
                                            style={{
                                                fontSize: '11.5px',
                                                fontWeight: 500,
                                                color: theme.subText,
                                                opacity: 0.85,
                                                lineHeight: 1.2,
                                                position: 'relative',
                                                top: '-2px',
                                            }}
                                        >
                                            {format(group.date, 'MMM yyyy', { locale: th })}
                                        </div>
                                    </div>

                                    {/* Right: Enterprise Shift Cards Grid */}
                                    <div style={{ flex: 1, padding: '18px 20px', backgroundColor: '#ffffff' }}>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: group.duties.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                                                gap: '16px',
                                            }}
                                        >
                                            {group.duties.map((duty, i) => {
                                                const u = users.find((user) => user.id === duty.assigneeId);
                                                const sopItems = parseDescriptionItems(duty.description);
                                                const rankNumber = `#${String(i + 1).padStart(2, '0')}`;

                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            backgroundColor: '#f8fafc',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '18px',
                                                            padding: '16px',
                                                            boxSizing: 'border-box',
                                                        }}
                                                    >
                                                        {/* Top: Assignee Profile + Rank Badge */}
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                gap: '12px',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '12px',
                                                                    minWidth: 0,
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                {/* Clean Single-Frame Avatar */}
                                                                <div
                                                                    style={{
                                                                        width: '48px',
                                                                        height: '48px',
                                                                        borderRadius: '14px',
                                                                        backgroundColor: '#ffffff',
                                                                        border: `1.5px solid ${theme.dateBorder}`,
                                                                        overflow: 'hidden',
                                                                        flexShrink: 0,
                                                                        boxSizing: 'border-box',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    {u?.avatarUrl ? (
                                                                        <img
                                                                            src={u.avatarUrl}
                                                                            crossOrigin="anonymous"
                                                                            alt={u.name}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                                display: 'block',
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                backgroundColor: theme.pillBg,
                                                                                color: theme.pillText,
                                                                                fontWeight: 600,
                                                                                fontSize: '17px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                paddingBottom: '4px',
                                                                            }}
                                                                        >
                                                                            {u?.name?.[0] || '?'}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Name & Position (compensated for html2canvas baseline) */}
                                                                <div
                                                                    style={{
                                                                        minWidth: 0,
                                                                        flex: 1,
                                                                        position: 'relative',
                                                                        top: '-3px',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            fontSize: '16px',
                                                                            fontWeight: 600,
                                                                            color: '#0f172a',
                                                                            lineHeight: 1.3,
                                                                            marginBottom: '2px',
                                                                        }}
                                                                    >
                                                                        {u?.name || 'Unassigned'}
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            fontSize: '12px',
                                                                            fontWeight: 400,
                                                                            color: '#64748b',
                                                                            lineHeight: 1.25,
                                                                        }}
                                                                    >
                                                                        {u?.position || 'Operations Member'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Sequence Badge (#01, #02) */}
                                                            <div
                                                                style={{
                                                                    backgroundColor: '#ffffff',
                                                                    border: '1px solid #cbd5e1',
                                                                    borderRadius: '10px',
                                                                    padding: '3px 10px 8px 10px',
                                                                    flexShrink: 0,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        color: '#475569',
                                                                        fontSize: '11.5px',
                                                                        fontWeight: 500,
                                                                        lineHeight: 1.2,
                                                                        position: 'relative',
                                                                        top: '-1px',
                                                                    }}
                                                                >
                                                                    {rankNumber}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Primary Duty Role Soft Accent Box */}
                                                        <div
                                                            style={{
                                                                marginTop: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                backgroundColor: theme.roleBadgeBg,
                                                                border: `1px solid ${theme.roleBadgeBorder}`,
                                                                padding: '6px 12px 11px 12px',
                                                                borderRadius: '12px',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: '7px',
                                                                    height: '7px',
                                                                    borderRadius: '999px',
                                                                    backgroundColor: theme.accentBar,
                                                                    marginTop: '3px',
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    color: theme.roleBadgeText,
                                                                    lineHeight: 1.35,
                                                                    position: 'relative',
                                                                    top: '-2px',
                                                                }}
                                                            >
                                                                หน้าที่หลัก: {duty.title}
                                                            </span>
                                                        </div>

                                                        {/* Bottom: SOP / Task Scope Checklist Box */}
                                                        {sopItems.length > 0 && (
                                                            <div
                                                                style={{
                                                                    marginTop: '10px',
                                                                    backgroundColor: '#ffffff',
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: '14px',
                                                                    padding: '10px 14px 14px 14px',
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        marginBottom: '8px',
                                                                        paddingBottom: '7px',
                                                                        borderBottom: '1px dashed #e2e8f0',
                                                                    }}
                                                                >
                                                                    <ClipboardCheck
                                                                        style={{
                                                                            width: '13px',
                                                                            height: '13px',
                                                                            color: '#4f46e5',
                                                                            marginTop: '2px',
                                                                            flexShrink: 0,
                                                                        }}
                                                                    />
                                                                    <span
                                                                        style={{
                                                                            fontSize: '10.5px',
                                                                            fontWeight: 500,
                                                                            letterSpacing: '0.04em',
                                                                            color: '#4f46e5',
                                                                            textTransform: 'uppercase',
                                                                            lineHeight: 1.2,
                                                                            position: 'relative',
                                                                            top: '-2px',
                                                                        }}
                                                                    >
                                                                        SOP / ขอบเขตงานที่ต้องปฏิบัติ
                                                                    </span>
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: '6px',
                                                                    }}
                                                                >
                                                                    {sopItems.map((item, itemIdx) => (
                                                                        <div
                                                                            key={itemIdx}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'flex-start',
                                                                                gap: '8px',
                                                                            }}
                                                                        >
                                                                            <CheckCircle2
                                                                                style={{
                                                                                    width: '14px',
                                                                                    height: '14px',
                                                                                    color: theme.bulletColor,
                                                                                    marginTop: '3px',
                                                                                    flexShrink: 0,
                                                                                }}
                                                                            />
                                                                            <span
                                                                                style={{
                                                                                    fontSize: '12.5px',
                                                                                    fontWeight: 400,
                                                                                    color: '#334155',
                                                                                    lineHeight: 1.45,
                                                                                    position: 'relative',
                                                                                    top: '-2px',
                                                                                }}
                                                                            >
                                                                                {item}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. OFFICIAL FOOTER & COMPLIANCE BAR */}
                <div
                    style={{
                        backgroundColor: '#0f172a',
                        padding: '16px 40px 20px 40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #1e293b',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.16)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                borderRadius: '8px',
                                padding: '3px 10px 8px 10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <span
                                style={{
                                    color: '#fbbf24',
                                    fontSize: '10.5px',
                                    fontWeight: 500,
                                    letterSpacing: '0.05em',
                                    lineHeight: 1.2,
                                    position: 'relative',
                                    top: '-1px',
                                }}
                            >
                                COMPLIANCE NOTE
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: '12.5px',
                                fontWeight: 400,
                                color: '#e2e8f0',
                                lineHeight: 1.3,
                                position: 'relative',
                                top: '-2px',
                            }}
                        >
                            📌 หมายเหตุ: กรุณาถ่ายภาพหลักฐานส่งในระบบทุกครั้งหลังปฏิบัติหน้าที่เสร็จสิ้น
                        </span>
                    </div>

                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 400,
                            color: '#94a3b8',
                            lineHeight: 1.3,
                            position: 'relative',
                            top: '-2px',
                        }}
                    >
                        Generated by <span style={{ color: '#ffffff', fontWeight: 500 }}>{BRAND_CONFIG.name}</span> • Issued:{' '}
                        {format(new Date(), 'dd/MM/yyyy HH:mm')}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ExportTemplate;
