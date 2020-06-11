const router = require('express').Router();
const multer = require('multer');
const moment = require('moment');

const { validateAgainstSchema } = require('../lib/validation');
const { requireAuthentication } = require('../lib/auth');

const {
    AssignmentSchema,
    PatchSchema1,
    PatchSchema2,
    PatchSchema3,
    PatchSchema4,
    isInstructor,
    insertNewAssignment,
    getAssignmentById,
    removeAssignmentsById,
    updateAssignmentById
} = require('../models/assignment');

const { isStudentEnrolled } = require('../models/course');

const { saveSubmissionFile,
        getSubmissionsByAssignmentId,
        removeUploadedFile,
        getFileDownloadStreamById
} = require('../models/submission');

const upload = multer({
    dest: `${__dirname}/uploads`
});

// Add a new Assignment
router.post('/', requireAuthentication, async (req, res) => {
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
        if (req.role == "admin" || await isInstructor(req.user) == true) {  // if admin or instructor of the course
            try {
                const id = await insertNewAssignment(req.body);
                if (id != 0) {
                    res.status(201).send({
                        assignmentId: id
                    });
                } else {
                    res.status(500).send({
                        error: "Assignment already exists in database.  Please insert a new Assignment."
                    });
                }
            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: "Error inserting Assignment into DB.  Please try again later."
                });
            }
        } else {
            res.status(403).send({
                error: "The request was not made by an authenticated User (admin or instructor)."
            });
        }
    } else {
        res.status(400).send({
            error: "The request body was either not present or did not contain a valid Assignment object."
        });
    }
});


// Fetch data about a specific Assignment
router.get('/:assignmentid', async (req, res, next) => {
    try {
        const assignment = await getAssignmentById(req.params.assignmentid);
        if (assignment) {
            res.status(200).send(assignment);
        } else {
            res.status(404).send({
                error: "Specified Assignment `id` not found."
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to fetch Assignment.  Please try again later."
        });
    }
});


// Update data for a specific Assignment
router.patch('/:assignmentid', requireAuthentication, async (req, res, next) => {
    if (validateAgainstSchema(req.body, PatchSchema1) || validateAgainstSchema(req.body, PatchSchema2) ||
     validateAgainstSchema(req.body, PatchSchema3) || validateAgainstSchema(req.body, PatchSchema4)) {
        if (req.role == "admin" || await isInstructor(req.user) == true) {  // if admin or instructor of the course
            try {
                const assignment = await getAssignmentById(req.params.assignmentid);
                if (assignment) {  // if assignment to patch exists in DB
                    const updateStatus = await updateAssignmentById(req.params.assignmentid, req.body);
                    if (updateStatus) {  // successfully updated assignment
                        const updatedAssignment = await getAssignmentById(req.params.assignmentid);
                        res.status(200).send(updatedAssignment);
                    } else {
                        next();
                    }
                } else {
                    res.status(404).send({
                        error: "Specified Assignment `id` not found."
                    });
                }
            } catch (err) {
                console.error(err);
                res.status(500).send({
                    error: "Error updating Assignment into DB.  Please try again later."
                });
            }
        } else {
            res.status(403).send({
                error: "The request was not made by an authenticated User (admin or instructor)."
            });
        }
    } else {
        res.status(400).send({
            error: "The request body was either not present or did not contain a valid Assignment object."
        });
    }
});


// Delete a specific Assignment
router.delete('/:assignmentid', requireAuthentication, async (req, res, next) => {
    if (req.role == "admin" || await isInstructor(req.user) == true) {  // if admin or instructor of the course
        try {
            const assignment = await getAssignmentById(req.params.assignmentid);
            if (assignment) {  // if assignment to delete exists in DB
                const deleteSuccessful = await removeAssignmentsById(req.params.assignmentid);
                if (deleteSuccessful) {  // delete assignment
                    res.status(204).end();
                } else {
                    next();
                }
            } else {
                res.status(404).send({
                    error: "Specified Assignment `id` not found."
                });
            }
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error: "Error deleting Assignment into DB.  Please try again later."
            });
        }
    } else {
        res.status(403).send({
            error: "The request was not made by an authenticated User (admin or instructor)."
        });
    }
});

//fetch assignment submissions
router.get('/:assignmentid/submissions', requireAuthentication, async (req, res, next) => {
  if (req.role == 'admin' || await isInstructor(req.user)) {
      try {
        const submissions = await getSubmissionsByAssignmentId(req.params.assignmentid, (parseInt(req.query.page) || 1));
        if (submissions) {
          res.status(200).send(submissions);
        } else {
          //assignment does not exist
          next();
        }
      } catch (err) {
        console.error("== error:", err);
      }
  } else {
    res.status(403).send({
        error: "The request was not made by an authenticated User (admin or instructor)."
    });
  }
});

//upload new submission for an assignment
router.post('/:assignmentid/submissions', requireAuthentication, upload.single('file'), async (req, res, next) =>{
  //check if user is enrolled in the course this assignment belongs to
  if (req.file){
    try {
      const assignment = await getAssignmentById(req.params.assignmentid);
      if (assignment) {
        if (await isStudentEnrolled(req.user, assignment.courseId)) {
          //student is enrolled in this course

          const time = moment().format();

          const submission = {
            contentType: req.file.mimetype,
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            userId: req.user,
            timestamp: time,
            assignmentId: req.params.assignmentid
          };

          console.log("==file to upload:", submission);

          //save to mongodb
          const id = await saveSubmissionFile(submission);
          //remove from api server file system
          await removeUploadedFile(req.file.path);

          res.status(201).send({
            id: id,
            links: {
              submission: `/assignments/${req.params.assignmentid}/submissions/${id}`
            }
          });
        } else {
          //not enrolled in this course
          res.status(403).send({
              error: "Request made be user not enrolled in this course."
          });
        }
      } else {
        //assignment does not exist
        next();
      }
    } catch (err) {
      console.error("==error:", err);
      res.status(500).send({
        error: "Error uploading assignment. Try again later."
      });
    }
  } else {
    res.status(400).send({
        error: "Request body does not contain valid fields."
    });
  }

});

router.get('/:assignmentid/submissions/:submissionid', requireAuthentication, async (req, res, next) => {
  if (req.role == 'admin' || await isInstructor(req.user)) {
    try {
      getFileDownloadStreamById(req.params.submissionid)
        .on('file', (file) => {
          res.status(200).type(file.metadata.contentType);
        })
        .on('error', (err) => {
          if (err.code === 'ENOENT') {
            next();
          } else {
            next(err);
          }
        })
        .pipe(res);
    } catch (err) {
      console.error("== error:", err);
      res.status(500).send({
        error: "Unable to fetch file. Please try again later."
      });
    }
  } else {
    res.status(403).send({
        error: "The request was not made by an authenticated User (admin or instructor)."
    });
  }
});

module.exports = router;
