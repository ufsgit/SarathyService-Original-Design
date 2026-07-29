import { CustomTableLayout } from 'pdfmake/interfaces';

export const invoiceLayout: CustomTableLayout = {
    hLineWidth: (i: number, node: any) => 1,
    vLineWidth: (i: number, node: any) => 1,
    hLineColor: (i: number, node: any) => '#000',
    vLineColor: (i: number, node: any) => '#000',
    paddingLeft: (i: number, node: any) => 4,
    paddingRight: (i: number, node: any) => 4,
    paddingTop: (i: number, node: any) => 2,
    paddingBottom: (i: number, node: any) => 2,
};

export const noBordersLayout: CustomTableLayout = {
    hLineWidth: (i: number, node: any) => 0,
    vLineWidth: (i: number, node: any) => 0,
    paddingLeft: (i: number, node: any) => 0,
    paddingRight: (i: number, node: any) => 0,
    paddingTop: (i: number, node: any) => 1,
    paddingBottom: (i: number, node: any) => 1,
};

export const summaryLayout: CustomTableLayout = {
    hLineWidth: (i: number, node: any) => 1,
    vLineWidth: (i: number, node: any) => 1,
    hLineColor: (i: number, node: any) => '#000',
    vLineColor: (i: number, node: any) => '#000',
    paddingLeft: (i: number, node: any) => 4,
    paddingRight: (i: number, node: any) => 4,
    paddingTop: (i: number, node: any) => 2,
    paddingBottom: (i: number, node: any) => 2,
};
