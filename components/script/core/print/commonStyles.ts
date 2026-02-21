
/**
 * Shared CSS for all script print templates
 */
export const commonStyles = `
    @page { 
        /* This is the key: reserve space on EVERY page */
        margin: 3.5cm 2cm 3cm 2cm; 
        size: A4; 
    }
    
    * { box-sizing: border-box; }
    
    body { 
        font-family: 'Courier Prime', 'Sarabun', monospace; 
        line-height: 1.8; /* Generous for Thai tone marks */
        color: #000; 
        width: 100%;
        margin: 0;
        padding: 0;
        background: white;
        -webkit-print-color-adjust: exact;
    }

    /* Header & Footer now sit INSIDE the page margins */
    .header { 
        position: fixed;
        top: -2.8cm; /* Positioned within the 3.5cm top margin */
        left: 0;
        right: 0;
        height: 2cm;
        text-align: left; 
        border-bottom: 1.5pt solid #000;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        background: white;
        z-index: 1000;
        padding-bottom: 5px;
    }
    
    .title-container { flex: 1; }
    
    .title { 
        font-size: 16pt; 
        font-weight: bold; 
        margin: 0 0 5px 0;
        text-transform: uppercase;
        font-family: 'Sarabun', sans-serif;
    }
    
    .meta { 
        font-size: 9pt; 
        font-family: 'Courier Prime', monospace;
    }

    .stats-box {
        text-align: right;
        font-size: 9pt;
        font-family: 'Courier Prime', monospace;
    }

    .script-body {
        font-size: 12pt;
        position: relative;
        /* No padding-top needed here, @page margin handles it */
        width: 100%;
    }

    .footer {
        position: fixed;
        bottom: -2.3cm; /* Positioned within the 3cm bottom margin */
        left: 0;
        right: 0;
        height: 1.5cm;
        font-size: 9pt;
        color: #000;
        font-family: 'Courier Prime', monospace;
        border-top: 1.5pt solid #000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        z-index: 1000;
        padding-top: 5px;
    }

    @media print {
        .header { position: fixed; top: 0; }
        .footer { position: fixed; bottom: 0; }
        body { margin: 0; }
    }

    @media print {
        .header { position: fixed; top: 0; }
        .footer { position: fixed; bottom: 0; }
        body { margin: 0; }
    }
`;
