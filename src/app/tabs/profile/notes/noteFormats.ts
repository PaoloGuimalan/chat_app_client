/* eslint-disable @typescript-eslint/no-explicit-any */
import { Quill } from 'react-quill';

const BlockEmbed = Quill.import('blots/block/embed');
class NoteDivider extends BlockEmbed {
  static blotName = 'note-divider';
  static tagName = 'div';
  static className = 'ql-divider';
  static value() { return true; }
}
Quill.register(NoteDivider);
Quill.import('ui/icons')['note-divider'] = '<svg viewBox="0 0 18 18"><path class="ql-stroke" d="M3 9h12"/></svg>';

export const noteToolbar = {
  container: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'bullet' }, { list: 'ordered' }, { list: 'check' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'link', 'note-divider'], ['clean'],
  ],
  handlers: {
    'note-divider': function(this: { quill: any }) {
      const range = this.quill.getSelection(true);
      this.quill.insertEmbed(range.index, 'note-divider', true, 'user');
      this.quill.setSelection(range.index + 1, 0, 'silent');
    },
  },
};
