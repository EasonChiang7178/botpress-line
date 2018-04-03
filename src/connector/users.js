import LRU from 'lru-cache'

const userCache = LRU({
  max: 20,
  maxAge: 60 * 60 * 1000
})

export const getAllUsers = async bp => {
  const knex = await bp.db.get()
  const users = await knex('users')
    .where({ platform: 'LINE' })
    .then()
  return (users || []).map(dbEntryToProfile)
}

export const getOrFetchUserProfile = async (bp, userId, line) => {
  const knex = await bp.db.get()
  // get user profile from cache
  const profileInCache = userCache.get(userId)
  if (profileInCache) {
    console.log('Profile In Cache');
    return profileInCache
  }
  // get user profile from local db
  
  const profileInDB = await knex('users')
    .where('platform', '=', 'LINE').andWhere('id','like', 'LINE:'+userId)
    .first('users.*')
    .then();
  
  if (typeof profileInDB != 'undefined' && profileInDB != null) {
    const profile = dbEntryToProfile(profileInDB)
    userCache.set(userId, profile)
    console.log('Profile In DB');
    return profile;
  }
  // get user profile from LINE server
  const profileFromLINE = {
    id: userId,
    userId: userId,
    pictureUrl: null,
    displayName: null,
    first_name: null,
    last_name: null,
    statusMessage: null //,
    //...(await line.getUserProfile(userId))
  }

  var oUser = await line.getUserProfile(userId);  
  profileFromLINE.id = userId;
  profileFromLINE.userId = userId;
  profileFromLINE.pictureUrl = oUser.pictureUrl; 
  profileFromLINE.displayName = oUser.displayName; 
  profileFromLINE.first_name = oUser.displayName.split(" ")[0]; 
  profileFromLINE.last_name = oUser.displayName.split(" ")[1];
  profileFromLINE.statusMessage = oUser.statusMessage; 


  userCache.set(userId, profileFromLINE)
  /*await bp.db.saveUser(profileToDbEntry(profileFromLINE)).catch(function(err){
    console.log('Error saving LINE user in DB');
    console.log(err);
  })*/


  await knex.insert(profileToDbEntry(profileFromLINE), 'id')
  .into('users')
  .catch(function(error) {
    console.error(error);
    console.log('Error saving LINE user in DB');
  }).then(function(rows) {
    console.log(rows[0]);
  })


  
  return profileFromLINE
}

function profileToDbEntry(profile) {
  var first_name = profile.displayName.split(" ")[0]; 
  var last_name = profile.displayName.split(" ")[1];
  return {
    platform: 'LINE',
    id: 'LINE:'+profile.id,
    userId: profile.id,
    picture_url: profile.pictureUrl,
    first_name: first_name,
    last_name: last_name, // save status message to last_name temporarily
    gender: 'unknown',
    timezone: null,
    locale: null
  }
}

function dbEntryToProfile(profileInDB) {  
  return {
    id: profileInDB.userId,
    userId: profileInDB.userId,
    pictureUrl: profileInDB.picture_url,
    displayName: profileInDB.first_name,
    first_name: profileInDB.first_name,
    last_name: profileInDB.last_name
  }
}
