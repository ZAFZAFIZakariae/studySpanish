import { createDiagram, type FigureRenderer } from './shared';

export const snlpFigures: Record<string, FigureRenderer> = {
  'snlp-chapter-1/panorama': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'audio', x: 60, y: 60, width: 200, title: 'Audio', lines: ['Ambiente', 'Voz'] },
        { id: 'music', x: 60, y: 220, width: 200, title: 'Música', lines: ['Análisis', 'Síntesis'] },
        { id: 'text', x: 540, y: 140, width: 200, title: 'Texto', lines: ['NLP', 'Modelos generativos'] },
        {
          id: 'apps',
          x: 300,
          y: 140,
          width: 200,
          title: 'Aplicaciones',
          lines: ['Clasificación', 'Generación', 'Recomendación'],
          fill: '#dcfce7',
        },
      ],
      links: [
        { from: 'audio', to: 'apps' },
        { from: 'music', to: 'apps' },
        { from: 'text', to: 'apps' },
      ],
    }),
  'snlp-chapter-2/pipeline': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'raw', x: 40, y: 160, width: 160, title: 'Señal cruda', lines: ['PCM'] },
        { id: 'windows', x: 200, y: 80, width: 160, title: 'Ventanas', lines: ['Segmentación'] },
        { id: 'stft', x: 360, y: 80, width: 160, title: 'Transformada', lines: ['STFT / Mel'] },
        { id: 'features', x: 360, y: 220, width: 160, title: 'Características', lines: ['MFCC', 'Chroma'], fill: '#ede9fe' },
        { id: 'model', x: 520, y: 160, width: 160, title: 'Modelo', lines: ['Clasificador', 'DL'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'raw', to: 'windows', label: 'Preprocesado' },
        { from: 'windows', to: 'stft', label: 'FFT' },
        { from: 'stft', to: 'features', label: 'Resumen' },
        { from: 'features', to: 'model', label: 'Entrenamiento' },
      ],
    }),
  'snlp-chapter-3/keras-pipeline': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'define', x: 40, y: 160, width: 150, title: 'Definir modelo', lines: ['Capas'] },
        { id: 'compile', x: 200, y: 160, width: 150, title: 'Compilar', lines: ['Optimización'] },
        { id: 'train', x: 360, y: 160, width: 150, title: 'Entrenar', lines: ['fit()'] },
        { id: 'evaluate', x: 520, y: 160, width: 150, title: 'Evaluar', lines: ['Métricas'] },
        { id: 'deploy', x: 680, y: 160, width: 150, title: 'Desplegar', lines: ['Inferencia'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'define', to: 'compile' },
        { from: 'compile', to: 'train' },
        { from: 'train', to: 'evaluate' },
        { from: 'evaluate', to: 'deploy' },
      ],
    }),
  'snlp-chapter-4/representaciones': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'onehot', x: 40, y: 160, width: 160, title: 'One-hot / BOW', lines: ['Vectores dispersos'] },
        { id: 'tfidf', x: 220, y: 160, width: 160, title: 'TF-IDF', lines: ['Peso por relevancia'] },
        { id: 'dense', x: 400, y: 160, width: 160, title: 'Embeddings densos', lines: ['Word2Vec', 'GloVe'], fill: '#ede9fe' },
        { id: 'context', x: 580, y: 160, width: 180, title: 'Contextualizados', lines: ['ELMo', 'BERT'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'onehot', to: 'tfidf' },
        { from: 'tfidf', to: 'dense' },
        { from: 'dense', to: 'context' },
      ],
    }),
  'snlp-chapter-5/evolucion': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'bow', x: 40, y: 160, width: 150, title: 'Bag-of-Words', lines: ['Conteo'] },
        { id: 'embed', x: 200, y: 160, width: 150, title: 'Embeddings', lines: ['Word2Vec/GloVe'] },
        { id: 'rnn', x: 360, y: 160, width: 150, title: 'RNN/LSTM', lines: ['Contexto secuencial'] },
        { id: 'transformer', x: 520, y: 160, width: 170, title: 'Transformers', lines: ['Atención'], fill: '#ede9fe' },
        { id: 'llm', x: 700, y: 160, width: 150, title: 'LLM', lines: ['Escalado masivo'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'bow', to: 'embed' },
        { from: 'embed', to: 'rnn' },
        { from: 'rnn', to: 'transformer' },
        { from: 'transformer', to: 'llm' },
      ],
    }),
  'snlp-chapter-6/evolucion': (altText) =>
    createDiagram(altText, {
      nodes: [
        { id: 'hmm', x: 60, y: 160, width: 160, title: 'HMM', lines: ['Modelos estadísticos'] },
        { id: 'gmm', x: 240, y: 160, width: 160, title: 'GMM-HMM', lines: ['Acústica mejorada'] },
        { id: 'dnn', x: 420, y: 160, width: 160, title: 'DNN híbridos', lines: ['CNN/RNN'] },
        { id: 'e2e', x: 600, y: 160, width: 160, title: 'End-to-end', lines: ['CTC', 'Attention'], fill: '#dcfce7' },
      ],
      links: [
        { from: 'hmm', to: 'gmm' },
        { from: 'gmm', to: 'dnn' },
        { from: 'dnn', to: 'e2e' },
      ],
    }),
};
