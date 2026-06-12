#ifndef THEME_H
#define THEME_H

// Theme colors and sizes for modernized UI
typedef struct {
    int window_width;
    int window_height;
    int font_size;
    unsigned int bg_color;
    unsigned int panel_color;
    unsigned int accent_color;
} ui_theme_t;

const ui_theme_t* ui_get_theme(void);

#endif // THEME_H
