const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, VerticalAlign, BorderStyle, ImageRun, HeightRule } = require('docx');
const fs = require('fs');
const path = require('path');
const { convertNumberToWords } = require('./numberToWords');

const p = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
function fmt(v, dec) {
    if (v === undefined || v === null || v === '') return '0.00';
    dec = dec == null ? 2 : dec;
    return p(v).toFixed(dec);
}

function fmtDate(d) {
    if (!d) return '';
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return String(d).substring(0, 10);
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = dt.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    } catch (e) { return String(d).substring(0, 10); }
}

async function generateInvoiceWord(inv, items) {
    const logoPath = path.join(__dirname, '../../frontend/src/assets/sarathy-logo.png');
    let logoImage;
    if (fs.existsSync(logoPath)) {
        logoImage = fs.readFileSync(logoPath);
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 720,
                        right: 1440,
                        bottom: 720,
                        left: 1440,
                    },
                },
            },
            children: [
                // Header (No Table)
                new Paragraph({
                    children: [
                        new TextRun({ text: "Branch Address :", bold: true, size: 20 }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: (inv.branch_name || "SARATHY MAIN WORKSHOP").toUpperCase(), bold: true, size: 20 }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Sarathy Bajaj" }),
                        new TextRun({ text: "\t\t\t\t\t\t", bold: false }), // Spacer to move branding right
                        ...(logoImage ? [
                            new ImageRun({
                                data: logoImage,
                                transformation: { width: 140, height: 50 },
                            }),
                        ] : []),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Pallimukku" }),
                        new TextRun({ text: "\t\t\t", bold: false }),
                        new TextRun({ text: "\t\t" + "SARATHY MOTORS", bold: true, size: 28, color: "003087" }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Kollam-10," }),
                        new TextRun({ text: "\t\t\t" }),
                        new TextRun({ text: "\t\t" + "Sarathy Bajaj Pallimukku Kollam Kerala State", size: 16 }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Kerala [State Code:32]" }),
                        new TextRun({ text: "\t\t\t" }),
                        new TextRun({ text: "\t\t" + "Code:32 Kerala [State Code:32]", size: 16 }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "GSTIN : " + (inv.branch_gst || "32ABQFS6676M1ZA"), bold: true }),
                    ],
                }),

                new Paragraph({ children: [new TextRun({ text: "", size: 20 })] }), // Spacer

                // Title
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: `Tax Invoice (${(inv.status == 2 || inv.inv_type === 'insurance') ? 'Insurance' : 'Labour'})`,
                            bold: true,
                            size: 40,
                        }),
                    ],
                    border: {
                        bottom: {
                            color: "000000",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                    spacing: { after: 200 },
                }),

                new Paragraph({ children: [new TextRun({ text: "", size: 10 })] }), // Small Spacer

                // Invoice Details Section (No Table)
                ...createDetailParagraphs(inv),

                new Paragraph({ children: [new TextRun({ text: "", size: 40 })] }), // Spacer
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "Tax Invoice", bold: true, size: 36 })],
                }),

                // Line Items Table
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        // Header
                        new TableRow({
                            tableHeader: true,
                            children: [
                                "Sl NO", "LABOUR NAME/SAC CODE", "LABOUR NAME", "RATE", "DISCOUNT", "TAX AMOUNT", "SGST/U TGST(%)", "SGST/ UTGST", "CGST(%)", "CGST", "AMOUNT"
                            ].map(h => new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 14 })], alignment: AlignmentType.CENTER })],
                                shading: { fill: "F2F2F2" },
                                verticalAlign: VerticalAlign.CENTER,
                            })),
                        }),
                        // Data
                        ...items.map((item, idx) => {
                            const disc = p(item.lc_disc);
                            const taxable = p(item.lc_tax_amunt);
                            const sgstA = p(item.lc_sgst_a);
                            const cgstA = p(item.lc_cgst_a);
                            const amount = p(item.lc_amount);
                            return new TableRow({
                                children: [
                                    String(idx + 1),
                                    item.lc_lab_code || "",
                                    item.lc_lb_name || "",
                                    fmt(item.lc_rate, 2),
                                    fmt(disc, 2),
                                    fmt(taxable, 2),
                                    fmt(item.lc_sgst_p, 0),
                                    fmt(sgstA, 2),
                                    fmt(item.lc_cgst_p, 0),
                                    fmt(cgstA, 2),
                                    fmt(amount, 2)
                                ].map(val => new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: String(val), size: 16 })], alignment: AlignmentType.CENTER })],
                                    verticalAlign: VerticalAlign.CENTER,
                                })),
                            });
                        }),
                        // Totals
                        new TableRow({
                            children: [
                                new TableCell({ columnSpan: 5, children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, size: 18 })], alignment: AlignmentType.RIGHT })], verticalAlign: VerticalAlign.CENTER }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(items.reduce((s, i) => s + p(i.lc_tax_amunt), 0), 2), bold: true, size: 16 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                                new TableCell({ children: [] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(items.reduce((s, i) => s + p(i.lc_sgst_a), 0), 2), bold: true, size: 16 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                                new TableCell({ children: [] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(items.reduce((s, i) => s + p(i.lc_cgst_a), 0), 2), bold: true, size: 16 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(items.reduce((s, i) => s + p(i.lc_amount), 0), 2), bold: true, size: 16 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ columnSpan: 10, children: [new Paragraph({ children: [new TextRun({ text: "TotalAmount", bold: true, size: 20 })], alignment: AlignmentType.RIGHT })], verticalAlign: VerticalAlign.CENTER }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Math.round(inv.inv_total || items.reduce((s, i) => s + p(i.lc_amount), 0)).toString(), bold: true, size: 20 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                            ]
                        })
                    ],
                }),

                new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }), // Spacer
                new Paragraph({
                    children: [
                        new TextRun({ text: "Tax amount payable on reverse charges (in Rs.) : Nil", size: 18 }),
                    ],
                }),

                new Paragraph({ children: [new TextRun({ text: "", size: 80 })] }), // Larger Spacer for signatures

                // Bottom section (Signatures)
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                         top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE },
                        insideVertical: { style: BorderStyle.NONE },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: "___________________________", size: 18 })], alignment: AlignmentType.CENTER }),
                                        new Paragraph({ children: [new TextRun({ text: "Sign of Customer Or His Agent", size: 18 })], alignment: AlignmentType.CENTER }),
                                    ],
                                }),
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: (inv.branch_name || "SARATHY MOTORS").toUpperCase(), bold: true, size: 18 })], alignment: AlignmentType.CENTER }),
                                        new Paragraph({ children: [new TextRun({ text: "", size: 12 })] }), // Spacer
                                        new Paragraph({ children: [new TextRun({ text: "___________________________", size: 18 })], alignment: AlignmentType.CENTER }),
                                        new Paragraph({ children: [new TextRun({ text: "Sign of Customer Or His Agent", size: 18 })], alignment: AlignmentType.CENTER }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }],
    });

    return await Packer.toBuffer(doc);
}

function createDetailParagraphs(inv) {
    const leftLabels = ["Invoice No", "Jobcard No", "Customer Name", "Customer GSTIN", "Model Name", "Registration No", "Mechanic Name"];
    const leftValues = [inv.inv_no, inv.inv_job_card_no, inv.inv_cus, inv.inv_cus_gstin, inv.inv_modl, inv.in_registr, inv.inv_mechna];
    
    const rightLabels = ["Invoice Date", "Jobcard Date", "Mobile No", "Repair Type", "KM Reading", "Adviser Name", "Branch Name"];
    const rightValues = [fmtDate(inv.inv_inv_date), fmtDate(inv.inv_jcard_date), inv.inv_pho, inv.inv_repair_typ, inv.inv_km, inv.inv_advisername, inv.branch_name];

    const paragraphs = [];
    for (let i = 0; i < leftLabels.length; i++) {
        paragraphs.push(new Paragraph({
            tabStops: [
                { type: "left", position: 4500 }, // Adjusted for larger margins
            ],
            children: [
                new TextRun({ text: leftLabels[i], bold: true, size: 20 }),
                new TextRun({ text: " : " + (leftValues[i] || ""), size: 20 }),
                new TextRun({ text: "\t", bold: false }), // Tab to right column
                new TextRun({ text: rightLabels[i], bold: true, size: 20 }),
                new TextRun({ text: " : " + (rightValues[i] || ""), size: 20 }),
            ],
            spacing: { after: 120 },
        }));
    }
    return paragraphs;
}

module.exports = { generateInvoiceWord };
