import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SubjectsPage from '../SubjectsPage';
import AppShell from '../../components/layout/AppShell';
import { subjectCatalog } from '../../data/subjectCatalog';

jest.mock('../../data/subjectResources', () => ({
  subjectResourceLibrary: {}
}));

describe('SubjectsPage', () => {
  it('shows summary and translation details for Distributed Applications session 1', async () => {
    render(
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    );

    const detail = await screen.findByRole('article');
    const summarySection = within(detail).getByRole('region', { name: /lesson summary/i });

    expect(within(summarySection).getByText(/we kicked off with the full syllabus walkthrough/i)).toBeInTheDocument();
    expect(within(summarySection).getByText(/dimos la bienvenida al curso repasando el sílabo completo/i)).toBeInTheDocument();

    const translationSection = within(detail).getByRole('region', { name: /translation notes/i });
    expect(within(translationSection).getByText(/english in progress/i)).toBeInTheDocument();
    expect(within(translationSection).getByText(/notas bilingües con el vocabulario administrativo clave/i)).toBeInTheDocument();
  });

  it('lists advanced database theory units including temas 3 y 4', async () => {
    render(
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const dbdButton = await screen.findByRole('button', { name: /diseño de bases de datos/i });
    await user.click(dbdButton);

    expect(await screen.findByRole('button', { name: /tema 3 · dependencias avanzadas y 4fn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tema 4 · transacciones y concurrencia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cuestiones tema 3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cuestiones tema 4/i })).toBeInTheDocument();
  });

  it('displays every subject with its tagline in the sidebar', async () => {
    render(
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    );

    const sidebar = await screen.findByRole('navigation', { name: /study subjects/i });

    subjectCatalog.forEach((subject) => {
      const subjectButton = within(sidebar).getByRole('button', { name: new RegExp(subject.name, 'i') });
      expect(within(subjectButton).getByText(subject.name)).toBeInTheDocument();
      expect(within(subjectButton).getByText(subject.tagline)).toBeInTheDocument();
    });
  });

  it('selects the first subject when navigating via the header link', async () => {
    const user = userEvent.setup();
    const firstSubject = subjectCatalog[0];
    if (!firstSubject) {
      throw new Error('Subject catalog is empty');
    }
    const focusedSubject = subjectCatalog.find((subject) => subject.id === 'snlp');
    if (!focusedSubject) {
      throw new Error('Expected SNLP subject to be present in the catalog');
    }

    render(
      <MemoryRouter initialEntries={[`/subjects?focus=${focusedSubject.slug}`]}>
        <AppShell highContrastEnabled={false} onToggleHighContrast={() => {}}>
          <Routes>
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/spanish" element={<h1>Spanish resources</h1>} />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    const initialDetail = await screen.findByRole('article');
    expect(within(initialDetail).getByText(focusedSubject.name)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /^spanish$/i }));
    await screen.findByRole('heading', { name: /spanish resources/i });

    await user.click(screen.getByRole('link', { name: /^subjects$/i }));

    const detail = await screen.findByRole('article');
    expect(within(detail).getByText(firstSubject.name)).toBeInTheDocument();
  });
});
