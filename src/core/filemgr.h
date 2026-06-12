#ifndef FILEMGR_H
#define FILEMGR_H

#include "note.h"

// Load a note from path. Returns 0 on success, -1 on failure.
int filemgr_load_note(const char* path, note_t* out);
// Save a note to path. Returns 0 on success, -1 on failure.
int filemgr_save_note(const char* path, const note_t* note);

// Ensure notes directory exists. Returns 0 on success.
int filemgr_ensure_notes_dir(void);

// List notes in notes directory. Caller must free returned array via filemgr_free_list.
// Returns number of entries, sets *out_list to malloc'ed array of char* (each malloc'ed).
int filemgr_list_notes(char*** out_list);
void filemgr_free_list(char** list, int count);

#endif // FILEMGR_H
