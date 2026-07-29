export function p(v: any): number {
    return isNaN(parseFloat(v)) ? 0 : parseFloat(v);
}

export function fmt(v: any, dec: number = 2): string {
    if (v === undefined || v === null || v === '') return '0.00';
    return p(v).toFixed(dec);
}

export function fmtDate(d: any): string {
    if (!d) return '';
    try {
        const dt = new Date(d);
        
        if (isNaN(dt.getTime())) {
            if (typeof d === 'string') {
                const parts = d.split('T')[0].split('-');
                if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return String(d).substring(0, 10);
        }
        
        const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
        const parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(dt);
        let dd, mm, yyyy;
        for (const pt of parts) {
            if (pt.type === 'day') dd = pt.value;
            if (pt.type === 'month') mm = pt.value;
            if (pt.type === 'year') yyyy = pt.value;
        }
        if (dd && mm && yyyy) return `${dd}/${mm}/${yyyy}`;

        const fdd = String(dt.getDate()).padStart(2, '0');
        const fmm = String(dt.getMonth() + 1).padStart(2, '0');
        const fyyyy = dt.getFullYear();
        return `${fdd}/${fmm}/${fyyyy}`;
    } catch (e) { 
        if (typeof d === 'string') return d.split('T')[0];
        return String(d).substring(0, 10); 
    }
}

export function formatAmPm(date: Date): string {
    let hours = date.getHours();
    let minutes: any = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + ', ' + hours + ':' + minutes + ' ' + ampm;
}

export function convertNumberToWords(number: number): string {
    if (number === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const num = Math.floor(Math.abs(number));
    const decimal = Math.round((Math.abs(number) - num) * 100);

    let words = '';

    if (num === 0) {
        words = 'Zero';
    } else {
        words = convertWholeNumber(num, ones, tens);
    }

    let result = words.trim() + ' Rupees';
    if (decimal > 0) {
        result += ' and ' + convertWholeNumber(decimal, ones, tens).trim() + ' Paise';
    }
    result += ' Only';

    return result;
}

function convertWholeNumber(num: number, ones: string[], tens: string[]): string {
    let words = '';

    if (Math.floor(num / 10000000) > 0) {
        words += convertWholeNumber(Math.floor(num / 10000000), ones, tens) + ' Crore ';
        num %= 10000000;
    }

    if (Math.floor(num / 100000) > 0) {
        words += convertWholeNumber(Math.floor(num / 100000), ones, tens) + ' Lakh ';
        num %= 100000;
    }

    if (Math.floor(num / 1000) > 0) {
        words += convertWholeNumber(Math.floor(num / 1000), ones, tens) + ' Thousand ';
        num %= 1000;
    }

    if (Math.floor(num / 100) > 0) {
        words += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
    }

    if (num > 0) {
        if (num < 20) {
            words += ones[num];
        } else {
            words += tens[Math.floor(num / 10)];
            if (num % 10 > 0) {
                words += ' ' + ones[num % 10];
            }
        }
    }

    return words;
}
