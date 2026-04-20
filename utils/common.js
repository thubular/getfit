
export const formatDate = date => {
    var day = date.getDate();
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var month = monthNames[date.getMonth()];
    var formattedDate = day + ' ' + month;
    return formattedDate;
}

export const defaultPicture = require('../assets/images/favicon.png');