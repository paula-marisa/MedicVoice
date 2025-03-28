/**
 * Módulo para analisar e extrair sintomas do texto transcrito.
 * Esta implementação inclui uma detecção básica de sintomas comuns em português.
 * Em ambiente de produção, seria ideal usar uma API de processamento de linguagem natural.
 */

// Lista de sintomas comuns e suas variantes em português
const SYMPTOM_KEYWORDS = {
  "dor": [
    "dor", "dolorido", "dolorosa", "dói", "doer", "doendo", "dores"
  ],
  "dor de cabeça": [
    "dor de cabeça", "cefaleia", "enxaqueca", "migrânea", "dor na cabeça"
  ],
  "febre": [
    "febre", "febril", "temperatura alta", "temperatura elevada", "hipertermia"
  ],
  "tosse": [
    "tosse", "tossindo", "tosse seca", "tosse com catarro", "tosse produtiva"
  ],
  "náusea": [
    "náusea", "enjoo", "ânsia", "vontade de vomitar", "enjoado", "enjoada"
  ],
  "vômito": [
    "vômito", "vomitando", "vomitou", "vomitar", "regurgitar"
  ],
  "diarreia": [
    "diarreia", "fezes moles", "evacuações frequentes", "intestino solto"
  ],
  "cansaço": [
    "cansaço", "fadiga", "exaustão", "fraqueza", "sem energia", "cansado", "cansada"
  ],
  "tontura": [
    "tontura", "vertigem", "tonto", "tonta", "desequilíbrio", "zonzo", "zonza"
  ],
  "falta de ar": [
    "falta de ar", "dispneia", "dificuldade para respirar", "respiração difícil", "ofegante"
  ],
  "dor no peito": [
    "dor no peito", "dor torácica", "aperto no peito", "pressão no peito"
  ],
  "dor abdominal": [
    "dor abdominal", "dor de barriga", "cólica", "dor na barriga", "dor no abdômen"
  ],
  "perda de apetite": [
    "perda de apetite", "inapetência", "sem fome", "não come", "falta de apetite"
  ],
  "coceira": [
    "coceira", "prurido", "coçando", "comichão", "irritação na pele"
  ],
  "erupção cutânea": [
    "erupção cutânea", "exantema", "manchas na pele", "lesões na pele", "rash"
  ],
  "dor muscular": [
    "dor muscular", "mialgia", "músculos doloridos", "dor nos músculos"
  ],
  "dor articular": [
    "dor articular", "artralgia", "dor nas juntas", "dor nas articulações"
  ],
  "formigamento": [
    "formigamento", "formigueiro", "dormência", "parestesia", "adormecido", "adormecida"
  ],
  "visão turva": [
    "visão turva", "vista embaçada", "visão embaçada", "não consegue ver bem"
  ],
  "insônia": [
    "insônia", "dificuldade para dormir", "não consegue dormir", "problema para dormir"
  ],
  "edema": [
    "edema", "inchaço", "inchado", "inchada", "retenção de líquido"
  ],
  "confusão": [
    "confusão", "confuso", "confusa", "desorientação", "desorientado", "desorientada"
  ],
  "ansiedade": [
    "ansiedade", "nervosismo", "angústia", "preocupação", "ansioso", "ansiosa"
  ],
  "depressão": [
    "depressão", "tristeza", "melancolia", "desânimo", "sem vontade"
  ],
  "agitação": [
    "agitação", "inquietação", "agitado", "agitada", "inquieto", "inquieta"
  ]
};

// Padrões de localização para ajudar a identificar onde ocorre a dor/sintoma
const LOCATION_MARKERS = [
  "na", "no", "nas", "nos", "em", "do", "da", "dos", "das", "ao", "à"
];

// Qualificadores comuns para sintomas
const QUALIFIERS = [
  "forte", "fraca", "intensa", "leve", "moderada", "severa", "grave",
  "constante", "intermitente", "aguda", "crônica", "súbita", "gradual",
  "contínua", "pulsátil", "latejante", "em queimação", "em pontada"
];

// Termos relacionados a frequência e duração
const TIMING_TERMS = [
  "dias", "semanas", "meses", "horas", "minutos", "segundos", "anos",
  "sempre", "frequente", "às vezes", "raramente", "constantemente",
  "iniciou", "começou", "desde", "há", "faz", "durante"
];

/**
 * Analisa o texto para detectar menções de sintomas conhecidos
 * 
 * @param text O texto a ser analisado
 * @returns Uma lista de objetos de sintomas detectados
 */
export function analyzeSymptoms(text: string): { 
  symptom: string, 
  context: string, 
  confidence: number
}[] {
  const result: {
    symptom: string,
    context: string,
    confidence: number
  }[] = [];
  
  if (!text || typeof text !== 'string') {
    return result;
  }
  
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Para cada sintoma em nossa base de conhecimento
  Object.entries(SYMPTOM_KEYWORDS).forEach(([symptomName, keywords]) => {
    // Busca ocorrências de cada palavra-chave
    keywords.forEach(keyword => {
      // Normalizar a palavra-chave para remover acentos para a busca
      const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      // Posição onde encontramos a palavra-chave
      let position = normalizedText.indexOf(normalizedKeyword);
      
      while (position !== -1) {
        // Encontrar onde a frase ou contexto começa
        const startPosition = Math.max(0, normalizedText.lastIndexOf(".", position) + 1);
        
        // Encontrar onde a frase ou contexto termina
        let endPosition = normalizedText.indexOf(".", position);
        if (endPosition === -1) endPosition = normalizedText.length;
        
        // Extrair o contexto (a frase completa onde o sintoma foi mencionado)
        const context = text.substring(startPosition, endPosition).trim();
        
        // Calcular um nível de confiança baseado em pistas de contexto
        let confidence = 0.5; // Confiança base
        
        // Verificar se há marcadores de localização, qualificadores e termos de tempo
        // que geralmente aumentam a probabilidade de que estamos falando de um sintoma
        if (LOCATION_MARKERS.some(marker => normalizedText.includes(normalizedKeyword + " " + marker))) {
          confidence += 0.15;
        }
        
        if (QUALIFIERS.some(qualifier => 
          normalizedText.includes(qualifier + " " + normalizedKeyword) || 
          normalizedText.includes(normalizedKeyword + " " + qualifier))) {
          confidence += 0.2;
        }
        
        if (TIMING_TERMS.some(term => 
          normalizedText.includes(term + " " + normalizedKeyword) || 
          normalizedText.includes(normalizedKeyword + " " + term) ||
          normalizedText.includes(normalizedKeyword + " " + term))) {
          confidence += 0.15;
        }
        
        // Adicionar o sintoma à lista de resultados
        result.push({
          symptom: symptomName,
          context,
          confidence: Math.min(confidence, 1.0) // Limitar confiança a 1.0 (100%)
        });
        
        // Procurar a próxima ocorrência
        position = normalizedText.indexOf(normalizedKeyword, position + 1);
      }
    });
  });
  
  // Ordenar por confiança (mais alta primeiro) e remover duplicatas do mesmo sintoma
  return result
    .sort((a, b) => b.confidence - a.confidence)
    .filter((item, index, self) => 
      index === self.findIndex(t => t.symptom === item.symptom)
    );
}

/**
 * Formata os sintomas detectados em texto estruturado para relatório médico
 * 
 * @param symptoms Lista de sintomas detectados
 * @returns Texto formatado com os sintomas em formato de relatório
 */
export function formatSymptomsReport(symptoms: { 
  symptom: string, 
  context: string, 
  confidence: number
}[]): string {
  // Se não houver sintomas, retornar texto vazio
  if (!symptoms || symptoms.length === 0) {
    return "";
  }
  
  // Filtrar apenas sintomas com nível de confiança razoável (acima de 0.4)
  const validSymptoms = symptoms.filter(s => s.confidence > 0.4);
  
  if (validSymptoms.length === 0) {
    return "";
  }
  
  // Começar com uma introdução
  let report = "Utente apresenta ";
  
  // Adicionar cada sintoma com seu contexto
  validSymptoms.forEach((symptom, index) => {
    if (index > 0) {
      if (index === validSymptoms.length - 1) {
        report += " e ";
      } else {
        report += ", ";
      }
    }
    
    report += symptom.symptom;
    
    // Adicionar qualificadores ou contexto específico se estiverem presentes
    // e não duplicarem o que já foi escrito
    const contextLower = symptom.context.toLowerCase();
    if (!contextLower.includes(symptom.symptom.toLowerCase()) ||
        contextLower.length > symptom.symptom.length + 10) {
      
      // Se o contexto for muito longo, extrair apenas a parte relevante
      if (symptom.context.length > 100) {
        const keywordPos = contextLower.indexOf(symptom.symptom.toLowerCase());
        if (keywordPos !== -1) {
          const start = Math.max(0, keywordPos - 30);
          const end = Math.min(symptom.context.length, keywordPos + symptom.symptom.length + 30);
          const relevantContext = symptom.context.substring(start, end).trim();
          report += ` (${relevantContext})`;
        }
      } else {
        report += ` (${symptom.context})`;
      }
    }
  });
  
  report += ".";
  
  return report;
}