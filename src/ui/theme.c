#include "theme.h"

static ui_theme_t theme = {
    .window_width = 1200,
    .window_height = 800,
    .font_size = 18,
    .bg_color = 0xFFFAFAFA,
    .panel_color = 0xFFF0F0F0,
    .accent_color = 0xFF0078D7
};

const ui_theme_t* ui_get_theme(void) { return &theme; }
