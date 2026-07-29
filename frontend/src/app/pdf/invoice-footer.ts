import { Content } from 'pdfmake/interfaces';
import { fmtDate } from './invoice-utils';

export function buildSignatureAndGatePass(inv: any): Content[] {
    const content: Content[] = [];

    // --- Signatures ---
    let nextServiceDateStr = fmtDate(inv.inv_next_service_date);
    if (!nextServiceDateStr || nextServiceDateStr === '02/10/2018' || !inv.inv_next_service_date) {
        let invDate = new Date(inv.inv_inv_date || Date.now());
        if (isNaN(invDate.getTime())) invDate = new Date();
        
        const rType = (inv.inv_repair_typ || 'Paid service').toLowerCase();
        const monthsToAdd = rType.includes('paid') ? 4 : 3;
        invDate.setMonth(invDate.getMonth() + monthsToAdd);
        nextServiceDateStr = fmtDate(invDate);
    }

    content.push({
        unbreakable: true,
        stack: [
            {
                columns: [
                    {
                        width: '33%',
                        text: 'Sign of Customer Or His Agent',
                        fontSize: 8,
                        margin: [0, 8, 0, 0]
                    },
                    {
                        width: '34%',
                        stack: [
                            { text: 'Get your vehicle serviced at regular intervals.', bold: true, fontSize: 9, color: '#003087', alignment: 'center' },
                            { text: 'Next due date for service is ' + nextServiceDateStr, fontSize: 7.5, alignment: 'center', margin: [0, 2, 0, 2] },
                            { text: 'Thank You & Happy Riding', fontSize: 7.5, alignment: 'center' }
                        ]
                    },
                    {
                        width: '33%',
                        stack: [
                            { text: inv.active_brand_title || 'SARATHY MOTORS', bold: true, fontSize: 8.5, alignment: 'center', margin: [0, 0, 0, 4] },
                            {
                                canvas: [{ type: 'line', x1: 15, y1: 0, x2: 161, y2: 0, lineWidth: 0.8 }],
                                margin: [0, 0, 0, 4]
                            },
                            { text: 'Authorised Signatory', fontSize: 8, alignment: 'center', margin: [0, 0, 0, 0] }
                        ]
                    }
                ]
            }
        ]
    });

    return content;
}

export function buildGatePass(inv: any): any {
    return {
        stack: [
            // Divider
            {
                canvas: [
                    { type: 'line', x1: 0, y1: 15, x2: 535, y2: 15, lineWidth: 0.8, dash: { length: 3, space: 3 } }
                ],
                margin: [0, 10, 0, 10]
            },
            {
                text: 'Gate Pass',
                bold: true,
                fontSize: 12,
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            {
                columns: [
                    {
                        width: '33%',
                        stack: [
                            { columns: [{ width: 75, text: 'Job Card No.', bold: true, fontSize: 8 }, { text: ': ' + (inv.inv_job_card_no || ''), fontSize: 7.5 }], margin: [0, 0, 0, 2] },
                            { columns: [{ width: 75, text: 'Jobcard Date', bold: true, fontSize: 8 }, { text: ': ' + fmtDate(inv.inv_jcard_date), fontSize: 7.5 }], margin: [0, 0, 0, 2] },
                            { columns: [{ width: 75, text: 'Invoice Date', bold: true, fontSize: 8 }, { text: ': ' + fmtDate(inv.inv_inv_date), fontSize: 7.5 }], margin: [0, 0, 0, 2] },
                            { columns: [{ width: 75, text: 'Model Name', bold: true, fontSize: 8 }, { text: ': ' + (inv.inv_modl || ''), fontSize: 7.5 }] }
                        ]
                    },
                    {
                        width: '34%',
                        stack: [
                            { columns: [{ width: 75, text: 'Invoice no', bold: true, fontSize: 8 }, { text: ': ' + (inv.inv_no || ''), fontSize: 7.5 }], margin: [0, 0, 0, 2] },
                            { columns: [{ width: 75, text: 'Service Advisor', bold: true, fontSize: 8 }, { text: ': ' + (inv.inv_advisername || ''), fontSize: 7.5 }], margin: [0, 0, 0, 2] },
                            { columns: [{ width: 75, text: 'Vehicle No.', bold: true, fontSize: 8 }, { text: ': ' + (inv.in_registr || ''), fontSize: 7.5 }] }
                        ]
                    },
                    {
                        width: '33%',
                        stack: [
                            { columns: [{ width: 75, text: 'Chase No.', bold: true, fontSize: 8 }, { text: ': ' + (inv.inv_chassis || ''), fontSize: 7.5 }], margin: [0, 0, 0, 2] },
                            { columns: [{ width: 75, text: 'Engine No', bold: true, fontSize: 8 }, { text: ': ' + (inv.in_engine || ''), fontSize: 7.5 }], margin: [0, 0, 0, 2] },
                            { columns: [{ width: 75, text: 'Mechanic Name', bold: true, fontSize: 8 }, { text: ': ' + (inv.inv_mechna || ''), fontSize: 7.5 }] }
                        ]
                    }
                ]
            },
            {
                margin: [0, 15, 0, 0],
                columns: [
                    { width: '*', text: '' }, // spacer
                    {
                        width: 140,
                        stack: [
                            {
                                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 0.8 }],
                                margin: [0, 0, 0, 4]
                            },
                            { text: inv.active_brand_title || 'SARATHY MOTORS', fontSize: 8, alignment: 'center', margin: [0, 0, 0, 2] },
                            { text: 'Authorised Signatory', fontSize: 7.5, alignment: 'center' }
                        ]
                    },
                    { width: '*', text: '' } // spacer
                ]
            }
        ],
        margin: [30, 0, 30, 10]
    };
}
