const db = require("../config/db");

const createTask = async (req, res) => {
  const { columnId } = req.params;
  const { title, description, due_date, priority } = req.body;
  const creatorUserId = req.user.userId;

  if (!title) {
    return res
      .status(400)
      .json({ message: "O título da tarefa é obrigatório." });
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
    if (columnResult.rows[0].owner_user_id !== creatorUserId) {
      return res
        .status(403)
        .json({
          message:
            "Você não tem permissão para adicionar tarefas a esta coluna.",
        });
    }

    const boardId = columnResult.rows[0].board_id;

    const getMaxOrderQuery =
      "SELECT MAX(task_order) as max_order FROM tasks WHERE column_id = $1";
    const maxOrderResult = await db.query(getMaxOrderQuery, [columnId]);
    const nextOrder =
      (maxOrderResult.rows[0].max_order === null
        ? -1
        : maxOrderResult.rows[0].max_order) + 1;

    const insertTaskQuery = `
      INSERT INTO tasks (column_id, board_id, title, description, task_order, creator_user_id, due_date, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING task_id, column_id, board_id, title, description, task_order, creator_user_id, due_date, priority, created_at;
    `;
    const newTask = await db.query(insertTaskQuery, [
      columnId,
      boardId,
      title,
      description || null,
      nextOrder,
      creatorUserId,
      due_date || null,
      priority || null,
    ]);

    res.status(201).json(newTask.rows[0]);
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao tentar criar a tarefa." });
  }
};

const getColumnTasks = async (req, res) => {
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
        .json({
          message: "Você não tem permissão para ver as tarefas desta coluna.",
        });
    }

    const getTasksQuery = `
      SELECT task_id, column_id, board_id, title, description, task_order, due_date, priority, creator_user_id, assigned_user_id, created_at, updated_at
      FROM tasks
      WHERE column_id = $1
      ORDER BY task_order ASC;
    `;
    const { rows } = await db.query(getTasksQuery, [columnId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar tarefas da coluna:", error);
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao tentar buscar as tarefas.",
      });
  }
};

const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const {
    title,
    description,
    task_order,
    column_id,
    due_date,
    priority,
    assigned_user_id,
  } = req.body;
  const userId = req.user.userId;

  if (Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ message: "Forneça pelo menos um campo para atualizar." });
  }

  try {
    const taskCheckQuery = `
      SELECT t.column_id as current_column_id, t.board_id, b.owner_user_id
      FROM tasks t
      JOIN boards b ON t.board_id = b.board_id
      WHERE t.task_id = $1;
    `;
    const taskResult = await db.query(taskCheckQuery, [taskId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }
    if (taskResult.rows[0].owner_user_id !== userId) {
      return res
        .status(403)
        .json({
          message: "Você não tem permissão para atualizar esta tarefa.",
        });
    }

    const currentBoardId = taskResult.rows[0].board_id;
    let targetColumnId = taskResult.rows[0].current_column_id;
    let targetBoardId = currentBoardId;

    if (typeof column_id !== "undefined" && column_id !== targetColumnId) {
      const newColumnCheckQuery = `
        SELECT c.board_id, b.owner_user_id
        FROM columns c
        JOIN boards b ON c.board_id = b.board_id
        WHERE c.column_id = $1;
      `;
      const newColumnResult = await db.query(newColumnCheckQuery, [column_id]);
      if (newColumnResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Nova coluna de destino não encontrada." });
      }
      if (newColumnResult.rows[0].owner_user_id !== userId) {
        return res
          .status(403)
          .json({
            message:
              "Você não tem permissão para mover tarefas para a coluna de destino.",
          });
      }
      targetColumnId = column_id;
      targetBoardId = newColumnResult.rows[0].board_id;
    }

    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (title) {
      updateFields.push(`title = $${paramIndex++}`);
      queryParams.push(title);
    }
    if (typeof description !== "undefined") {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
    if (typeof task_order !== "undefined") {
      updateFields.push(`task_order = $${paramIndex++}`);
      queryParams.push(task_order);
    }
    if (typeof column_id !== "undefined") {
      updateFields.push(`column_id = $${paramIndex++}`);
      queryParams.push(targetColumnId);
    }
    if (targetBoardId !== currentBoardId) {
      updateFields.push(`board_id = $${paramIndex++}`);
      queryParams.push(targetBoardId);
    }
    if (typeof due_date !== "undefined") {
      updateFields.push(`due_date = $${paramIndex++}`);
      queryParams.push(due_date);
    }
    if (typeof priority !== "undefined") {
      updateFields.push(`priority = $${paramIndex++}`);
      queryParams.push(priority);
    }
    if (typeof assigned_user_id !== "undefined") {
      updateFields.push(`assigned_user_id = $${paramIndex++}`);
      queryParams.push(assigned_user_id);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ message: "Nenhum campo válido fornecido para atualização." });
    }

    queryParams.push(taskId);

    const updateTaskQuery = `
      UPDATE tasks
      SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE task_id = $${paramIndex}
      RETURNING *;
    `;

    const { rows } = await db.query(updateTaskQuery, queryParams);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao tentar atualizar a tarefa.",
      });
  }
};

const deleteTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.userId;

  try {
    const taskCheckQuery = `
      SELECT b.owner_user_id
      FROM tasks t
      JOIN boards b ON t.board_id = b.board_id
      WHERE t.task_id = $1;
    `;
    const taskResult = await db.query(taskCheckQuery, [taskId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }
    if (taskResult.rows[0].owner_user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Você não tem permissão para deletar esta tarefa." });
    }

    const deleteTaskQuery =
      "DELETE FROM tasks WHERE task_id = $1 RETURNING task_id;";
    const { rows } = await db.query(deleteTaskQuery, [taskId]);

    res
      .status(200)
      .json({
        message: "Tarefa deletada com sucesso.",
        taskId: rows[0].task_id,
      });
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    res
      .status(500)
      .json({
        message: "Erro interno do servidor ao tentar deletar a tarefa.",
      });
  }
};

module.exports = {
  createTask,
  getColumnTasks,
  updateTask,
  deleteTask,
};
