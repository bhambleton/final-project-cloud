const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
// Get student by Id :) const { getStudentsByCourseId } = require('./student');
// Get assignment by Id :) const { getAssignmentyCourseId } = require('./assignment');

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
    console.log("==course", course);
    const db = getDBReference();
    const collection = db.collection('Courses');
    const result = await collection.updateOne(
        { _id: ObjectId(id)},
        { $set: course}
        );
    console.log("==result", result);
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


async function getCourseAssignmentsById(id) {
    /*
     * Execute three sequential queries to get all of the info about the
     * specified Course, including its photos.
     */
    const Course = await getCourseById(id);
    responseBody = []
    if (Course) {
        assignment = await getAssignmentByCourseId(id);

        for (i = 0; i < assignment.length; i++) {
            id = assignment[i]._id
            responseBody.push(`id: ${id}`)
        }
    }
    Course.assignments = responseBody
    return Course;
}
exports.getCourseAssignmentsById = getCourseAssignmentsById;

async function getTeacherIdByCourseId(id) {
    /*
     * Execute three sequential queries to get all of the info about the
     * specified Course, including its photos.
     */
    const Course = await getCourseById(id);
    return Course.instructorID;
}
exports.getTeacherIdByCourseId = getTeacherIdByCourseId;

async function getCourseById(id) {
    const db = getDBReference();
    const collection = db.collection('Courses');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({ _id: new ObjectId(id) })
            .project({ students: 0 })
            .toArray();
        return results[0];
    }
}
exports.getCourseById = getCourseById;

async function deleteCourseById(id) {
    const db = getDBReference();
    const collection = db.collection('Courses');
    const result = await collection.deleteOne({
        _id: new ObjectId(id)

    });
    return result.deletedCount > 0;
}
exports.deleteCourseById = deleteCourseById;
