const {client} = require('../database/db')
module.exports = getCollections = () => ({
    rooms: client.db('hotel_soft').collection('rooms'),
    roomsInfo: client.db('hotel_soft').collection('rooms_infos')
});
