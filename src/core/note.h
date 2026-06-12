#ifndef NOTE_H
#define NOTE_H

#include <stdlib.h>

typedef struct note {
    char* title;
    char* content;
} note_t;

void note_init(note_t* n, const char* title, const char* content);
void note_free(note_t* n);

// Duplicate a note
int note_clone(const note_t* src, note_t* dst);

#endif // NOTE_H
