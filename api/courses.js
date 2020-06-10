const router = require('express').Router();
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, checkAuthentication } = require('../lib/auth');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const {
    CourseSchema,
    insertNewCourse,
    getCourseById,
    getCourseInfoById,
    getStudentsInCourse,
    getCoursesPage,
    deleteCourseById,
    getTeacherIdByCourseId,
    updateCourse,
    updateCourseEnrollment
} = require('../models/course');

//Get all courses
router.get('/', async (req, res) => {
    try {
        /*
         * Fetch page info, generate HATEOAS links for surrounding pages and then
         * send response.
         */
        const CoursePage = await getCoursesPage(parseInt(req.query.page) || 1);
        CoursePage.links = {};
        if (CoursePage.page < CoursePage.totalPages) {
            CoursePage.links.nextPage = `/Courses?page=${CoursePage.page + 1}`;
            CoursePage.links.lastPage = `/Courses?page=${CoursePage.totalPages}`;
        }
        if (CoursePage.page > 1) {
            CoursePage.links.prevPage = `/Courses?page=${CoursePage.page - 1}`;
            CoursePage.links.firstPage = '/Courses?page=1';
        }
        res.status(200).send(CoursePage);
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Error fetching Courses list.  Please try again later."
        });
    }
});

// Inserting New Course
router.post('/', checkAuthentication, async (req, res) => {
    if (req.role == 'admin'){
        if (validateAgainstSchema(req.body, CourseSchema)) {
            try {
                const id = await insertNewCourse(req.body);
                res.status(201).send({
                    id: id,
                    links: {
                        Course: `/Courses/${id}`
                    }
                });
            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: "Error inserting Course into DB.  Please try again later."
                });
            }
        } else {
            res.status(400).send({
                error: "Request body is not a valid Course object."
            });
        }
    }else{
        res.status(403).send({
            error: "Invalid permissions."
        });

    }
});

// Update the enrollment for a course
router.post('/:id/students', checkAuthentication, async (req, res, next) => {
    const course = await getCourseById(req.params.id);
    if(!course)
        next();
    else{ 
    const teacherID = await getTeacherIdByCourseId(req.params.id);
    if (req.role == 'admin' || req.user == teacherID) {
        if(req.body.add || req.body.remove){
            try {
                await updateCourseEnrollment(req.params.id, req.body);
                res.status(200).send();
            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: "Error updating Course enrollment.  Please try again later."
                });
            }
        }else{
            res.status(400).send({
                error: "Invalid body for updating enrollment."
            });
        }
    } else {
        res.status(403).send({
            error: "Invalid permissions."
        });
    }
}
});

// Get all of the students in a course
 router.get('/:id/students', checkAuthentication, async (req, res, next) => {
    const teacherID = await getTeacherIdByCourseId(req.params.id);
    if(!teacherID){
      next();
    }else{
    if (req.role == 'admin' || req.user == teacherID) {
     try {
         const Course = await getCourseById(req.params.id);
         if (Course) {
             res.status(200).send({
                 "students": Course.students
             });
         } else {
             next();
         }
     } catch (err) {
         console.error(err);
         res.status(500).send({
             error: "Unable to fetch Course's students.  Please try again later."
         });
     }
    } else {
        res.status(403).send({
            error: "Invalid permissions."
        });
    }
   }
  });

  // Get a roster of a course (.csv)
 router.get('/:id/roster', checkAuthentication, async (req, res, next) => {
    const teacherID = await getTeacherIdByCourseId(req.params.id);
    if(!teacherID){
      next();
    }else{
    if (req.role == 'admin' || req.user == teacherID) {
     try {
         const Course = await getCourseById(req.params.id);
        
         if (Course) {
            const students = await getStudentsInCourse(Course);
            fs.unlink('./file.csv', function(err) {
                if(err && err.code == 'ENOENT') {
                    console.info("File doesn't exist, won't remove it.");
                } else if (err) {
                    console.error("Error occurred while trying to remove file");
                }
            });
            const csvWriter = createObjectCsvWriter({
                path: './file.csv',
                header: [
                    {id: '_id', title: 'ID'},
                    {id: 'name', title: 'NAME'},
                    {id: 'email', title: 'EMAIL'}
                ]
            });
            await csvWriter.writeRecords(students);
            res.status(200).type("text/csv");
            fs.createReadStream("./file.csv").pipe(res);
            
         } else {
             next();
         }
     } catch (err) {
         console.error(err);
         res.status(500).send({
             error: "Unable to fetch Course's students.  Please try again later."
         });
     }
    } else {
        res.status(403).send({
            error: "Invalid permissions."
        });
    }
   }   
  });

  // Get all of the assignments for a course
router.get('/:id/assignments', async (req, res, next) => {
     try {
         const Course = await getCourseById(req.params.id);
         if (Course) {
             res.status(200).send({
                 "assignments": Course.assignments
             });
         } else {
             next();
         }
     } catch (err) {
         console.error(err);
         res.status(500).send({
             error: "Unable to fetch Course's assignments.  Please try again later."
         });
     }
});

// Fetch Info about specific course (w/out assignments & students enrolled)
router.get('/:id', async (req, res, next) => {
    try {
        const Course = await getCourseInfoById(req.params.id);
        if (Course) {
            res.status(200).send(Course);
        } else {
            next();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to fetch Course.  Please try again later."
        });
    }
});

// Partial update of a course (no students or assignments)
router.patch('/:id', requireAuthentication, async (req, res, next) => {
    const teacherID = await getTeacherIdByCourseId(req.params.id);
    if(!teacherID){
      next();
    }else{
    if (req.role == 'admin' || req.user == teacherID) {
        if (req.body.subject || req.body.number || req.body.title || req.body.instructorID || req.body.term){
            try {
                const id = await updateCourse(req.params.id, req.body);
                res.status(201).send({
                    id: id,
                    links: {
                        Course: `/Courses/${id}`
                    }
                });
            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: "Error updating Course.  Please try again later."
                });
            }
        }else{
            res.status(400).send({
                error: "Invalid body."
            });
        }
    } else {
        res.status(403).send({
            error: "Invalid permissions."
        });
     }
    }
});

// Delete a course
router.delete('/:id', checkAuthentication, async (req, res,next) => {
    if (req.role == 'admin') {
        try{
            const deleteSuccessful = await deleteCourseById(req.params.id);
            if (deleteSuccessful){
                res.status(204).end();
            }else{
                next();
            }
        } catch (err){
            console.log(err);
            res.status(500).send({
                error: "Unable to delete course"
            })
        }
    } else {
        res.status(403).send({
            error: "Invalid permissions."
        });

    }
});


module.exports = router;
