
module.exports = {
  fs_key: process.env.KEY,
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'http://familyfound.local:3000',
  mongo: process.env.MONGO || 'mongodb://localhost/familyfounder',
	secret: process.env.SECRET || 'make!@#$&*(thismoresecret'
}

if (!module.exports.fs_key) {
  throw new Error('No FamilySearch Dev Key specified! It is required.')
}

