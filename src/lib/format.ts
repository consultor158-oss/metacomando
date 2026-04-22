export const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("pt-BR").format(Math.round(n || 0));

export const formatPct = (n: number) => `${(n || 0).toFixed(2)}%`;
