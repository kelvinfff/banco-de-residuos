import { Compass } from "lucide-react";
import { LinkBotao } from "@/components/botao";
import { EstadoVazio } from "@/components/feedback";

export default function NaoEncontrada() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <EstadoVazio Icone={Compass} titulo="Página não encontrada" acao={<LinkBotao href="/">Voltar ao início</LinkBotao>}>
        O endereço pode ter mudado ou nunca ter existido.
      </EstadoVazio>
    </div>
  );
}
