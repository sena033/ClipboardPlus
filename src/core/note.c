#include "note.h"
#include <stdlib.h>
#include <string.h>

void note_init(note_t* n, const char* title, const char* content) {
    n->title = strdup(title);
    n->content = strdup(content);
}

void note_free(note_t* n) {
    if (n->title) free(n->title);
    if (n->content) free(n->content);
    n->title = NULL; n->content = NULL;
}

int note_clone(const note_t* src, note_t* dst) {
    if (!src || !dst) return -1;
    dst->title = src->title ? strdup(src->title) : NULL;
    dst->content = src->content ? strdup(src->content) : NULL;
    return 0;
}
