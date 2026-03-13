/**
 * Convert a number to words (Indian Rupees)
 * Ported from the PHP convert_number function
 */
function convertNumberToWords(number) {
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

function convertWholeNumber(num, ones, tens) {
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

module.exports = { convertNumberToWords };
