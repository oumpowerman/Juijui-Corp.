
const CHARACTER_COLORS = [
    '#1e40af', // blue-800
    '#991b1b', // red-800
    '#065f46', // emerald-800
    '#5b21b6', // violet-800
    '#9a3412', // orange-800
    '#155e75', // cyan-800
    '#86198f', // fuchsia-800
];

const getCharColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CHARACTER_COLORS[Math.abs(hash) % CHARACTER_COLORS.length];
};

export const dialogueStyles = `
    /* Sluglines (Scene Headings) */
    .slugline {
        font-weight: bold;
        text-transform: uppercase;
        margin: 30px 0 15px 0;
        font-family: 'Courier Prime', monospace;
        text-decoration: underline;
        font-size: 13pt;
        text-align: center; /* Centered as requested */
    }

    /* Action */
    .action {
        text-align: center; /* Centered as requested */
        width: 100%;
        margin-bottom: 20px;
        font-family: 'Courier Prime', monospace;
        line-height: 1.4;
    }

    /* Dialogue Blocks - Compact & Professional */
    .dialogue-block {
        position: relative;
        margin-bottom: 25px;
        padding-left: 55px; /* Adjusted for safe column */
        page-break-inside: avoid;
        orphans: 3;
        widows: 3;
    }

    .line-number {
        position: absolute;
        left: 0;
        top: 0;
        font-size: 8pt;
        color: #666;
        font-family: 'Courier Prime', monospace;
        width: 40px;
        text-align: right;
        padding-right: 12px;
        border-right: 1.5pt solid #000;
        height: 100%;
    }

    .character {
        text-align: left;
        font-weight: bold;
        margin-bottom: 4px;
        text-transform: uppercase;
        font-family: 'Courier Prime', monospace;
        font-size: 10pt;
        display: block;
        opacity: 0.8;
    }

    .speech {
        text-align: left;
        width: 100%; 
        line-height: 1.6;
        font-family: 'Sarabun', sans-serif;
        font-size: 14pt;
        font-weight: 500;
        color: #000;
        word-wrap: break-word; /* Prevent overflow */
    }
`;

export const generateDialogueHtml = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const paragraphs = doc.querySelectorAll('p');
    
    let formattedHtml = '';
    let lineCounter = 0;
    
    paragraphs.forEach(p => {
        const text = p.innerText.trim();
        if (!text) return;

        // More robust regex: Match "NAME:" or "NAME :" or "NAME. " at start
        // Also handle cases where there might be a space before the colon
        const match = text.match(/^([^:]+?)\s*[:]\s*(.*)/) || text.match(/^([^.]+?)\s*[.]\s{1,}(.*)/);
        
        if (match) {
            lineCounter++;
            const char = match[1].trim().toUpperCase();
            const speech = match[2].trim();
            const color = getCharColor(char);
            
            formattedHtml += `
                <div class="dialogue-block">
                    <div class="line-number">${lineCounter}</div>
                    <div class="character" style="color: ${color}; border-bottom: 1pt solid ${color}44;">${char}</div>
                    <div class="speech">${speech}</div>
                </div>
            `;
        } else if (text.startsWith('[') && text.endsWith(']')) {
            formattedHtml += `<div class="slugline">${text.toUpperCase()}</div>`;
        } else {
            formattedHtml += `<div class="action">${p.innerHTML}</div>`;
        }
    });
    
    return formattedHtml || content;
};
