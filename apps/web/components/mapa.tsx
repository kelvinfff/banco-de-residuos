"use client";

import "leaflet/dist/leaflet.css";
import type { Map as MapaLeaflet, Marker } from "leaflet";
import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";

export interface PontoNoMapa {
  id: number | string;
  latitude: number;
  longitude: number;
  /** Texto do balão; pode conter um link. Sempre montado com `textContent`, nunca HTML cru. */
  titulo: string;
  subtitulo?: string;
  href?: string;
  destaque?: boolean;
  /** Outros itens no mesmo local (ex.: vários anúncios do mesmo vendedor), listados no balão. */
  outros?: { titulo: string; subtitulo?: string; href?: string }[];
}

interface Props {
  pontos: PontoNoMapa[];
  /** Centro inicial quando não há pontos. Padrão: Petrolina/Juazeiro. */
  centro?: { latitude: number; longitude: number };
  zoom?: number;
  /** Se informado, o mapa vira um seletor: clicar define o ponto. */
  aoEscolher?: (ponto: { latitude: number; longitude: number }) => void;
  rotulo: string;
  className?: string;
}

const PETROLINA = { latitude: -9.4, longitude: -40.5 };

function conteudoDoBalao(ponto: PontoNoMapa): HTMLElement {
  const raiz = document.createElement("div");
  for (const item of [ponto, ...(ponto.outros ?? [])]) {
    const bloco = document.createElement("div");
    if (raiz.childElementCount > 0) bloco.style.marginTop = "8px";
    const titulo = document.createElement(item.href ? "a" : "strong");
    titulo.textContent = item.titulo;
    if (item.href) (titulo as HTMLAnchorElement).href = item.href;
    titulo.style.fontWeight = "600";
    bloco.append(titulo);
    if (item.subtitulo) {
      const sub = document.createElement("div");
      sub.textContent = item.subtitulo;
      bloco.append(sub);
    }
    raiz.append(bloco);
  }
  return raiz;
}

type Leaflet = typeof import("leaflet");

/** Troca os marcadores do mapa pelos `pontos` e enquadra a vista. Devolve os novos marcadores. */
function desenhar(L: Leaflet, mapa: MapaLeaflet, anteriores: Marker[], pontos: PontoNoMapa[], seletor: boolean): Marker[] {
  anteriores.forEach((m) => m.remove());
  const marcadores = pontos.map((ponto) => {
    const icone = L.divIcon({
      className: "",
      html: `<div class="pino-mapa${ponto.destaque ? " pino-mapa--destaque" : ""}"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -26],
    });
    const rotulo = ponto.outros?.length ? `${ponto.titulo} e mais ${ponto.outros.length}` : ponto.titulo;
    const marcador = L.marker([ponto.latitude, ponto.longitude], { icon: icone, title: rotulo, alt: rotulo });
    if (!seletor) marcador.bindPopup(conteudoDoBalao(ponto), { maxHeight: 240 });
    return marcador.addTo(mapa);
  });

  const [primeiro] = pontos;
  if (seletor) {
    if (primeiro) mapa.panTo([primeiro.latitude, primeiro.longitude]);
  } else if (pontos.length > 1) {
    mapa.fitBounds(L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude])), { padding: [40, 40], maxZoom: 12 });
  } else if (primeiro) {
    mapa.setView([primeiro.latitude, primeiro.longitude], 11);
  }
  return marcadores;
}

/**
 * Mapa (Leaflet + OpenStreetMap).
 * O Leaflet depende de `window`, por isso é carregado só no navegador, dentro do efeito.
 * As imagens do mapa vêm da internet; sem conexão, os marcadores continuam visíveis.
 */
export function Mapa({ pontos, centro = PETROLINA, zoom = 9, aoEscolher, rotulo, className }: Props) {
  const refElemento = useRef<HTMLDivElement>(null);
  const refMapa = useRef<MapaLeaflet | null>(null);
  const refMarcadores = useRef<Marker[]>([]);
  const seletor = aoEscolher !== undefined;

  // Valores mais recentes, lidos pelos efeitos e pelo clique sem recriar o mapa.
  const refAtual = useRef({ pontos, aoEscolher, centro, zoom });
  useEffect(() => {
    refAtual.current = { pontos, aoEscolher, centro, zoom };
  });

  // Cria o mapa uma única vez.
  useEffect(() => {
    let cancelado = false;
    void import("leaflet").then(({ default: L }) => {
      if (cancelado || !refElemento.current || refMapa.current) return;
      const inicial = refAtual.current;
      const mapa = L.map(refElemento.current, { scrollWheelZoom: false }).setView(
        [inicial.centro.latitude, inicial.centro.longitude],
        inicial.zoom,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa);
      if (seletor) {
        mapa.on("click", (e) => refAtual.current.aoEscolher?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
      }
      refMapa.current = mapa;
      refMarcadores.current = desenhar(L, mapa, [], inicial.pontos, seletor);
    });
    return () => {
      cancelado = true;
      refMapa.current?.remove();
      refMapa.current = null;
      refMarcadores.current = [];
    };
  }, [seletor]);

  // Redesenha os marcadores quando os pontos mudam.
  const assinatura = pontos.map((p) => `${p.id}:${p.latitude},${p.longitude}:${p.destaque ? 1 : 0}:${p.outros?.length ?? 0}`).join("|");
  useEffect(() => {
    if (!refMapa.current) return; // ainda carregando: a criação já desenha os pontos atuais
    void import("leaflet").then(({ default: L }) => {
      if (!refMapa.current) return;
      refMarcadores.current = desenhar(L, refMapa.current, refMarcadores.current, refAtual.current.pontos, seletor);
    });
  }, [assinatura, seletor]);

  return (
    <div
      ref={refElemento}
      role="application"
      aria-label={rotulo}
      className={cx("isolate z-0 overflow-hidden rounded-xl border border-areia-200", className)}
    />
  );
}
