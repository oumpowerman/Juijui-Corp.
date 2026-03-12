
import { Extension, combineTransactionSteps, getChangedRanges } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchHighlight: {
      setSearchTerm: (searchTerm: string) => ReturnType;
    };
  }
}

export const SearchHighlightExtension = Extension.create({
  name: 'searchHighlight',

  addOptions() {
    return {
      searchResultClass: 'bg-yellow-200 text-black rounded-sm shadow-[0_0_0_1px_rgba(252,211,77,1)]',
    };
  },

  addStorage() {
    return {
      searchTerm: '',
    };
  },

  addCommands() {
    return {
      setSearchTerm: (searchTerm: string) => ({ tr, dispatch }) => {
        this.storage.searchTerm = searchTerm;
        if (dispatch) {
          tr.setMeta('searchHighlightChanged', true);
        }
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey('searchHighlight'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState, oldEditorState, newEditorState) {
            const searchTerm = extension.storage.searchTerm;
            
            if (!searchTerm || searchTerm.length < 2) {
              return DecorationSet.empty;
            }

            // Re-calculate decorations if document, search term, or selection changed
            if (tr.docChanged || tr.getMeta('searchHighlightChanged') || tr.getMeta('setSearchTerm') || tr.selectionSet) {
              const decorations: Decoration[] = [];
              const { doc } = tr;
              const { selection } = newEditorState;
              const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

              doc.descendants((node, pos) => {
                if (node.isText && node.text) {
                  const matches = node.text.matchAll(regex);
                  for (const match of matches) {
                    if (match.index !== undefined) {
                      const from = pos + match.index;
                      const to = pos + match.index + match[0].length;
                      
                      // Check if this match is the current selection
                      const isCurrent = selection.from === from && selection.to === to;
                      
                      decorations.push(
                        Decoration.inline(from, to, {
                          class: isCurrent 
                            ? 'bg-indigo-600 text-white rounded-sm shadow-[0_0_0_2px_rgba(79,70,229,1)] z-10 relative' 
                            : extension.options.searchResultClass,
                        })
                      );
                    }
                  }
                }
              });

              return DecorationSet.create(doc, decorations);
            }

            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
