const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

require('dotenv').config()

const JWTSecret = process.env.JWT;

app.set("view engine", "ejs");
app.set("views", "./app/views");

app.use(express.static("./app/public"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const DB = {
  users: [
    {
      id: 1,
      username: "admin",
      senha: "admin123",
    },
    {
      id: 2,
      username: "bombeiro",
      senha: "bombeiro123",
    },
    {
      id: 3,
      username: "lucas",
      senha: "lucas123",
    },
    {
      id: 4,
      username: "alex",
      senha: "alex123",
    },
    {
      id: 5,
      username: "bia",
      senha: "bia123",
    },
    {
      id: 6,
      username: "cris",
      senha: "cris123",
    },
  ],
};

function auth(req, res, next) {
  req.headers.authorization = "bearer " + tokenHeader;
  const authToken = req.headers["authorization"];

  if (authToken !== undefined) {
    const bearer = authToken.split(" ");
    console.log("BEARER: ", bearer);

    const token = bearer[1];

    jwt.verify(token, JWTSecret, (err, data) => {
      if (err) {
        res.status(401);
        res.json({ message: "Token inválido." });
      } else {
        console.log(data);
        req.token = token;
        req.loggedUser = { id: data.id, username: data.username };
        console.log("USER AUTORIZADO!");
        next();
      }
    });
  } else {
    res.status(401);
    res.json({
      message: "Realize login para acessar esta rota",
    });
  }
}

app.get("/", (req, res) => {
  res.render("index");
});

let tokenHeader = "";
let dados = "";

app.get("/chat", auth, (req, res) => {
  res.render("chat", { dados });
});

app.post("/auth", (req, res) => {
  const dadosForm = req.body;
  dados = dadosForm;
  const username = dadosForm.username;
  const senha = dadosForm.senha;
  if (username !== undefined) {
    const user = DB.users.find((u) => u.username == username);
    if (user !== undefined) {
      if (user.senha === senha) {
        jwt.sign(
          {
            id: user.id,
            username: user.username,
          },
          JWTSecret,
          {
            expiresIn: "1h",
          },
          (err, token) => {
            if (err) {
              console.log(err);
              res.status(400);
              res.json({
                message: "Não foi possível gerar o token.",
              });
            } else {
              res.status(200);
              tokenHeader = token;
              io.emit("msgParaCliente", {
                username: dadosForm.username,
                mensagem: "Entrou no chat",
              });
              res.redirect("/chat");
            }
          }
        );
      } else {
        res.status(401);
        res.json({ message: "Username ou Senha não coincidem." });
      }
    } else {
      res.status(404);
      res.json({ message: "Usuário não existe." });
    }
  } else {
    res.status(400);
    res.json({ message: "Username ou Senha nulos." });
  }
});

const server = app.listen(5000, () => {
  console.log("Servidor rodando na url => http://localhost:5000");
});

const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("Entrou na sala.");

  socket.on("disconnect", () => {
    console.log("Saiu da sala.");
  });

  socket.on("msgParaServidor", (data) => {
    socket.emit("msgParaCliente", {
      username: data.username,
      mensagem: data.mensagem,
    });

    socket.broadcast.emit("msgParaCliente", {
      username: data.username,
      mensagem: data.mensagem,
    });
  });
});
