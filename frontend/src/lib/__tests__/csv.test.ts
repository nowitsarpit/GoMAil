import { describe, it, expect } from 'vitest';
import { parseCsvSimple } from '../csv';

describe('parseCsvSimple', () => {
  it('handles empty input', () => {
    expect(parseCsvSimple('')).toEqual({ headers: [], rows: [] });
    expect(parseCsvSimple('   \n  \n')).toEqual({ headers: [], rows: [] });
  });

  it('parses basic csv headers and rows', () => {
    const csv = `email,firstName,company
john@example.com,John,Acme Corp
jane@example.com,Jane,Globex`;

    const { headers, rows } = parseCsvSimple(csv);
    expect(headers).toEqual(['email', 'firstName', 'company']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      email: 'john@example.com',
      firstName: 'John',
      company: 'Acme Corp',
    });
    expect(rows[1]).toEqual({
      email: 'jane@example.com',
      firstName: 'Jane',
      company: 'Globex',
    });
  });

  it('handles quoted fields with embedded commas', () => {
    const csv = `name,address
"Smith, John","123 Main St, Suite 400"`;

    const { headers, rows } = parseCsvSimple(csv);
    expect(headers).toEqual(['name', 'address']);
    expect(rows[0]).toEqual({
      name: 'Smith, John',
      address: '123 Main St, Suite 400',
    });
  });

  it('handles escaped quotes inside quoted fields', () => {
    const csv = `title,quote
Book,"He said ""Hello world"" to everyone"`;

    const { headers, rows } = parseCsvSimple(csv);
    expect(headers).toEqual(['title', 'quote']);
    expect(rows[0]).toEqual({
      title: 'Book',
      quote: 'He said "Hello world" to everyone',
    });
  });
});
