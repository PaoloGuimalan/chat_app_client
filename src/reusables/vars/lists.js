const monthList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const currentYear = (new Date()).getFullYear();
const validYear = currentYear - 15;
const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));
const finalYears = range(validYear, validYear - 50, -1)

const getDaysInMonth = (monthProp, year) => {
    const month = monthList.indexOf(monthProp)
    var date = new Date(year, month, 1);
    var days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date).getDate());
      date.setDate(date.getDate() + 1);
    }
    return days;
}

export {
    monthList,
    finalYears as years,
    getDaysInMonth
}