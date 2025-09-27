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
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    );

    const courseButton = await screen.findByRole('button', { name: /serie de clases magistrales/i });
    await user.click(courseButton);

    const sessionButton = await screen.findByRole('button', { name: /sesión 1 · introducción y fundamentos/i });
    await user.click(sessionButton);

    const detail = await screen.findByRole('article');
    const summarySection = within(detail).getByRole('region', { name: /lesson summary/i });

    expect(within(summarySection).getByText(/we catalogued architectural drivers/i)).toBeInTheDocument();
    expect(within(summarySection).getByText(/identificación de drivers arquitectónicos/i)).toBeInTheDocument();

    const translationSection = within(detail).getByRole('region', { name: /translation notes/i });
    expect(within(translationSection).getByText(/english in progress/i)).toBeInTheDocument();
    expect(within(translationSection).getByText(/glosario inglés-español/i)).toBeInTheDocument();
  });
});
