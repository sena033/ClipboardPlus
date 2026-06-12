#include <stdio.h>
#include "note.h"
#include "ui.h"

int main(int argc, char** argv) {
    printf("Starting SecondBrain...\n");
    if (!ui_init()) {
        fprintf(stderr, "Failed to initialize UI\n");
        return 1;
    }
    // Try to load an example note if exists, otherwise demo
    note_t demo;
    if (filemgr_load_note("notes/demo.md", &demo) != 0) {
        note_init(&demo, "Welcome", "# Welcome to SecondBrain\n\nThis is a demo note.\n");
    }

    ui_run(&demo);

    note_free(&demo);
    ui_shutdown();
    return 0;
}
