export type ScheduledOrganQuery = {
  siglaTribunal: string;
  orgaoId: number;
  label: string;
};

export const SCHEDULED_ORGAN_QUERIES: ScheduledOrganQuery[] = [
  {
    siglaTribunal: 'TRT10',
    orgaoId: 46612,
    label: '18ª Vara do Trabalho de Brasília - DF',
  },
  {
    siglaTribunal: 'TJTO',
    orgaoId: 95263,
    label: 'Central de Expedição de Precatório e RPVs',
  },
  {
    siglaTribunal: 'TJRS',
    orgaoId: 38458,
    label: '1ª Vara Judicial da Comarca de São Lourenço do Sul',
  },
];
