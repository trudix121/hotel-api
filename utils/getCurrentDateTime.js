module.exports = getCurrentDateTime = () => {
    const now = new Date();
    
    // Get day, month, and year with proper padding
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // +1 because months are 0-indexed
    const year = now.getFullYear();
    
    // Get hours and minutes with proper padding
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return {
        date: `${day}/${month}/${year}`,
        time: `${hours}.${minutes}`,
        fullDate: `${day}/${month}/${year}`
    };
};