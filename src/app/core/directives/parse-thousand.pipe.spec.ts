import { ParseThousandPipe } from './parse-thousand.pipe';

describe('ParseThousandPipe', () => {
  it('create an instance', () => {
    const pipe = new ParseThousandPipe();
    expect(pipe).toBeTruthy();
  });
});
