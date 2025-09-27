export interface ResourceLink {
  label: string;
  href: string;
  description?: string;
  type?: 'pdf' | 'slides' | 'worksheet';
}

export const subjectResourceLibrary: Record<string, ResourceLink[]> = {
  sad: [
    {
      label: 'Session 0 overview slides (PDF)',
      href: new URL('../../subjects/Sad/0_Presentation.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Session 1 introduction deck (PDF)',
      href: new URL('../../subjects/Sad/Session_1_Introduction_Deck_Bullets_Notes.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Session 2 microservices deck (PDF)',
      href: new URL('../../subjects/Sad/Session_2_Microservices_Bullets_Notes.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Session 3 cloud service models deck (PDF)',
      href: new URL('../../subjects/Sad/Session_3_Cloud_Service_Models_Bullets_Notes.pdf', import.meta.url).href,
      type: 'slides',
    },
  ],
  ggo: [
    {
      label: 'Introducción a Gobierno de TI slides (PDF)',
      href: new URL('../../subjects/Ggo/T1. Intro Gobierno de TI/23 Introducción a Gobierno de TI.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Valor de TI lecture slides (PDF)',
      href: new URL('../../subjects/Ggo/T2. Valor de TI/23 Valor TI.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Alineación de negocio y TI slides (PDF)',
      href: new URL('../../subjects/Ggo/T3. Alineación de negocio y SI_TI. Bedell/22 Alineación.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Método Bedell worksheet (PDF)',
      href: new URL(
        "../../subjects/Ggo/T3. Alineación de negocio y SI_TI. Bedell/Calcular la imp del stma de información Método Bedell_VA_1.pdf",
        import.meta.url
      ).href,
      type: 'worksheet',
    },
    {
      label: 'Stakeholder analysis template (PDF)',
      href: new URL('../../subjects/Ggo/T3. Alineación de negocio y SI_TI. Bedell/Análisis de stakeholders 2024.pdf', import.meta.url).href,
      type: 'worksheet',
    },
  ],
  snlp: [
    {
      label: 'Chapter 1 slides (PDF)',
      href: new URL('../../subjects/snlp/slides/Chapter 1.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Chapter 2 slides (PDF)',
      href: new URL('../../subjects/snlp/slides/Chapter 2.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Chapter 3 Keras slides (PDF)',
      href: new URL('../../subjects/snlp/slides/Chapter 3 KERAS.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Chapter 4 NLP slides (PDF)',
      href: new URL('../../subjects/snlp/slides/Chapter 4 NLP.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Chapter 5 LLM slides (PDF)',
      href: new URL('../../subjects/snlp/slides/Chapter 5 LLM.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Chapter 6 Speech slides (PDF)',
      href: new URL('../../subjects/snlp/slides/Chapter 6 SPEECH.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Assignments overview (PDF)',
      href: new URL('../../subjects/snlp/slides/Assignments.pdf', import.meta.url).href,
      type: 'worksheet',
    },
    {
      label: 'Poster presentation template (PDF)',
      href: new URL('../../subjects/snlp/slides/Presentation.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Lab session 1 pre-work (PDF)',
      href: new URL('../../subjects/snlp/lab/PRE-WORK Lab Session 1.pdf', import.meta.url).href,
      type: 'worksheet',
    },
    {
      label: 'Lab session 2 guide (PDF)',
      href: new URL('../../subjects/snlp/lab/Lab Session 2.pdf', import.meta.url).href,
      type: 'worksheet',
    },
    {
      label: 'Lab session 3 guide (PDF)',
      href: new URL('../../subjects/snlp/lab/Lab Session 3.pdf', import.meta.url).href,
      type: 'worksheet',
    },
  ],
  admeav: [
    {
      label: 'Presentation overview (PDF)',
      href: new URL('../../subjects/Admeav/Teoria/slides/T0_Presentation.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Hand-crafted feature extraction slides (PDF)',
      href: new URL('../../subjects/Admeav/Teoria/slides/T1_Hand crafted feature extraction.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'CNN feature extraction slides (PDF)',
      href: new URL('../../subjects/Admeav/Teoria/slides/T2_CNN based feature extraction _1_.pdf', import.meta.url).href,
      type: 'slides',
    },
  ],
  dbd: [
    {
      label: 'Presentación inicial (PDF)',
      href: new URL('../../subjects/Dbd/presentacionDBD.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Planificación de prácticas (PDF)',
      href: new URL('../../subjects/Dbd/Planificación_prácticas.pdf', import.meta.url).href,
      type: 'worksheet',
    },
    {
      label: 'Tema 1 teoría (PDF)',
      href: new URL('../../subjects/Dbd/Teoria/tema1_DBD.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Tema 2 teoría (PDF)',
      href: new URL('../../subjects/Dbd/Teoria/tema2_DBD.pdf', import.meta.url).href,
      type: 'slides',
    },
    {
      label: 'Cuestiones tema 2 (PDF)',
      href: new URL('../../subjects/Dbd/Teoria/Cuestiones _T2_.pdf', import.meta.url).href,
      type: 'worksheet',
    },
    {
      label: 'Cuestiones tema 2 solución (PDF)',
      href: new URL('../../subjects/Dbd/Teoria/Cuestiones _T2__Solución.pdf', import.meta.url).href,
      type: 'worksheet',
    },
  ],
};
