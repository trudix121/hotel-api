const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt')

const client = new MongoClient(process.env.database_query, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Database was connected!");
  }
  catch(error){
    console.log(error)
  }
}
run().catch(console.dir);

async function Login(username, pass){
  const db = await client.db("hotel_soft").collection('credentials_admin')

  const user = await db.findOne({
    'username':username,
  })
  const match = await bcrypt.compare(pass,user.password)

  if(match == false){
    return false
  }
  return user
  
}

async function LoginServices(username,pass){
  const db = await client.db("hotel_soft").collection('credentials_services')

  const rest = await db.findOne({
    username:username,
  }) 

  if(rest == null){return false}

  const match = await bcrypt.compare(pass,rest.password)

  if(match == false){
    return false
  }
  return rest



}

async function updateAllRoomsWithUniqueCode() {
  try {
    const roomsCollection = client.db("hotel_soft").collection('rooms');
    
    // Găsește toate camerele care nu au cod
    const rooms = await roomsCollection.find({ code: { $exists: false } }).toArray();
    console.log(`Găsite ${rooms.length} camere pentru actualizare`);

    // Obține toate codurile existente pentru a evita duplicate
    const existingRooms = await roomsCollection.find({ code: { $exists: true } }).toArray();
    const existingCodes = existingRooms.map(room => room.code);
    
    // Actualizează fiecare cameră cu un cod unic
    for (const room of rooms) {
      const newCode = await generateUniqueRoomCode(existingCodes);
      
      await roomsCollection.updateOne(
        { _id: room._id },
        { 
          $set: { 
            code: newCode,
            updatedAt: new Date()
          }
        }
      );
      console.log(`Camera cu ID ${room._id} actualizată cu codul: ${newCode}`);
    }

    console.log('Actualizare completă!');
    return {
      success: true,
      updatedCount: rooms.length
    };

  } catch (error) {
    console.error('Eroare la actualizarea camerelor:', error);
    return {
      success: false,
      error: error.message
    };
  }
}






module.exports = {
  client, 
  Login,
  LoginServices
}