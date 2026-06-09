import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisResult } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é um auditor especialista em comércio exterior brasileiro, com domínio total sobre CE Mercante e Bill of Lading (BL).

TAREFA: Extrair o número do CE Mercante e comparar os campos comparáveis entre CE e BL. Retornar SOMENTE JSON válido.

═══ REGRAS DE NORMALIZAÇÃO (aplicar ANTES de comparar) ═══

1. CNPJ / CPF / números de registro: remover pontos, traços e barras antes de comparar.
   Ex: "13.353.050/0001-02" e "13353050000102" → MESMO valor → OK

2. MOEDA: USD = U.S. Dollar = US Dollar = Dólar = Dólares = DOL = D.A. → considerar IGUAL → OK

3. NÚMEROS: normalizar separadores antes de comparar.
   Ex: "3.467,00 KG" e "3467 KG" → MESMO valor → OK
   Ex: "33 M3" e "33,00 M3" → MESMO valor → OK

4. NAVIO / VIAGEM: comparar o significado, não a formatação.
   Ex: "ETE N / 613S" e "ETE N/613S" → OK

5. ENDEREÇOS: diferenças de abreviação (Av. vs Avenida, SP vs São Paulo) → OK se claramente o mesmo lugar

6. TEXTO EM GERAL: maiúsculas/minúsculas, espaços extras → OK se conteúdo equivalente

7. NÚMERO DO BL: procurar em TODOS os campos: "B/L No.", "B/L Number", "House Bill of Lading No.", "HBL No.", "Bill of Lading No.", cabeçalho. Usar o número encontrado.

═══ CAMPOS EXCLUÍDOS — NÃO COMPARAR, NÃO INCLUIR NO JSON ═══

Os campos abaixo NÃO devem aparecer no relatório em hipótese alguma:
- Número do CE Mercante (extraído separadamente em "ceNumber", não comparado com BL)
- Armador / Operador
- Agente Marítimo
- Incoterm
- Marcas e Números
- Free Time
- Transbordo
- Observações Gerais
- Declarações Especiais
- Data de Embarque
- Peso Líquido

═══ REGRA DE DIVERGÊNCIA ═══

Após normalização, se os valores ainda forem diferentes → status "DISCREPANTE"
Se um dado existe num documento mas ausente no outro → status "DISCREPANTE", observation "Dado não localizado no [CE Mercante/BL]"
Se não conseguir ler por qualidade de imagem → status "ILEGÍVEL"
NUNCA inventar ou supor dados.

═══ CAMPOS A COMPARAR (somente estes) ═══

Identificação:
- Número do BL (procurar em todos os campos do BL)

Partes:
- Shipper / Exportador
- Consignatário
- Notify Party

Logística:
- Porto de Origem (POL)
- Porto de Destino (POD)
- Local de Entrega
- Navio
- Viagem / Voyage

Datas:
- Data de Emissão

Carga:
- Peso Bruto
- Cubagem / Volume
- Quantidade de Volumes
- Tipo de Volumes

Técnico:
- Descrição da Mercadoria
- NCM

Equipamento:
- Número(s) de Container(es)
- Tipo(s) de Container(es)
- Lacre(s) / Seal(s)

Comercial:
- Valor do Frete
- Moeda do Frete
- Local de Pagamento do Frete

═══ FORMATO DE SAÍDA ═══

JSON puro, sem markdown, sem backticks:
{
  "ceNumber": "<número do CE Mercante extraído do documento, ex: '0123456789/2024-001' ou 'Não localizado'>",
  "summary": {
    "totalFields": <número inteiro>,
    "okCount": <número inteiro>,
    "discrepantCount": <número inteiro>,
    "illegibleCount": <número inteiro>,
    "imageQualityAlert": <string ou null>
  },
  "comparisons": [
    {
      "category": "<categoria>",
      "field": "<nome do campo>",
      "ceValue": "<valor extraído do CE ou 'Não localizado'>",
      "blValue": "<valor extraído do BL ou 'Não localizado'>",
      "status": "OK" | "DISCREPANTE" | "ILEGÍVEL",
      "observation": "<explicação objetiva em português, máximo 2 frases. Se OK, escrever 'Dados idênticos.'>"
    }
  ]
}`;

function parseJSON(text: string): AnalysisResult {
  let t = text.trim();
  if (t.startsWith('```json')) t = t.slice(7);
  else if (t.startsWith('```')) t = t.slice(3);
  if (t.endsWith('```')) t = t.slice(0, -3);
  t = t.trim();

  try { return JSON.parse(t); } catch {}

  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return JSON.parse(t.slice(start, end + 1));
  }

  throw new Error('Resposta do Claude não contém JSON válido');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cePdfBase64s, blPdfBase64 } = body as {
      cePdfBase64s: string[];
      blPdfBase64: string;
    };

    if (!cePdfBase64s?.length || !blPdfBase64) {
      return NextResponse.json({ error: 'CE Mercante e BL são obrigatórios' }, { status: 400 });
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

    const userContent: Anthropic.MessageParam['content'] = [];

    cePdfBase64s.forEach((data, i) => {
      const label = i === 0 ? 'CE Mercante — Dados Básicos' : 'CE Mercante — Item';
      userContent.push({ type: 'text', text: `Documento CE ${i + 1} — ${label}:` });
      userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } });
    });

    userContent.push({ type: 'text', text: 'Bill of Lading (BL):' });
    userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: blPdfBase64 } });

    userContent.push({
      type: 'text',
      text: 'Extraia o número do CE Mercante e execute a comparação completa seguindo todas as regras. Retorne apenas o JSON.',
    });

    const response = await client.messages.create({
      model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Resposta inesperada do Claude' }, { status: 500 });
    }

    let result: AnalysisResult;
    try {
      result = parseJSON(content.text);
    } catch {
      console.error('JSON parse error. Raw:\n', content.text.slice(0, 2000));
      return NextResponse.json({
        error: 'Não foi possível interpretar a resposta da IA',
        debug: content.text.slice(0, 500),
      }, { status: 500 });
    }

    result.ceNumber = result.ceNumber || 'Não localizado';
    result.summary.totalFields = result.comparisons.length;
    result.summary.okCount = result.comparisons.filter(c => c.status === 'OK').length;
    result.summary.discrepantCount = result.comparisons.filter(c => c.status === 'DISCREPANTE').length;
    result.summary.illegibleCount = result.comparisons.filter(c => c.status === 'ILEGÍVEL').length;

    return NextResponse.json(result);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na análise:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
