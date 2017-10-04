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
    return profileInCache
  }
  // get user profile from local db
  const profileInDB = await knex('users')
    .where({ platform: 'LINE', userId })
    .then()
    .get(0)
    .then()
  if (profileInDB) {
    const profile = dbEntryToProfile(profileInDB)
    userCache.set(userId, profile)
    return profile
  }
  // get user profile from LINE server
  const profileFromLINE = {
    id: userId,
    pictureUrl: null,
    displayName: null,
    statusMessage: null,
    ...(await line.getUserProfile(userId))
  }
  userCache.set(userId, profileFromLINE)
  await bp.db.saveUser(profileToDbEntry(profileFromLINE))
  return profileFromLINE
}

function profileToDbEntry(profile) {
  return {
    platform: 'LINE',
    id: profile.id,
    picture_url: profile.pictureUrl,
    first_name: profile.displayName,
    last_name: profile.statusMessage, // save status message to last_name temporarily
    gender: 'unknown',
    timezone: null,
    locale: null
  }
}

function dbEntryToProfile(db) {
  return {
    id: db.userId,
    pictureUrl: db.picture_url,
    displayName: db.first_name,
    statusMessage: db.last_name
  }
}
