import React, { useState } from 'react';

export const ConjugationTable: React.FC<{ expected: string[] }> = ({ expected }) => {
  const [answers, setAnswers] = useState<string[]>(Array(expected.length).fill(''));

  const handleChange = (i: number, val: string) => {
    const copy = [...answers];
    copy[i] = val;
    setAnswers(copy);
  };

  return (
    <table className="table-auto border">
      <tbody>
        {expected.map((exp, i) => (
          <tr key={i}>
            <td className="border px-2">{i+1}</td>
            <td className="border px-2">
              <input
                className="border p-1"
                value={answers[i]}
                onChange={e => handleChange(i, e.target.value)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
