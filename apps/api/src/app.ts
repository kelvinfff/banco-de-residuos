import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "./env";
import { serializar } from "./lib/serializar";
import { carregarSessao } from "./middleware/autenticacao";
import { rotaNaoEncontrada, tratarErros } from "./middleware/erros";
import { rotasAdmin } from "./rotas/admin";
import { rotasAnuncios } from "./rotas/anuncios";
import { rotasAuth } from "./rotas/auth";
import { rotasNegociacoes } from "./rotas/negociacoes";
import { rotasPublicas } from "./rotas/publico";
import { rotasTransacoes } from "./rotas/transacoes";
import { rotasUsuarios } from "./rotas/usuarios";

export function criarApp() {
  const app = express();

  // X-Forwarded-For não é confiável aqui: o proxy do Next.js repassa o cabeçalho como o
  // cliente enviou. Por isso `trust proxy` fica desligado e nada na API depende de `req.ip`.
  app.set("trust proxy", false);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // As fotos são exibidas pelo frontend, que roda em outra origem durante o desenvolvimento.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Toda resposta JSON passa pelo serializador (Decimal → number).
  app.use((_req, res, next) => {
    const jsonOriginal = res.json.bind(res);
    res.json = (corpo) => jsonOriginal(serializar(corpo));
    next();
  });

  // Fotos dos anúncios: arquivos estáticos, nunca interpretados como HTML.
  app.use(
    "/uploads",
    express.static(env.UPLOAD_DIR, {
      index: false,
      maxAge: "7d",
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    }),
  );

  const api = express.Router();
  api.use(carregarSessao);
  api.use(rotasPublicas);
  api.use("/auth", rotasAuth);
  api.use("/usuarios", rotasUsuarios);
  api.use("/anuncios", rotasAnuncios);
  api.use("/negociacoes", rotasNegociacoes);
  api.use("/transacoes", rotasTransacoes);
  api.use("/admin", rotasAdmin);
  app.use("/api", api);

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);
  return app;
}
