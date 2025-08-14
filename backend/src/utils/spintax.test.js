const { spin } = require('./spintax');

describe('Spintax Engine', () => {
  it('should process a simple spintax pattern', () => {
    const text = '{Hello|Hi|Hey} Jules';
    const result = spin(text);
    expect(['Hello Jules', 'Hi Jules', 'Hey Jules']).toContain(result);
  });

  it('should process multiple spintax patterns in one string', () => {
    const text = '{Hello|Hi}, {how are you|how is it going}?';
    const result = spin(text);
    const possibleResults = [
      'Hello, how are you?',
      'Hello, how is it going?',
      'Hi, how are you?',
      'Hi, how is it going?',
    ];
    expect(possibleResults).toContain(result);
  });

  it('should process nested spintax patterns', () => {
    const text = '{Hello|{Hi|Hey}} world';
    const result = spin(text);
    expect(['Hello world', 'Hi world', 'Hey world']).toContain(result);
  });

  it('should return the original string if no spintax is present', () => {
    const text = 'This is a normal string.';
    const result = spin(text);
    expect(result).toBe(text);
  });

  it('should handle a single option', () => {
    const text = '{Hello} world';
    const result = spin(text);
    expect(result).toBe('Hello world');
  });
});
