//for reference:
//  admin pw = hunter2
//  benny pw = beaverfun123

db.Users.insertMany([
  {
      "name": "admin",
      "email": "admin@tarpaulin.com",
      "password": "$2a$08$rKf9DsJ73XGKBXrk4iMEjeCRuxSMsIokfIEMjILG/4So.gUccwi1i",
      "role": "admin"
  },
  {
      "name": "Benny Beaver",
      "email": "benny.beaver@tarpaulin.com",
      "password": "$2a$08$jkyPmTn42gb4BtYx6ZzvE.TnsQiSUz8xAQyhZymyA.CBiPNSCM30W",
      "role": "student"
  }
])
