const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');


/*
 * Assignment Schema
 */
const AssignmentSchema = {
  courseId: { required: true },
  title: { required: true },
  points: { required: true },
  due: { required: true }
};
exports.AssignmentSchema = AssignmentSchema;


/*
 * Patch Schemas for partial update
 */
const PatchSchema1 = {
  courseId: { required: true },
  title: { required: false },
  points: { required: false },
  due: { required: false }
};
exports.PatchSchema1 = PatchSchema1;

const PatchSchema2 = {
  courseId: { required: false },
  title: { required: true },
  points: { required: false },
  due: { required: false }
};
exports.PatchSchema2 = PatchSchema2;

const PatchSchema3 = {
  courseId: { required: false },
  title: { required: false },
  points: { required: true },
  due: { required: false }
};
exports.PatchSchema3 = PatchSchema3;

const PatchSchema4 = {
  courseId: { required: false },
  title: { required: false },
  points: { required: false },
  due: { required: true }
};
exports.PatchSchema4 = PatchSchema4;


/*
 * Helper function: Check if user is an instructor of a course
 */
exports.isInstructor = async (userId) => {
  const db = getDBReference();
  const user_collection = db.collection('Users');
  const courses_collection = db.collection('Courses');
  
  if (ObjectId.isValid(userId)) {  // get data pertaining to user
    const results = await user_collection.find({ _id: new ObjectId(userId) })
        .toArray();
    let user = results[0];
    
    if (user != undefined && user.role === 'instructor') {  //get courses with this userId
      const courses = await courses_collection.find({ instructorId: userId })
        .toArray();
      
      if (courses[0] != undefined) {  // this instructor is teaching this course
        return true;
      } 
    }
  }
  return false;
};


/*
 * Insert new Assignment into database
 */
async function insertNewAssignment(assignment) {
  assignment = extractValidFields(assignment, AssignmentSchema);
  const db = getDBReference();
  const collection = db.collection('Assignments');
  
  const repeated = await collection.find({ courseId: assignment.courseId, title: assignment.title, points: assignment.points, due: assignment.due })
        .toArray();
  
  if (repeated[0] != undefined) {  // assignment to insert already exists in database
    return 0;
  }
  
  const result = await collection.insertOne(assignment);
  return result.insertedId;
}
exports.insertNewAssignment = insertNewAssignment;


/*
 * Return information about a specific Assignment
 */
async function getAssignmentById(assignmentid) {
  const db = getDBReference();
  const collection = db.collection('Assignments');
  if (!ObjectId.isValid(assignmentid)) {
      return null;
  } else {
      const results = await collection.find({ _id: new ObjectId(assignmentid) })
          .toArray();
      return results[0];
  }
}
exports.getAssignmentById = getAssignmentById;


/*
 * Update information for a specific Assignment
 */
async function updateAssignmentById(assignmentid, assignment) {
  assignment = extractValidFields(assignment, AssignmentSchema);
  const db = getDBReference();
  const collection = db.collection('Assignments');
  
  if (!ObjectId.isValid(assignmentid)) {
      return null;
  } else {
      existingAssignment = await getAssignmentById(assignmentid);
      
      if (assignment.courseId == undefined) {
        assignment.courseId = existingAssignment.courseId;
      }
      if (assignment.title == undefined) {
        assignment.title = existingAssignment.title;
      }
      if (assignment.points == undefined) {
        assignment.points = existingAssignment.points;
      }
      if (assignment.due == undefined) {
        assignment.due = existingAssignment.due;
      }
     
      const results = await collection.update({ _id: ObjectId(assignmentid) }, 
        { courseId: assignment.courseId, title: assignment.title, points: assignment.points, due: assignment.due })
      return results;
  }
}
exports.updateAssignmentById = updateAssignmentById;


/*
 * Remove a specific Assignment from DB
 */
async function removeAssignmentsById(assignmentid) {
  const db = getDBReference();
  const collection = db.collection('Assignments');
  if (!ObjectId.isValid(assignmentid)) {
      return null;
  } else {
      const results = await collection.deleteOne({ _id: ObjectId(assignmentid)})
      return results;
  }
}
exports.removeAssignmentsById = removeAssignmentsById;