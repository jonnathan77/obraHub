const admin = require('firebase-admin')
const serviceAccount = require('../firebase-key.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: '<SEU_BUCKET>.appspot.com'
})

const db = admin.firestore()
const auth = admin.auth()
const bucket = admin.storage().bucket()

module.exports = { db, auth, bucket }
