import React from 'react';
import styles from './ConjugationTable.module.css';

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
    <div className={styles.tableWrapper}>
      <table className={styles.table} aria-label="Conjugation practice table">
        <thead>
          <tr>
            <th>Form</th>
            <th>Your answer</th>
          </tr>
        </thead>
        <tbody>
          {expected.map((_, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  className={styles.input}
                  value={values[index] ?? ''}
                  aria-label={`Answer for conjugation cell ${index + 1}`}
                  onChange={(event) => handleChange(index, event.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
