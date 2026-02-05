import { Mark, mergeAttributes } from '@tiptap/core';

export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

export const CommentMark = Mark.create<CommentOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            'data-comment-id': attributes.id,
            'class': 'comment-highlight cursor-pointer bg-yellow-200/50 border-b-2 border-yellow-400 hover:bg-yellow-300/50 transition-colors',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setComment:
        (attributes) =>
        ({ commands }: any) => {
          return commands.setMark(this.name, attributes);
        },
      unsetComment:
        (attributes) =>
        ({ commands }: any) => {
          return commands.unsetMark(this.name, { id: attributes.id });
        },
    } as any;
  },
});