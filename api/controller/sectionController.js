// controllers/sectionController.js
const Section = require("../models/Section");
const User = require("../models/User");
const mongoose = require("mongoose");
// Create new section
const createSection = async (req, res) => {
  try {
    const { name, hod, description, session } = req.body;

    if (!name || !session) {
      return res.status(400).json({
        status: "error",
        message: "Section name and session are required.",
        data: null,
      });
    }

    // Validate HOD
    if (hod) {
      const user = await User.findById(hod);
      if (!user || user.role !== "head_of_department") {
        return res.status(400).json({
          status: "error",
          message: "Provided HOD is invalid or not a head_of_department.",
          data: null,
        });
      }
    }

    // Validate Session
    if (!mongoose.Types.ObjectId.isValid(session)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid session ID.",
        data: null,
      });
    }

    const section = await Section.create({ name, hod, description, session });

    res.status(201).json({
      status: "success",
      message: "Section created successfully.",
      data: section,
    });
  } catch (error) {
    console.error("Error creating section:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create section.",
      data: error.message || error,
    });
  }
};

// (Optional) Get all sections
const getAllSections = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const sessionObjectId = mongoose.Types.ObjectId(sessionId);
    const sections = await Section.find({ session: sessionObjectId }).populate(
      "hod",
      "fullname email"
    );
    res.status(200).json({
      status: "success",
      message: "Sections retrieved successfully.",
      data: sections,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve sections.",
      data: error.message || error,
    });
  }
};

// Get all teachers in a section
// const getTeachersBySection = async (req, res) => {
//   try {
//     const sectionId = req.params.sectionId;

//     if (!sectionId) {
//       return res.status(400).json({
//         status: "error",
//         message: "Section ID is required.",
//         data: null,
//       });
//     }

//     const teachers = await User.find({
//       role: "teacher",
//       tradeSection: sectionId,
//     }).select("fullname email phone photourl");

//     res.status(200).json({
//       status: "success",
//       message: "Teachers retrieved successfully.",
//       data: teachers,
//     });
//   } catch (error) {
//     console.error("Error fetching teachers:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Failed to retrieve teachers.",
//       data: error.message || error,
//     });
//   }
// };

const getTeachersBySection = async (req, res) => {
  try {
    const { sectionId, sessionId } = req.params;

    if (!sectionId || !sessionId) {
      return res.status(400).json({
        status: "error",
        message: "Both Section ID and Session ID are required.",
        data: null,
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sectionId) ||
      !mongoose.Types.ObjectId.isValid(sessionId)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid section or session ID format.",
        data: null,
      });
    }

    const teachers = await User.find({
      role: "teacher",
      tradeSection: sectionId,
      session: sessionId,
    }).select("fullname email phone photourl");

    if (!teachers || teachers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No teachers found for the given section and session.",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Teachers retrieved successfully.",
      data: teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve teachers.",
      data: error.message || error,
    });
  }
};
// Get all students in a section
// const getStudentsBySection = async (req, res) => {
//   try {
//     const sectionId = req.params.sectionId;

//     if (!sectionId) {
//       return res.status(400).json({
//         status: "error",
//         message: "Section ID is required.",
//         data: null,
//       });
//     }

//     const students = await User.find({
//       role: "student",
//       tradeSection: sectionId,
//     }).select("fullname email phone photourl");

//     res.status(200).json({
//       status: "success",
//       message: "Students retrieved successfully.",
//       data: students,
//     });
//   } catch (error) {
//     console.error("Error fetching students:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Failed to retrieve students.",
//       data: error.message || error,
//     });
//   }
// };
const getStudentsBySection = async (req, res) => {
  try {
    const { sectionId, sessionId } = req.params;

    if (!sectionId || !sessionId) {
      return res.status(400).json({
        status: "error",
        message: "Both section and session ID are required.",
        data: null,
      });
    }

    const students = await User.find({
      role: "student",
      tradeSection: sectionId,
      session: sessionId,
    }).select("fullname email phone photourl tech");

    res.status(200).json({
      status: "success",
      message: "Students retrieved successfully.",
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve students.",
      data: error.message || error,
    });
  }
};

const getStudentsByTech = async (req, res) => {
  try {
    const { sectionId, tech } = req.params;

    if (!["tech_1", "tech_2", "tech_3"].includes(tech)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid tech. Use tech_1, tech_2, or tech_3.",
        data: null,
      });
    }

    const students = await User.find({
      role: "student",
      tradeSection: sectionId,
      tech,
    }).select("fullname email phone photourl");

    res.status(200).json({
      status: "success",
      message: `Students in ${tech} retrieved successfully.`,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve students by tech.",
      data: error.message || error,
    });
  }
};

module.exports = {
  createSection,
  getAllSections,
  getTeachersBySection,
  getStudentsBySection,
  getStudentsByTech,
};
