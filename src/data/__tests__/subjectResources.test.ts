import { getSubjectExtract } from '../../data/subjectExtracts';

describe('subject extract registry', () => {
  it('stores extracted text for the Valor de TI PDF', () => {
    const extract = getSubjectExtract('subjects/Ggo/T2. Valor de TI/23 Valor TI.pdf');

    expect(extract).toBeDefined();
    expect(extract?.text).toContain('### Page 1');
  });
});
