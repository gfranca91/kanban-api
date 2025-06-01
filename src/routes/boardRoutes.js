const express = require("express");
const router = express.Router();
const {
  createBoard,
  getUserBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} = require("../controllers/boardController");
const {
  createColumn,
  getBoardColumns,
} = require("../controllers/columnController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createBoard);
router.get("/", protect, getUserBoards);
router.get("/:boardId", protect, getBoardById);
router.put("/:boardId", protect, updateBoard);
router.delete("/:boardId", protect, deleteBoard);

router.post("/:boardId/columns", protect, createColumn);
router.get("/:boardId/columns", protect, getBoardColumns);

module.exports = router;
