module.exports = function generatePassword() {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({length: 10}, () => 
        letters[Math.floor(Math.random() * letters.length)]
    ).join('');
}
