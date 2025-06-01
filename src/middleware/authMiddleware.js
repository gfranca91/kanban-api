const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      next();
    } catch (error) {
      console.error("Erro na autenticação do token:", error.message);
      res.status(401).json({ message: "Não autorizado, token falhou." });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Não autorizado, sem token." });
  }
};

module.exports = { protect };
