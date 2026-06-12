#ifndef UI_H
#define UI_H

#include "../core/note.h"

int ui_init(void);
void ui_run(note_t* note);
void ui_shutdown(void);

#endif // UI_H
