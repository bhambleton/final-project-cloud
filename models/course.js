const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
const { getUserProjById} = require('./user');
const CourseSchema = {
    subject: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorID: { required: true }
};
exports.CourseSchema = CourseSchema;

async function getCoursesPage(page) {
    const db = getDBReference();
    const collection = db.collection('Courses');
    const count = await collection.countDocuments();

    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
    const pageSize = 10;
    const lastPage = Math.ceil(count / pageSize);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;

    const results = await collection.find({})
        .sort({ _id: 1 })
        .skip(offset)
        .limit(pageSize)
        .toArray();

    return {
        Courses: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    };
}
exports.getCoursesPage = getCoursesPage;

async function insertNewCourse(course) {
    course = extractValidFields(course, CourseSchema);
    const db = getDBReference();
    const collection = db.collection('Courses');
    const result = await collection.insertOne(course);
    return result.insertedId;
}
exports.insertNewCourse = insertNewCourse;

async function updateCourse(id, course) {
    course = extractValidFields(course, CourseSchema);

    const db = getDBReference();
    const collection = db.collection('Courses');
    const result = await collection.updateOne(
        { _id: ObjectId(id)},
        { $set: course}
        );

    return id;
}
exports.updateCourse = updateCourse;

async function updateCourseEnrollment(id, course) {
     const db = getDBReference();
     const collection = db.collection('Courses');

     if(course.add){
        const result = await collection.updateOne(
            { _id: ObjectId(id) },
            { $push: {"students" : {$each: course.add }}}
        );
    }

    if(course.remove){
        const result = await collection.updateOne(
            { _id: ObjectId(id) },
            { $pullAll: { "students" : course.remove }}
        );
    }

    return id;
}
exports.updateCourseEnrollment = updateCourseEnrollment;

async function getCourseById(id) {
    const db = getDBReference();
    const collection = db.collection('Courses');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({ _id: new ObjectId(id) })
            .toArray();
        return results[0];
    }
}
exports.getCourseById = getCourseById;

async function getStudentsInCourse(course){
    students = []
    project = {courses: 0, role: 0, password: 0 }
    for(var index in course.students){
        var student = await getUserProjById(course.students[index], project);
        if(student)
            students.push(student[0]);
    }

    return students;
}
exports.getStudentsInCourse = getStudentsInCourse;

async function getTeacherIdByCourseId(id) {
    /*
     * Execute three sequential queries to get all of the info about the
     * specified Course.
     */
    const Course = await getCourseById(id);
    if(Course){
     return Course.instructorID;
    }
    return null;
}
exports.getTeacherIdByCourseId = getTeacherIdByCourseId;

// Get course information without students and assignments
async function getCourseInfoById(id) {
    const db = getDBReference();
    const collection = db.collection('Courses');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({ _id: new ObjectId(id) })
            .project({ students: 0, assignments: 0 })
            .toArray();
        return results[0];
    }
}
exports.getCourseInfoById = getCourseInfoById;

async function deleteCourseById(id) {
    const db = getDBReference();
    const collection = db.collection('Courses');
    const result = await collection.deleteOne({
        _id: new ObjectId(id)

    });
    return result.deletedCount > 0;
}
exports.deleteCourseById = deleteCourseById;

async function isStudentEnrolled(userid, courseid) {
  const Course = await getCourseById(courseid);

  return Course ? Course.students.includes(userid) : false;
}
exports.isStudentEnrolled = isStudentEnrolled;
