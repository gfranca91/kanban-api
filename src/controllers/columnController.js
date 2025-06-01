const db = require("../config/db");

const createColumn = async (req, res) => {
  const { boardId } = req.params;
  const { title } = req.body;
  const userId = req.user.userId;

  if (!title) {
    return res
      .status(400)
      .json({ message: "O título da coluna é obrigatório." });
  }

  try {
    const boardCheckQuery =
      "SELECT owner_user_id FROM boards WHERE board_id = $1";
    const boardResult = await db.query(boardCheckQuery, [boardId]);

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ message: "Quadro não encontrado." });
    }
    if (boardResult.rows[0].owner_user_id !== userId) {
      return res
        .status(403)
        .json({
          message:
            "Você não tem permissão para adicionar colunas a este quadro.",
        });
    }

    const getMaxOrderQuery =
      "SELECT MAX(column_order) as max_order FROM columns WHERE board_id = $1";
    const maxOrderResult = await db.query(getMaxOrderQuery, [boardId]);
    const nextOrder =
      (maxOrderResult.rows[0].max_order === null
        ? -1
        : maxOrderResult.rows[0].max_order) + 1;

    const insertColumnQuery = `
      INSERT INTO columns (board_id, title, column_order)
      VALUES ($1, $2, $3)
      RETURNING column_id, board_id, title, column_order, created_at;
    `;
    const newColumn = await db.query(insertColumnQuery, [
      boardId,
      title,
      nextOrder,
    ]);

    res.status(201).json(newColumn.rows[0]);
  } catch (error) {
    console.error("Erro ao criar coluna:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao tentar criar a coluna." });
  }
};

const getBoardColumns = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.userId;

  try {
    const boardCheckQuery =
      "SELECT owner_user_id FROM boards WHERE board_id = $1";
    const boardResult = await db.query(boardCheckQuery, [boardId]);

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ message: "Quadro não encontrado." });
    }
    if (boardResult.rows[0].owner_user_id !== userId) {
      return res
        .status(403)
        .json({
          message: "Você não tem permissão para ver as colunas deste quadro.",
        });
    }

    const getColumnsQuery = `
      SELECT column_id, board_id, title, column_order, created_at, updated_at
      FROM columns
      WHERE board_id = $1
      ORDER BY column_order ASC;
    `;
    const { rows } = await db.query(getColumnsQuery, [boardId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar colunas do quadro:", error);
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao tentar buscar as colunas.",
      });
  }
};

const updateColumn = async (req, res) => {
  const { columnId } = req.params;
  const { title, column_order } = req.body;
  const userId = req.user.userId;

  if (!title && typeof column_order === "undefined") {
    return res
      .status(400)
      .json({
        message:
          "Forneça pelo menos um campo (título ou ordem) para atualizar.",
      });
  }

  try {
    const columnCheckQuery = `
      SELECT c.board_id, b.owner_user_id
      FROM columns c
      JOIN boards b ON c.board_id = b.board_id
      WHERE c.column_id = $1;
    `;
    const columnResult = await db.query(columnCheckQuery, [columnId]);

    if (columnResult.rows.length === 0) {
      return res.status(404).json({ message: "Coluna não encontrada." });
    }
    if (columnResult.rows[0].owner_user_id !== userId) {
      return res
        .status(403)
        .json({
          message: "Você não tem permissão para atualizar esta coluna.",
        });
    }

    const boardId = columnResult.rows[0].board_id;
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (title) {
      updateFields.push(`title = $${paramIndex++}`);
      queryParams.push(title);
    }
    if (typeof column_order !== "undefined") {
      updateFields.push(`column_order = $${paramIndex++}`);
      queryParams.push(column_order);
    }

    queryParams.push(columnId);

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ message: "Nenhum campo válido fornecido para atualização." });
    }

    const updateColumnQuery = `
      UPDATE columns
      SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE column_id = $${paramIndex}
      RETURNING column_id, board_id, title, column_order, created_at, updated_at;
    `;

    const { rows } = await db.query(updateColumnQuery, queryParams);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar coluna:", error);
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao tentar atualizar a coluna.",
      });
  }
};

const deleteColumn = async (req, res) => {
  const { columnId } = req.params;
  const userId = req.user.userId;

  try {
    const columnCheckQuery = `
      SELECT b.owner_user_id
      FROM columns c
      JOIN boards b ON c.board_id = b.board_id
      WHERE c.column_id = $1;
    `;
    const columnResult = await db.query(columnCheckQuery, [columnId]);

    if (columnResult.rows.length === 0) {
      return res.status(404).json({ message: "Coluna não encontrada." });
    }
    if (columnResult.rows[0].owner_user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Você não tem permissão para deletar esta coluna." });
    }

    const deleteColumnQuery =
      "DELETE FROM columns WHERE column_id = $1 RETURNING column_id;";
    const { rows } = await db.query(deleteColumnQuery, [columnId]);

    res
      .status(200)
      .json({
        message: "Coluna deletada com sucesso.",
        columnId: rows[0].column_id,
      });
  } catch (error) {
    console.error("Erro ao deletar coluna:", error);
    if (error.code === "23503") {
      return res
        .status(409)
        .json({
          message:
            "Não é possível deletar a coluna. Ela pode conter tarefas. Remova-as primeiro.",
        });
    }
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao tentar deletar a coluna.",
      });
  }
};

module.exports = {
  createColumn,
  getBoardColumns,
  updateColumn,
  deleteColumn,
};
