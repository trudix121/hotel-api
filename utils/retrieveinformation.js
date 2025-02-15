const {client} = require('../database/db')


async function GetProductsDetails(products) {
    const db = client.db('hotel_soft').collection('restaurant_recipes');

    const productNames = await Promise.all(
        products.map(async (item) => {
            const rest = await db.findOne({ _id: `${item}` });
            return rest 
        })
    );

    return productNames;
}

module.exports = GetProductsDetails