export type ProcessApiRecipientParty = {
  nome: string;
  polo: string;
};

export type ProcessApiRecipientLawyer = {
  advogado: {
    nome: string;
    numero_oab: string;
    uf_oab: string;
  };
};

export type ProcessApiItem = {
  id: number;
  numero_processo: string;
  siglaTribunal: string;
  nomeOrgao: string;
  data_disponibilizacao: string;
  tipoComunicacao: string;
  texto: string;
  meio: string;
  destinatarios: ProcessApiRecipientParty[];
  destinatarioadvogados: ProcessApiRecipientLawyer[];
};

export type ProcessApiResponse = {
  items: ProcessApiItem[];
  count?: number;
};
