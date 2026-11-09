import { findAndReplace } from 'mdast-util-find-and-replace';

// Builds a node that remark-rehype turns into the given HTML tag.
const inline = (tag, value) => ({
  type: 'emphasis',
  data: { hName: tag },
  children: [{ type: 'text', value }],
});

export default function remarkInlineMarks() {
  return (tree) => {
    findAndReplace(tree, [
      // ==highlight==  ->  <mark>highlight</mark>
      [/==(?=\S)([^=\n]+?)(?<=\S)==/g, (_, text) => inline('mark', text)],
      // ~sub~          ->  <sub>sub</sub>   (no spaces inside)
      [/~([^\s~]+)~/g, (_, text) => inline('sub', text)],
      // ^sup^          ->  <sup>sup</sup>   (no spaces inside)
      [/\^([^\s^]+)\^/g, (_, text) => inline('sup', text)],
    ]);
  };
}