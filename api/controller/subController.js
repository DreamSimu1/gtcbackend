const Subject = require("../models/Subject");
const User = require("../models/User");

const Session = require("../models/Session");
const mongoose = require("mongoose");

const createSubject = async (req, res) => {
  const { name, teacherUsername, classname, tradeSectionId } = req.body;
  const { sessionId } = req.params;

  console.log("Received form data:", req.body);
  console.log("Received session from params:", sessionId);

  try {
    // Find teacher by username
    const teacher = await User.findOne({
      username: teacherUsername,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    if (!["tech_1", "tech_2", "tech_3"].includes(classname)) {
      return res.status(400).json({
        error: "Invalid classname. Must be tech_1, tech_2, or tech_3",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tradeSectionId)) {
      return res.status(400).json({ error: "Invalid trade section ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    // Create subject
    const newSubject = new Subject({
      name,
      teacher: teacher._id,
      classname,
      tradeSection: tradeSectionId,
      session: sessionId,
    });

    const savedSubject = await newSubject.save();
    res.status(201).json(savedSubject);
  } catch (err) {
    console.error("Error creating subject:", err);
    res.status(500).json({ error: "Failed to create subject" });
  }
};
const getSubjectsByTradeSection = async (req, res) => {
  const { tradeSectionId, sessionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tradeSectionId)) {
    return res.status(400).json({ error: "Invalid trade section ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: "Invalid session ID" });
  }

  try {
    const subjects = await Subject.find({
      tradeSection: tradeSectionId,
      session: sessionId,
    })
      .populate("teacher", "fullname username") // Optional: populate teacher details
      .exec();

    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

// const addSessionToSubjectWithoutSession = async (req, res) => {
//   try {
//     const { sessionId } = req.body;

//     const session = await Session.findById(sessionId);
//     if (!session) {
//       return res.status(400).json({ error: "Invalid session ID" });
//     }

//     const updateResult = await Subject.updateMany(
//       { session: { $exists: false } },
//       { $set: { session: sessionId } }
//     );

//     res.status(200).json({
//       message: "Subjects updated successfully",
//       matchedCount: updateResult.matchedCount,
//       modifiedCount: updateResult.modifiedCount,
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Server Error" });
//   }
// };

// const updateSubject = async (req, res) => {
//   const { subjectId } = req.params;
//   const { name, teacher, classname } = req.body;

//   try {
//     const subject = await Subject.findById(subjectId);
//     if (!subject) {
//       return res.status(404).json({ error: "Subject not found" });
//     }

//     subject.name = name;
//     subject.teacher = teacher;
//     subject.classname = classname;

//     const updatedSubject = await subject.save();
//     res.status(200).json(updatedSubject);
//   } catch (error) {
//     console.error("Error updating subject:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// const getallSubject = async (req, res) => {
//   try {
//     const subjects = await Subject.find();
//     res.status(200).json(subjects);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// const getSubjectsByClass = async (req, res) => {
//   const { classname, sessionId } = req.params;

//   try {
//     const sessionObjectId = mongoose.Types.ObjectId(sessionId);

//     const subjects = await Subject.find({
//       classname,
//       session: sessionObjectId,
//     }).exec();

//     if (!subjects || subjects.length === 0) {
//       return res.status(404).json({
//         error: "No subjects found for the specified class and session",
//       });
//     }

//     res.status(200).json(subjects);
//   } catch (err) {
//     console.error("Error fetching subjects:", err);
//     res.status(500).json({ error: "Failed to get subjects" });
//   }
// };

// const getStudentSubjects = async (req, res) => {
//   const { classname } = req.user.user;
//   console.log("Class Name:", classname);

//   try {
//     const subjects = await Subject.find({ classname }, "name");
//     console.log("Subjects found:", subjects);
//     res.status(200).json({ subjects });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// const deleteSubject = async (req, res) => {
//   const { subjectId } = req.params;

//   try {
//     const deletedSubject = await Subject.findByIdAndDelete(subjectId);

//     if (!deletedSubject) {
//       return res.status(404).json({ error: "Subject not found" });
//     }

//     res.status(200).json({
//       message: "Subject deleted successfully",
//       deletedSubject,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

module.exports = {
  createSubject,
  getSubjectsByTradeSection,
  // addSessionToSubjectWithoutSession,
  // updateSubject,
  // getallSubject,
  // getSubjectsByClass,
  // getStudentSubjects,
  // deleteSubject,
};
