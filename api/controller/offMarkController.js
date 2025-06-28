const mongoose = require("mongoose");
const Mark = require("../models/Mark");
const Exam = require("../models/Exam");
const Session = require("../models/Session");

const saveMark = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const { examId, subjectId, updates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    if (!updates || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ message: "Invalid or missing updates array" });
    }

    const existingMarks = await Mark.findOne({ examId, subjectId, sessionId });

    if (!existingMarks || existingMarks.marks.length === 0) {
      const savedMarks = await Mark.create({
        examId,
        subjectId,
        session: sessionId,
        marks: updates.map((mark) => ({
          studentId: mark.studentId,
          subjectId,
          testscore: mark.testscore,
          examscore: mark.examscore,
          marksObtained: mark.marksObtained,
          comment: mark.comment,
        })),
      });

      return res
        .status(201)
        .json({ message: "Marks saved successfully", savedMarks });
    }

    existingMarks.marks.forEach((existingMark) => {
      const update = updates.find(
        (mark) => mark.studentId === existingMark.studentId.toString()
      );
      if (update) {
        Object.assign(existingMark, update);
      }
    });

    await existingMarks.save();

    res.status(200).json({
      message: "Marks updated successfully",
      updatedMarks: existingMarks,
    });
  } catch (error) {
    console.error("Error saving/updating marks:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMark = async (req, res) => {
  try {
    const { examName, sessionId } = req.params;
    const fetchedExam = await Exam.findOne({ name: examName });
    const sessionObjectId = mongoose.Types.ObjectId(sessionId);

    if (!fetchedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const marks = await Mark.find({
      examId: fetchedExam._id,
      session: sessionObjectId,
    });
    if (marks.length === 0) {
      return res.status(404).json({ message: "Marks not found" });
    }

    const scores = marks.map((mark) => ({
      subjectId: mark.subjectId,
      ...mark.toObject(),
    }));
    res.status(200).json({ examId: fetchedExam._id, scores });
  } catch (error) {
    console.error("Error fetching marks:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMarkbyStudent = async (req, res) => {
  try {
    const { studentId, sessionId } = req.params;

    const marks = await Mark.find({
      "marks.studentId": studentId,
      session: sessionId,
    })
      .populate("examId", "name")
      .populate("marks.subjectId", "name");

    const scores = marks.flatMap((mark) =>
      mark.marks
        .filter(
          (m) =>
            m.studentId.toString() === studentId &&
            (m.testscore || m.examscore) &&
            m.comment.trim() &&
            mark.examId &&
            m.subjectId
        )
        .map((m) => ({
          examId: mark.examId,
          subjectId: m.subjectId,
          examName: mark.examId.name,
          subjectName: m.subjectId.name,
          testscore: m.testscore,
          ...m.toObject(),
        }))
    );

    const uniqueScores = scores.reduce((acc, current) => {
      const isDuplicate = acc.some(
        (item) =>
          item.examId._id.toString() === current.examId._id.toString() &&
          item.subjectId._id.toString() === current.subjectId._id.toString()
      );
      if (!isDuplicate) acc.push(current);
      return acc;
    }, []);

    res.status(200).json({ studentId, sessionId, scores: uniqueScores });
  } catch (error) {
    console.error("Error fetching marks for student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMarkbyStudentwithoutsession = async (req, res) => {
  try {
    const userId = req.params.studentId;
    const marks = await Mark.find({ "marks.studentId": userId })
      .populate("examId", "name")
      .populate("marks.subjectId", "name");

    const uniqueSubjects = new Map();

    const scores = marks.flatMap((mark) =>
      mark.marks
        .filter(
          (m) =>
            m.studentId.toString() === userId &&
            (m.testscore || m.examscore) &&
            m.comment.trim() &&
            mark.examId &&
            m.subjectId
        )
        .map((m) => {
          const subjectKey = m.subjectId._id.toString();
          if (!uniqueSubjects.has(subjectKey)) {
            uniqueSubjects.set(subjectKey, true);
            return {
              examId: mark.examId,
              subjectId: m.subjectId,
              examName: mark.examId.name,
              subjectName: m.subjectId.name,
              testscore: m.testscore,
              ...m.toObject(),
            };
          }
          return null;
        })
        .filter(Boolean)
    );

    res.status(200).json({ studentId: userId, scores });
  } catch (error) {
    console.error("Error fetching marks for student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getScores = async (req, res) => {
  try {
    const { examId, subjectId } = req.params;
    if (
      !mongoose.isValidObjectId(examId) ||
      !mongoose.isValidObjectId(subjectId)
    ) {
      return res.status(400).json({ message: "Invalid ObjectId format" });
    }

    const marks = await Mark.findOne({
      examId: mongoose.Types.ObjectId(examId),
      "marks.subjectId": mongoose.Types.ObjectId(subjectId),
    });

    if (!marks) {
      return res.status(200).json({ examId, subjectId, scores: [] });
    }

    await Mark.populate(marks, {
      path: "marks.studentId",
      select: "studentName",
    });
    const scores = marks.marks.map((m) => ({
      studentId: m.studentId,
      studentName: m.studentId ? m.studentId.studentName : null,
      testscore: m.testscore,
      examscore: m.examscore,
      marksObtained: m.testscore + m.examscore,
      comment: m.comment,
    }));

    res.status(200).json({ examId, subjectId, scores });
  } catch (error) {
    console.error("Error fetching scores:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateMark = async (req, res) => {
  try {
    const { examId, subjectId, testscore, examscore, marksObtained, comment } =
      req.body;
    const studentId = req.params.studentId;

    const result = await Mark.updateOne(
      {
        "marks.studentId": studentId,
        examId,
        "marks.subjectId": subjectId,
      },
      {
        $set: {
          "marks.$[elem].testscore": testscore,
          "marks.$[elem].examscore": examscore,
          "marks.$[elem].marksObtained": marksObtained,
          "marks.$[elem].comment": comment,
        },
      },
      { arrayFilters: [{ "elem.studentId": studentId }] }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ error: "No matching records found" });
    }

    const updatedDocument = await Mark.findOne({
      "marks.studentId": studentId,
      examId,
      "marks.subjectId": subjectId,
    });

    res
      .status(200)
      .json({ message: "Marks updated successfully", updatedDocument });
  } catch (error) {
    console.error("Error updating marks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addSessionToMarks = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const marksToUpdate = await Mark.find({ session: { $exists: false } });
    if (marksToUpdate.length === 0) {
      return res
        .status(404)
        .json({ message: "No marks found without session" });
    }

    for (const mark of marksToUpdate) {
      mark.session = sessionId;
      await mark.save();
    }

    res.status(200).json({
      message: "SessionId added to all marks",
      updated: marksToUpdate.length,
    });
  } catch (error) {
    console.error("Error adding sessionId to marks:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateMarks = async (req, res) => {
  try {
    const { examId, subjectId, updates } = req.body;

    if (!examId || !subjectId || !updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const results = [];
    const updatedDocuments = [];

    for (const update of updates) {
      const { studentId, testscore, examscore, marksObtained, comment } =
        update;

      const filter = {
        examId,
        "marks.studentId": studentId,
        "marks.subjectId": subjectId,
      };

      const updateOperation = {
        $set: {
          "marks.$[elem].testscore": testscore,
          "marks.$[elem].examscore": examscore,
          "marks.$[elem].marksObtained": marksObtained,
          "marks.$[elem].comment": comment,
        },
      };

      const options = {
        arrayFilters: [{ "elem.studentId": studentId }],
        new: true,
      };

      let updatedDoc = await Mark.findOneAndUpdate(
        filter,
        updateOperation,
        options
      );

      if (!updatedDoc) {
        const newMark = {
          subjectId,
          studentId,
          testscore,
          examscore,
          marksObtained,
          comment,
        };

        const fallbackFilter = { examId };
        const fallbackUpdate = { $push: { marks: newMark } };
        const fallbackOptions = { upsert: true, new: true };

        updatedDoc = await Mark.findOneAndUpdate(
          fallbackFilter,
          fallbackUpdate,
          fallbackOptions
        );
      }

      updatedDocuments.push(updatedDoc);
      results.push({ studentId, success: true });
    }

    res.status(200).json({
      message: "Marks updated successfully",
      results,
      updatedDocuments,
    });
  } catch (error) {
    console.error("Error updating marks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  saveMark,
  getMark,
  getMarkbyStudent,
  getMarkbyStudentwithoutsession,
  getScores,
  updateMark,
  addSessionToMarks,
  updateMarks,
};
