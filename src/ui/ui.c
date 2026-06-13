#include "ui.h"
#include "theme.h"
#include <raylib.h>
#include "../core/filemgr.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../core/markdown.h"
#include "../core/graph.h"

// Simple editor state
static char* edit_buf = NULL;
static size_t edit_len = 0;
static size_t edit_cap = 0;

static char* preview_buf = NULL;
static size_t preview_cap = 0;

static md_graph_t graph = {0};

static void ensure_edit_cap(size_t want) {
    if (want <= edit_cap) return;
    size_t ncap = edit_cap ? edit_cap * 2 : 4096;
    while (ncap < want) ncap *= 2;
    char* tmp = realloc(edit_buf, ncap);
    if (!tmp) return;
    edit_buf = tmp; edit_cap = ncap;
}

static void ensure_preview_cap(size_t want) {
    if (want <= preview_cap) return;
    size_t ncap = preview_cap ? preview_cap * 2 : 8192;
    while (ncap < want) ncap *= 2;
    char* tmp = realloc(preview_buf, ncap);
    if (!tmp) return;
    preview_buf = tmp; preview_cap = ncap;
}

int ui_init(void) {
    const ui_theme_t* theme = ui_get_theme();
    InitWindow(theme->window_width, theme->window_height, "SecondBrain - Modern");
    SetTargetFPS(60);
    // initialize buffers
    ensure_edit_cap(8192);
    ensure_preview_cap(8192);
    return 1;
}

void ui_shutdown(void) {
    md_graph_free(&graph);
    free(edit_buf); edit_buf = NULL; edit_cap = 0; edit_len = 0;
    free(preview_buf); preview_buf = NULL; preview_cap = 0;
    CloseWindow();
}

// Load note content into editor buffer
static void load_note_into_editor(const note_t* note) {
    if (!note) return;
    size_t len = note->content ? strlen(note->content) : 0;
    ensure_edit_cap(len + 1);
    if (len) memcpy(edit_buf, note->content, len);
    edit_buf[len] = '\0';
    edit_len = len;
}

// Update preview from editor
static void update_preview(void) {
    ensure_preview_cap(edit_len * 2 + 1024);
    int written = markdown_render_to_text(edit_buf ? edit_buf : "", preview_buf, preview_cap);
    (void)written;
    // update graph
    md_graph_free(&graph);
    md_graph_parse(edit_buf ? edit_buf : "", &graph);
}

// Save editor content back to note
static void flush_editor_to_note(note_t* note) {
    if (!note) return;
    free(note->content);
    note->content = strdup(edit_buf ? edit_buf : "");
}

void ui_run(note_t* note) {
    const ui_theme_t* theme = ui_get_theme();
    // initialize editor with note
    load_note_into_editor(note);
    update_preview();

    Rectangle editor_rect = { 20, 80, theme->window_width/2 - 40, theme->window_height - 160 };
    Rectangle preview_rect = { theme->window_width/2 + 20, 80, theme->window_width/2 - 40, theme->window_height - 160 };

    while (!WindowShouldClose()) {
        // Input handling: capture typed chars
        int cp = GetCharPressed();
        while (cp > 0) {
            // append utf8 single-byte (simplified)
            if (cp < 128) {
                ensure_edit_cap(edit_len + 2);
                edit_buf[edit_len++] = (char)cp;
                edit_buf[edit_len] = '\0';
            }
            cp = GetCharPressed();
        }
        if (IsKeyPressed(KEY_BACKSPACE)) {
            if (edit_len > 0) { edit_len--; edit_buf[edit_len] = '\0'; }
        }
        if (IsKeyPressed(KEY_ENTER)) {
            ensure_edit_cap(edit_len + 2);
            edit_buf[edit_len++] = '\n'; edit_buf[edit_len] = '\0';
        }

        // Shortcuts
        if (IsKeyDown(KEY_LEFT_CONTROL) && IsKeyPressed(KEY_S)) {
            // save to demo.md
            filemgr_ensure_notes_dir();
            note_t tmp; tmp.title = NULL; tmp.content = NULL;
            tmp.title = strdup(note->title);
            tmp.content = strdup(edit_buf ? edit_buf : "");
            filemgr_save_note("notes/demo.md", &tmp);
            note_free(&tmp);
        }

        // Update preview when buffer changed (simple strategy)
        update_preview();

        BeginDrawing();
        ClearBackground((Color){ 250,250,250,255 });

        // Header
        DrawRectangle(0, 0, theme->window_width, 64, (Color){ 0x00,0x78,0xD7,255 });
        DrawText(note->title, 24, 16, 28, WHITE);

        // Editor box
        DrawRectangleRec(editor_rect, (Color){ 240,240,240,255 });
        DrawTextRec(GetFontDefault(), edit_buf ? edit_buf : "", editor_rect, theme->font_size, 1.4f, true, (Color){ 34,34,34,255 });

        // Preview box
        DrawRectangleRec(preview_rect, (Color){ 248,248,248,255 });
        DrawTextRec(GetFontDefault(), preview_buf ? preview_buf : "", preview_rect, theme->font_size, 1.4f, true, (Color){ 80,80,80,255 });

        // Graph (list) at bottom
    int gx = 20, gy = theme->window_height - 60;
        DrawText("Links:", gx, gy, 16, (Color){64,64,64,255});
        gx += 70;
        for (size_t i = 0; i < graph.count && i < 20; ++i) {
            DrawText(graph.nodes[i], gx, gy, 16, (Color){0,120,215,255});
            gx += 120;
            if (gx > 900) { gx = 10; gy += 20; }
        }

        EndDrawing();
    }

    // flush editor back to note
    flush_editor_to_note(note);
}
