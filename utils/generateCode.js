async function generateUniqueCode(existingCodes) {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = Math.floor(1000 + Math.random() * 9000);
      if (!existingCodes.includes(code)) {
        existingCodes.push(code);
        isUnique = true;
      }
    }
    return code;
  }
  