
export const monologueStyles = `
    .monologue {
        font-family: 'Sarabun', sans-serif;
        font-size: 14pt;
        line-height: 2;
        color: #111;
        padding: 0 10px;
    }
    
    .monologue p { 
        margin-bottom: 2em; 
        text-indent: 3em;
        text-align: justify;
        hyphens: auto;
    }

    .monologue h1, .monologue h2, .monologue h3 {
        font-family: 'Sarabun', sans-serif;
        font-weight: 800;
        margin-top: 2.5em;
        margin-bottom: 1.5em;
        color: #000;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
`;

export const generateMonologueHtml = (content: string) => {
    return `<div class="monologue">${content}</div>`;
};
