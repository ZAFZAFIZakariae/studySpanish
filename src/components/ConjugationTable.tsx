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
    <table
      className="min-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 text-sm shadow-inner"
      aria-label="Conjugation practice table"
    >
      <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        <tr>
          <th className="px-3 py-2">Form</th>
          <th className="px-3 py-2">Your answer</th>
        </tr>
      </thead>
      <tbody>
        {expected.map((_, index) => (
          <tr key={index} className="odd:bg-white even:bg-slate-50">
            <td className="px-3 py-2 font-semibold text-slate-600">{index + 1}</td>
            <td className="px-3 py-2">
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
