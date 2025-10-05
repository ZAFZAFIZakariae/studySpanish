import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SubjectsPage from '../SubjectsPage';

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
});
