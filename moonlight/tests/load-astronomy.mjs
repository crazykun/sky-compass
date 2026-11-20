import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/vendor/astronomy.browser.min.js', import.meta.url), 'utf8');
const context = vm.createContext({ console, Date });
vm.runInContext(source, context, { filename: 'astronomy.browser.min.js' });

if (!context.Astronomy) throw new Error('Astronomy Engine did not initialize');
globalThis.Astronomy = context.Astronomy;
