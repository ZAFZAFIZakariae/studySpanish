import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SubjectsPage from '../SubjectsPage';
import { ResourceLink } from '../../types/subject';

jest.mock('../../components/SummaryQuiz', () => ({
  __esModule: true,
  default: () => null,
}));

function makeResource(overrides: Partial<ResourceLink> & { label: string; href: string }): ResourceLink {
  return {
    label: overrides.label,
    href: overrides.href,
    filePath:
      overrides.filePath ?? 'subjects/Ggo/T3. Alineación de negocio y SI_TI. Bedell/Methodology placeholder.pdf',
    type: overrides.type ?? 'pdf',
    extract: {
      source:
        overrides.extract?.source ??
        overrides.filePath ??
        'subjects/Ggo/T3. Alineación de negocio y SI_TI. Bedell/Methodology placeholder.pdf',
      text: overrides.extract?.text ?? 'Fallback extract text',
      ...(overrides.extract?.notes ? { notes: overrides.extract.notes } : {}),
    },
    ...(overrides.description ? { description: overrides.description } : {}),
  };
}

jest.mock('../../data/subjectResources', () => ({
  subjectResourceLibrary: {
    ggo: [
      makeResource({
        label:
          'T3. Alineación de negocio y SI TI. Bedell › Methodology for Business Value Analysis of Innovative IT in a Business Sector. The Case of the Material Supply Chain (PDF)',
        href: '#t3-bedell',
        filePath:
          'subjects/Ggo/T3. Alineación de negocio y SI_TI. Bedell/Methodology for Business Value Analysis of Innovative IT in a Business Sector. The Case of the Material Supply Chain.pdf',
      }),
      makeResource({
        label: 'T1. Intro Gobierno de TI › 23 Introducción a Gobierno de TI (PDF)',
        href: '#t1-intro',
        filePath: 'subjects/Ggo/T1. Intro Gobierno de TI/23 Introducción a Gobierno de TI.pdf',
      }),
    ],
  },
}));

describe('SubjectsPage original content', () => {
  it('prefers authored original text even when a fallback extract exists', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    );

    const subjectButton = await screen.findByRole('button', {
      name: /gobierno de tecnologías de la información/i,
    });
    await user.click(subjectButton);

    const detail = await screen.findByRole('article');
    await within(detail).findByRole('heading', {
      name: /tema 1 · introducción a gobierno de ti/i,
    });

    await user.click(within(detail).getByRole('tab', { name: /original/i }));

    const originalRegion = within(detail).getByRole('region', { name: /original content/i });
    expect(within(originalRegion).queryByText(/showing extracted text from/i)).not.toBeInTheDocument();
    expect(
      within(originalRegion).getByRole('heading', {
        name: /topic 1 · introduction to it governance/i,
      })
    ).toBeInTheDocument();
  });
});
