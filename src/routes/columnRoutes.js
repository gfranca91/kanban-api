const express = require("express");
const router = express.Router();
const {
  updateColumn,
  deleteColumn,
} = require("../controllers/columnController");
const { createTask, getColumnTasks } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

router.put("/:columnId", protect, updateColumn);
router.delete("/:columnId", protect, deleteColumn);

router.post("/:columnId/tasks", protect, createTask);
router.get("/:columnId/tasks", protect, getColumnTasks);

module.exports = router;
