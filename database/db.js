const { MongoClient, ServerApiVersion } = require('mongodb');


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
    'password':pass
  })
  if(user == null){
    return false
  }
    return user
  
}

async function LoginServices(username,pass){
  const db = await client.db("hotel_soft").collection('credentials_services')
  const rest = await db.findOne({
    username:username,
    password:pass
  }) 

  if(rest == null){
    return false
  }
  return rest
}








module.exports = {
  client, 
  Login,
  LoginServices
}