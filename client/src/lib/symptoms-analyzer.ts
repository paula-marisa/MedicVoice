/**
 * Módulo para analisar e extrair sintomas do texto transcrito.
 * Esta implementação inclui uma detecção básica de sintomas comuns em português.
 * Em ambiente de produção, seria ideal usar uma API de processamento de linguagem natural.
 */

// Lista de sintomas comuns e suas variantes em português (Portugal)
const SYMPTOM_KEYWORDS = {
  "dor": [
    "dor", "dolorido", "dolorosa", "dói", "doer", "doendo", "dores"
  ],
  "dor de cabeça": [
    "dor de cabeça", "cefaleia", "enxaqueca", "dor na cabeça", "cefaleia"
  ],
  "febre": [
    "febre", "febril", "temperatura alta", "temperatura elevada", "hipertermia"
  ],
  "tosse": [
    "tosse", "tossindo", "tosse seca", "tosse com expetoração", "tosse com catarro"
  ],
  "náusea": [
    "náusea", "enjoo", "ânsia", "vontade de vomitar", "enjoado", "enjoada", "náuseas"
  ],
  "vómito": [
    "vómito", "vomitando", "vomitou", "vomitar", "vomitado", "a vomitar"
  ],
  "diarreia": [
    "diarreia", "dejeções moles", "evacuações frequentes", "intestino solto", "diarreico"
  ],
  "cansaço": [
    "cansaço", "fadiga", "exaustão", "fraqueza", "sem energia", "cansado", "cansada", "astenia"
  ],
  "tontura": [
    "tontura", "vertigem", "tonto", "tonta", "desequilíbrio", "zonzo", "zonza", "a cabeça à roda"
  ],
  "falta de ar": [
    "falta de ar", "dispneia", "dificuldade para respirar", "respiração difícil", "ofegante", "dificuldade respiratória"
  ],
  "dor no peito": [
    "dor no peito", "dor torácica", "aperto no peito", "pressão no peito", "dor precordial"
  ],
  "dor abdominal": [
    "dor abdominal", "dor de barriga", "cólica", "dor na barriga", "dor no abdómen", "dor abdominal"
  ],
  "perda de apetite": [
    "perda de apetite", "inapetência", "sem fome", "não come", "falta de apetite", "anorexia"
  ],
  "comichão": [
    "comichão", "prurido", "coçando", "coceira", "irritação na pele", "pele a coçar"
  ],
  "erupção cutânea": [
    "erupção cutânea", "exantema", "manchas na pele", "lesões na pele", "rash"
  ],
  "dor muscular": [
    "dor muscular", "mialgia", "músculos doloridos", "dor nos músculos", "mialgias"
  ],
  "dor articular": [
    "dor articular", "artralgia", "dor nas juntas", "dor nas articulações", "artralgias"
  ],
  "formigueiro": [
    "formigueiro", "formigamento", "dormência", "parestesia", "adormecido", "adormecida"
  ],
  "visão turva": [
    "visão turva", "vista embaçada", "visão embaçada", "não consegue ver bem", "vista enevoada"
  ],
  "insónia": [
    "insónia", "dificuldade para dormir", "não consegue dormir", "problema para dormir", "perturbação do sono"
  ],
  "edema": [
    "edema", "inchaço", "inchado", "inchada", "retenção de líquido", "tumefação"
  ],
  "confusão": [
    "confusão", "confuso", "confusa", "desorientação", "desorientado", "desorientada", "confusão mental"
  ],
  "ansiedade": [
    "ansiedade", "nervosismo", "angústia", "preocupação", "ansioso", "ansiosa", "ansioso"
  ],
  "depressão": [
    "depressão", "tristeza", "melancolia", "desânimo", "sem vontade", "humor deprimido"
  ],
  "agitação": [
    "agitação", "inquietação", "agitado", "agitada", "inquieto", "inquieta", "nervosismo"
  ],
  "hemorragia": [
    "hemorragia", "sangramento", "a sangrar", "perda de sangue", "hemorrágico"
  ],
  "obstipação": [
    "obstipação", "prisão de ventre", "constipação intestinal", "dificuldade em evacuar", "fezes duras", "intestino preso"
  ],
  "palpitações": [
    "palpitações", "coração acelerado", "taquicardia", "batimentos cardíacos fortes", "coração a bater depressa"
  ],
  "problemas urinários": [
    "disúria", "ardor ao urinar", "dor a urinar", "dificuldade em urinar", "polaquiúria", "urgência miccional"
  ],
  "tensão arterial elevada": [
    "hipertensão", "tensão alta", "pressão arterial elevada", "HTA"
  ]
};

// Padrões de localização para ajudar a identificar onde ocorre a dor/sintoma
const LOCATION_MARKERS = [
  "na", "no", "nas", "nos", "em", "do", "da", "dos", "das", "ao", "à", "junto", "próximo"
];

// Qualificadores comuns para sintomas em português de Portugal
const QUALIFIERS = [
  "forte", "fraca", "intensa", "leve", "moderada", "severa", "grave",
  "constante", "intermitente", "aguda", "crónica", "súbita", "gradual",
  "contínua", "pulsátil", "latejante", "em queimação", "em pontada", 
  "insuportável", "tolerável", "ligeira", "incómoda", "incomodativa",
  "agravada", "aliviada", "pior", "melhor"
];

// Termos relacionados a frequência e duração em português de Portugal
const TIMING_TERMS = [
  "dias", "semanas", "meses", "horas", "minutos", "segundos", "anos",
  "sempre", "frequente", "às vezes", "raramente", "constantemente",
  "iniciou", "começou", "desde", "há", "faz", "durante", "há cerca de",
  "já", "pela manhã", "à tarde", "à noite", "ao acordar", "ao deitar",
  "após", "antes", "enquanto", "quando", "persistente", "recorrente",
  "ocasional", "diariamente"
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
  
  // Ordenar por confiança (mais alta primeiro) e remover duplicatas do mesmo sintoma,
  // mantendo o item com maior confiança para cada sintoma
  const uniqueSymptoms = result.reduce((acc, current) => {
    const existingSymptomIndex = acc.findIndex(item => item.symptom === current.symptom);
    if (existingSymptomIndex === -1) {
      // Se o sintoma ainda não existe na lista, adicioná-lo
      acc.push(current);
    } else if (current.confidence > acc[existingSymptomIndex].confidence) {
      // Se o sintoma já existe mas este tem maior confiança, substituí-lo
      acc[existingSymptomIndex] = current;
    }
    return acc;
  }, [] as typeof result);
  
  return uniqueSymptoms.sort((a, b) => b.confidence - a.confidence);
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
  
  // Filtrar apenas sintomas com nível de confiança razoável (acima de 0.5)
  const validSymptoms = symptoms.filter(s => s.confidence > 0.5);
  
  if (validSymptoms.length === 0) {
    return "";
  }
  
  // Começar com uma introdução
  let report = "Sintomatologia:\n";
  
  // Adicionar cada sintoma com seu contexto em formato de lista
  validSymptoms.forEach((symptom, index) => {
    // Extrair e adicionar contexto relevante
    const relevantContext = extractRelevantContext(symptom.context, symptom.symptom);
    
    // Formatar como uma lista numerada
    report += `- ${capitalizeFirstLetter(symptom.symptom)}`;
    
    if (relevantContext) {
      report += `: ${relevantContext}`;
    }
    
    // Adicionar nível de confiança como comentário clínico apenas para sintomas com confiança não máxima
    if (symptom.confidence < 0.9) {
      report += ` (${Math.round(symptom.confidence * 100)}% de confiança)`;
    }
    
    report += "\n";
  });
  
  report += "\nSintomatologia captada através de reconhecimento de voz com consentimento do utente, conforme regulamento RGPD.";
  
  return report;
}

/**
 * Extrai o contexto mais relevante para um sintoma
 */
function extractRelevantContext(context: string, symptom: string): string {
  if (!context) return "";
  
  const contextLower = context.toLowerCase();
  const symptomLower = symptom.toLowerCase();
  
  // Se o contexto não inclui o sintoma ou é praticamente igual ao sintoma, retornar vazio
  if (!contextLower.includes(symptomLower) || 
      contextLower.length <= symptomLower.length + 5) {
    return "";
  }
  
  // Remover o sintoma do contexto para evitar repetição
  let cleanedContext = contextLower;
  
  // Tentar extrair qualificadores e detalhes importantes
  let foundQualifiers = QUALIFIERS.filter(q => contextLower.includes(q));
  let foundLocations = LOCATION_MARKERS.filter(l => contextLower.includes(l));
  let foundTiming = TIMING_TERMS.filter(t => contextLower.includes(t));
  
  if (context.length > 100) {
    // Se o contexto for muito longo, extrair apenas a parte relevante
    const keywordPos = contextLower.indexOf(symptomLower);
    if (keywordPos !== -1) {
      const start = Math.max(0, keywordPos - 30);
      const end = Math.min(context.length, keywordPos + symptomLower.length + 30);
      cleanedContext = context.substring(start, end).trim();
      
      // Se o sintoma aparece no início da parte extraída, tentar remover
      if (cleanedContext.toLowerCase().startsWith(symptomLower)) {
        cleanedContext = cleanedContext.substring(symptomLower.length).trim();
        // Remover qualquer pontuação inicial após a remoção do sintoma
        cleanedContext = cleanedContext.replace(/^[,.:;\s]+/, '');
      }
    }
  } else {
    // Para contextos curtos, apenas remover o sintoma para evitar repetição
    cleanedContext = context.replace(new RegExp(symptomLower, 'gi'), '').trim();
    // Remover qualquer pontuação duplicada após a remoção
    cleanedContext = cleanedContext.replace(/^[,.:;\s]+/, '').replace(/[,.:;\s]+$/, '');
  }
  
  // Capitalizar a primeira letra
  return capitalizeFirstLetter(cleanedContext);
}

/**
 * Capitaliza a primeira letra de uma string
 */
function capitalizeFirstLetter(string: string): string {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
}