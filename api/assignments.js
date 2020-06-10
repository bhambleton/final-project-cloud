const router = require('express').Router();
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


module.exports = router;