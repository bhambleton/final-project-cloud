# Final-Project-CS493

Final-project-cloud created by GitHub Classroom for CS 493: Cloud Application Development during Spring 2020 at Oregon State University with Rob Hess.

## Team Members: 
* Min Chew 
* Brian Hambleton 
* Thuy-Vy Nguyen 
* Mateo Rey-Rosa

### API Info

This is an API for a Canvas-like app that can be used by a school for coursework scheduling and submission. 

API documentation can be viewed using the openapi specification, found at /public/openapi.yaml, which can be imported into [Swagger](https://swagger.io/tools/swagger-editor/).

### Usage

```
$ docker-compose build
$ docker-compose up
```
The API server listens on port 8000 by default.

There are two default users (login info shown below) created to test endpoints using the postman test files in the tests/ directory.

* admin
  * email: admin@tarpaulin.com
  * password: hunter2
* Benny Beaver
  * email: benny.beaver@tarpaulin.com
  * password: beaverfun123
