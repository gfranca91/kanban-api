const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Por favor, forneça nome de usuário, email e senha." });
  }

  try {
    const userExistsQuery =
      "SELECT * FROM users WHERE email = $1 OR username = $2";
    const existingUser = await db.query(userExistsQuery, [email, username]);

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Email ou nome de usuário já cadastrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING user_id, username, email, created_at;
    `;
    const newUser = await db.query(insertUserQuery, [
      username,
      email,
      passwordHash,
    ]);

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({
      message: "Erro interno do servidor ao tentar registrar o usuário.",
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Por favor, forneça email e senha." });
  }

  try {
    const findUserQuery = "SELECT * FROM users WHERE email = $1";
    const { rows } = await db.query(findUserQuery, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login bem-sucedido!",
      token: token,
      userId: user.user_id,
      username: user.username,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao tentar fazer login." });
  }
};

const getMe = async (req, res) => {
  const { userId, username } = req.user;
  res.status(200).json({
    id: userId,
    username: username,
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
