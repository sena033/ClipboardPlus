#ifndef RTEXT_EXTRA_H
#define RTEXT_EXTRA_H

#include <raylib.h>

// Draw text using font inside rectangle limits with word wrapping
// DrawTextRec was removed from raylib (CHANGELOG: "moved to example").
// This is a minimal replacement matching the removed API signature.
void DrawTextRec(Font font, const char *text, Rectangle rec, float fontSize,
                 float spacing, bool wordWrap, Color tint);

#endif // RTEXT_EXTRA_H
