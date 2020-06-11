const fs = require('fs');
const { ObjectId, GridFSBucket } = require('mongodb');

const { getDBReference } = require('../lib/mongo');

exports.getSubmissionsByAssignmentId = async (assignmentid, page) => {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, {
    bucketName: 'files'
  });

  if (ObjectId.isValid(assignmentid)) {
    const collection = db.collection('files.files');
    const count = await collection.countDocuments( { "metadata.assignmentId": { $eq: assignmentid } } );

    const pageSize = 10;
    const lastPage = Math.ceil(count / pageSize);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;

    const results = await collection
      .find({ "metadata.assignmentId": assignmentid })
      .skip(offset)
      .limit(pageSize)
      .toArray();

    const submissions = results.map((submission) => {
      return {
        assignmentId: submission.metadata.assignmentId,
        studentId: submission.metadata.userId,
        timestamp: submission.metadata.timestamp,
        file: `/assignments/${submission.metadata.assignmentId}/submissions/${submission._id}`
      };
    });

    //console.log(offset);
    //console.log(submissions);
    var links = {};
    if (page < lastPage) {
      links['nextPage'] = `/assignments/${assignmentid}/submissions?page=${page + 1}`;
      links['lastPage'] = `/assignments/${assignmentid}/submissions?page=${totalPages}`;
    }
    if (page > 1) {
      links['prevPage'] = `/assignments/${assignmentid}/submissions?page=${page - 1}`;
      links['firstPage'] = `/assignments/${assignmentid}/submissions?page=1`;
    }

    return {
      submissions: submissions,
      page: page,
      totalPages: lastPage,
      pageSize: pageSize,
      count: count,
      links: links
    };
  } else {
    return null;
  }
};

exports.saveSubmissionFile = async (file) => {
  return new Promise((resolve, reject) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, {
      bucketName: 'files'
    });


    const metadata = {
      contentType: file.contentType,
      assignmentId: file.assignmentId,
      userId: file.userId,
      timestamp: file.timestamp
    };

    const uploadStream = bucket.openUploadStream(
      file.originalname,
      { metadata: metadata }
    );

    fs.createReadStream(file.path)
      .pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
  });
};

exports.removeUploadedFile = async (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.getFileDownloadStreamById = (id) => {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, {
    bucketName: 'files'
  });

  if (ObjectId.isValid(id)) {
    return bucket.openDownloadStream(new ObjectId(id));
  } else {
    return null;
  }

};
