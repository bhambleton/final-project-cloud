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


// to test our assignments-firsthalf routes
//
// After calling the POST /users route, run this insertOne to the mongoDB shell before testing the assignments-firsthalf routes
/*
db.Courses.insertOne(
  {
    "subject": "MATH",
    "number": 123,
    "title": "Discrete",
    "instructorId": "...",  // fill ... with the returned userId from POST /users (make a new Instructor)
    "term": "fall 202"
  }
)
*/