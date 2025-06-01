const db = require("../config/db");

const createBoard = async (req, res) => {
  const { name, description } = req.body;
  const ownerUserId = req.user.userId;

  if (!name) {
    return res.status(400).json({ message: "O nome do quadro é obrigatório." });
  }

  try {
    const insertBoardQuery = `
      INSERT INTO boards (name, description, owner_user_id)
      VALUES ($1, $2, $3)
      RETURNING board_id, name, description, owner_user_id, created_at;
    `;
    const newBoard = await db.query(insertBoardQuery, [
      name,
      description || null,
      ownerUserId,
    ]);

    res.status(201).json(newBoard.rows[0]);
  } catch (error) {
    console.error("Erro ao criar quadro:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao tentar criar o quadro." });
  }
};

const getUserBoards = async (req, res) => {
  const ownerUserId = req.user.userId;

  try {
    const getBoardsQuery = `
      SELECT board_id, name, description, created_at, updated_at
      FROM boards
      WHERE owner_user_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(getBoardsQuery, [ownerUserId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar quadros do usuário:", error);
    res.status(500).json({
      message: "Erro interno do servidor ao tentar buscar os quadros.",
    });
  }
};

const getBoardById = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.userId;

  try {
    const getBoardQuery = `
      SELECT board_id, name, description, owner_user_id, created_at, updated_at
      FROM boards
      WHERE board_id = $1 AND owner_user_id = $2;
    `;
    const { rows } = await db.query(getBoardQuery, [boardId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          "Quadro não encontrado ou você não tem permissão para acessá-lo.",
      });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar quadro por ID:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao tentar buscar o quadro." });
  }
};

const updateBoard = async (req, res) => {
  const { boardId } = req.params;
  const { name, description } = req.body;
  const userId = req.user.userId;

  if (!name && typeof description === "undefined") {
    return res.status(400).json({
      message:
        "Forneça pelo menos um campo (nome ou descrição) para atualizar.",
    });
  }

  try {
    const currentBoardQuery =
      "SELECT owner_user_id FROM boards WHERE board_id = $1";
    const boardResult = await db.query(currentBoardQuery, [boardId]);

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ message: "Quadro não encontrado." });
    }
    if (boardResult.rows[0].owner_user_id !== userId) {
      return res.status(403).json({
        message: "Você não tem permissão para atualizar este quadro.",
      });
    }

    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(name);
    }
    if (typeof description !== "undefined") {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }

    queryParams.push(boardId);

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ message: "Nenhum campo fornecido para atualização." });
    }

    const updateBoardQuery = `
      UPDATE boards
      SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE board_id = $${paramIndex}
      RETURNING board_id, name, description, owner_user_id, created_at, updated_at;
    `;

    const { rows } = await db.query(updateBoardQuery, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          "Quadro não encontrado ou você não tem permissão para atualizá-lo.",
      });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar quadro:", error);
    res.status(500).json({
      message: "Erro interno do servidor ao tentar atualizar o quadro.",
    });
  }
};

const deleteBoard = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.userId;

  try {
    const deleteBoardQuery = `
      DELETE FROM boards
      WHERE board_id = $1 AND owner_user_id = $2
      RETURNING board_id;
    `;
    const { rowCount, rows } = await db.query(deleteBoardQuery, [
      boardId,
      userId,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({
        message:
          "Quadro não encontrado ou você não tem permissão para deletá-lo.",
      });
    }
    res.status(200).json({
      message: "Quadro deletado com sucesso.",
      boardId: rows[0].board_id,
    });
  } catch (error) {
    console.error("Erro ao deletar quadro:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Não é possível deletar o quadro. Ele pode conter colunas ou tarefas. Remova-as primeiro.",
      });
    }
    res.status(500).json({
      message: "Erro interno do servidor ao tentar deletar o quadro.",
    });
  }
};

module.exports = {
  createBoard,
  getUserBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
};
