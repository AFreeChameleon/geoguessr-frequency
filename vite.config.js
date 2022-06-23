import { defineConfig } from 'vite';

/**
 * @param match
 * Regular expression in string or Regexp type,
 *  or a match predicate  (this: vite transform context, code: string, id: file name string) => void
 * @returns transformed code
 */
import plainText from 'vite-plugin-plain-text';

export default defineConfig({
  plugins: [
    // passing string type Regular expression
    plainText(/world$/),
  ],
});