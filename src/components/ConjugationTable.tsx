import React from 'react';

interface ConjugationTableProps {
  expected: string[];
  values: string[];
  onChange: (values: string[]) => void;
}

export const ConjugationTable: React.FC<ConjugationTableProps> = ({ expected, values, onChange }) => {
  const handleChange = (index: number, value: string) => {
    const copy = [...values];
    copy[index] = value;
    onChange(copy);
  };

  return (
    <table className="table-auto border" aria-label="Conjugation practice table">
      <thead>
        <tr>
          <th className="border px-2 py-1 text-left">Form</th>
          <th className="border px-2 py-1 text-left">Your answer</th>
        </tr>
      </thead>
      <tbody>
        {expected.map((_, index) => (
          <tr key={index}>
            <td className="border px-2 py-1">{index + 1}</td>
            <td className="border px-2 py-1">
              <input
                className="border p-1 w-full"
                value={values[index] ?? ''}
                aria-label={`Answer for conjugation cell ${index + 1}`}
                onChange={(event) => handleChange(index, event.target.value)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
