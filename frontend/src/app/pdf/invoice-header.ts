import { Content, Column, Table } from 'pdfmake/interfaces';
import { fmtDate } from './invoice-utils';

export async function buildHeader(inv: any, logoUrl: string): Promise<Content[]> {
    const invType = (inv.status == 1 || inv.inv_type === 'insurance') ? 'Insurance' : 'Labour';
    
    // Process branch address
    let branchAddressLines: any[] = [];
    if (inv.branch_address) {
        const addressLines = inv.branch_address.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        addressLines.forEach((line: string) => {
            branchAddressLines.push({ text: line, fontSize: 7 });
        });
    } else {
        branchAddressLines = [
            { text: 'Sarathy Bajaj', fontSize: 7 },
            { text: 'Pulamon Jun.', fontSize: 7 },
            { text: 'Kottarakkara', fontSize: 7 },
            { text: 'Kerala [State Code : 32]', fontSize: 7 }
        ];
    }
    branchAddressLines.push({ text: 'PH : ' + (inv.branch_ph || '+91-9847986565'), fontSize: 7 });

    let gstin = inv.active_brand_gstin || inv.branch_gst || '';

    // Fetch logo logic would be handled before calling this, passing dataUrl as logoUrl
    let logoObj: any = {};
    if (logoUrl) {
        // Fit within 150x95
        logoObj = {
            image: logoUrl,
            fit: [150, 95],
            alignment: 'right',
            margin: [0, 0, 0, 0]
        };
    }

    const headerContent: Content[] = [
        {
            columns: [
                {
                    width: '33%',
                    stack: [
                        { text: 'Branch Address:', bold: true, fontSize: 7 },
                        { text: inv.branch_name || 'SARATHY MOTORS KTR', fontSize: 8, margin: [0, 2, 0, 2] },
                        ...branchAddressLines,
                        { text: 'GSTIN:', fontSize: 7.5, margin: [0, 10, 0, 2] },
                        { text: gstin, bold: true, fontSize: 10 }
                    ]
                },
                {
                    width: '34%',
                    stack: [
                        { text: inv.active_brand_title || 'SARATHY MOTORS', bold: true, fontSize: 10.5, alignment: 'center' },
                        { text: inv.active_brand_address || 'Sarathy Bajaj Pallimukku Kollam Kerala State', fontSize: 7.5, alignment: 'center', margin: [0, 2, 0, 2] },
                        { text: inv.active_brand_state || 'Code: 32 Kerala [State Code :32]', fontSize: 7.5, alignment: 'center' },
                        { text: `TAX INVOICE (${invType})`, bold: true, fontSize: 15, alignment: 'center', margin: [0, 25, 0, 0] }
                    ]
                },
                {
                    width: '33%',
                    stack: logoUrl ? [ logoObj ] : [{ text: '' }],
                    alignment: 'right'
                }
            ]
        },
        // Divider line 1
        {
            canvas: [
                { type: 'line', x1: 0, y1: 5, x2: 535, y2: 5, lineWidth: 0.8 }
            ],
            margin: [0, 2, 0, 2]
        }
    ];

    // Info Section
    const leftW1 = 92;
    const leftW2 = 535 * 0.60 - leftW1 - 5;
    const rightW1 = 98;
    const rightW2 = 535 * 0.40 - rightW1 - 5;

    let leftFields: any[] = [];
    if (invType === 'Insurance') {
        leftFields = [
            ['Invoice No.', inv.inv_no],
            ['Invoice Date', fmtDate(inv.inv_inv_date)],
            ['Billed TO', ''],
            ['Customer Name.', inv.inv_cus],
            ['Insurance GSTIN No:', (inv.inv_insurance_gstin || '')],
            ['Mobile No.', inv.inv_pho],
            ['Delivery Address', (inv.branch_address || '').replace(/\r/g, '')],
            ['Insurance Address:', (inv.inv_insurance_address || '').replace(/\r/g, '')],
            ['Advisor Name.', inv.inv_advisername],
            ['Mechanic Name.', inv.inv_mechna],
            ['Surveyor Name.', (inv.insurance_serveyor || '')]
        ];
    } else {
        leftFields = [
            ['Invoice No.', inv.inv_no],
            ['Invoice Date', fmtDate(inv.inv_inv_date)],
            ['Billed TO', inv.inv_cus],
            ['', 'Mobile : ' + (inv.inv_pho || ''), false],
            ['', (inv.inv_cus_addres || 'BOUGAIN VILLA').replace(/\r/g, ''), false],
            ['', (inv.active_brand_state || 'Kerala[State Code :32]') + ' INDIA', false],
            ['Customer GSTIN', (inv.inv_cus_gstin || '')],
            ['Mobile No.', inv.inv_pho],
            ['Delivery Address', (inv.branch_address || '')],
            ['Advisor Name', inv.inv_advisername],
            ['Mechanic Name', inv.inv_mechna],
            ['Sale Date', fmtDate(inv.inv_sale_date)]
        ];
    }

    const rightFields = [
        ['Invoice Type', inv.inv_type || 'Cash'],
        ['Jobcard No.', inv.inv_job_card_no],
        ['Jobcard Date', fmtDate(inv.inv_jcard_date)],
        ['Whether Tax', inv.status == 2 ? 'Yes' : 'No'],
        ['Payable on', ''],
        ['reverse Charges', 'No'],
        ['Repair Type', inv.inv_repair_typ || 'Paid service'],
        ['KM Reading', inv.inv_km],
        ['Registration No.', inv.in_registr || ''],
        ['Chassis No.', inv.inv_chassis],
        ['Engine No.', inv.in_engine],
        ['Model Name', inv.inv_modl]
    ];

    const leftStack: any[] = [];
    leftFields.forEach(f => {
        const boldLbl = f[2] !== false;
        leftStack.push({
            columns: [
                { width: 92, text: f[0] || '', bold: boldLbl, fontSize: 8.5 },
                { width: 8, text: f[0] ? ':' : '', fontSize: 8.5 },
                { width: '*', text: String(f[1] || '').replace(/\r/g, ''), fontSize: 8.5 }
            ],
            margin: [0, 0, 0, 4]
        });
    });

    const rightStack: any[] = [];
    rightFields.forEach(f => {
        if (f[0] === 'reverse Charges' || f[0] === 'Payable on') {
            rightStack.push({
                text: f[0],
                bold: true,
                fontSize: 8.5,
                margin: [0, 0, 0, f[0] === 'reverse Charges' ? 6 : 4]
            });
        } else {
            rightStack.push({
                columns: [
                    { width: 98, text: f[0] || '', bold: true, fontSize: 8.5 },
                    { width: 8, text: f[0] ? ':' : '', fontSize: 8.5 },
                    { width: '*', text: String(f[1] || '').replace(/\r/g, ''), fontSize: 8.5 }
                ],
                margin: [0, 0, 0, 4]
            });
        }
    });

    headerContent.push({
        columns: [
            { width: '60%', stack: leftStack },
            { width: '40%', stack: rightStack }
        ]
    });

    // Divider line 2
    headerContent.push({
        canvas: [
            { type: 'line', x1: 0, y1: 5, x2: 535, y2: 5, lineWidth: 1 }
        ],
        margin: [0, 2, 0, 4]
    });

    return headerContent;
}
